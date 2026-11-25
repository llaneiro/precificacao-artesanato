import { laterCursor,type SyncCursors } from '../utils/syncCursor';
import { photoRef,prepareCloudPhoto } from './cloudProductPhoto';
import { validPhotoFilename,validPhotoData } from '../utils/photoIdentity';
import { collection, doc, getDocs, getFirestore, runTransaction, serverTimestamp, query, where, Timestamp } from 'firebase/firestore/lite';
import app,{auth} from './firebaseConfig';
import type { SyncRecord } from '../database/syncRepository';
import { syncTables,type SyncTable } from '../database/syncSchema';
import { cloudPath,structuredFields,sameFields } from '../utils/cloudRecords';
import { utf8Size } from '../utils/utf8Size';
const firestore=getFirestore(app);

function checkSession(uid:string){if(auth.currentUser?.uid!==uid)throw new Error('Sessão alterada.');}
function remoteRef(uid:string,table:SyncTable,id:string){return doc(firestore,'users',uid,...cloudPath(table,id));}
function validateRevision(revision:unknown):number {
  if(typeof revision!=='number'||!Number.isSafeInteger(revision)||revision<0||revision>=Number.MAX_SAFE_INTEGER)throw new Error('Revisão remota incompatível.');
  return revision;
}

// Copia também registros antigos que já não estão na fila local.
// Nunca altera o original nem substitui um documento que já foi migrado.
export async function migrateLegacyRecords(uid:string,active:()=>boolean){
  checkSession(uid);
  const legacy=await getDocs(collection(firestore,'users',uid,'syncRecords'));
  for(const item of legacy.docs){
    if(!active())return false;
    checkSession(uid);
    const raw=item.data();
    const table=raw.tableName as SyncTable;
    if(raw.schemaVersion!==1||!syncTables.includes(table)||item.id!==table+'_'+raw.globalId||typeof raw.payload!=='string'||typeof raw.deleted!=='boolean')throw new Error('Registro legado incompatível.');
    const ref=remoteRef(uid,table,raw.globalId);
    await runTransaction(firestore,async tx=>{
      const [target,source]=await Promise.all([tx.get(ref),tx.get(item.ref)]);
      checkSession(uid);
      if(!active())throw new Error('Sincronização interrompida.');
      if(target.exists())return;
      const old=source.data();
      if(!old||old.schemaVersion!==1||old.tableName!==table||old.globalId!==raw.globalId||typeof old.deleted!=='boolean'||typeof old.payload!=='string')throw new Error('Registro legado incompatível.');
      const revision=validateRevision(old.revision);
      if(revision<1||utf8Size(old.payload)>700000)throw new Error('Registro legado inválido.');
      const fields=structuredFields(table,old.payload,old.deleted);
      tx.set(ref,{...fields,schemaVersion:2,tableName:table,globalId:raw.globalId,revision,deleted:old.deleted,updatedAt:serverTimestamp()});
    });
  }
  return true;
}
// Fotos legadas não tinham proprietário do produto. Só adota uma foto quando
// a consulta confirma uma referência exclusiva, e as regras impedem novas
// referências a uma foto sem proprietário. Não varre arquivos órfãos.
async function adoptLegacyPhoto(uid:string,productId:string,filename:string){
  checkSession(uid);
  const refs=await getDocs(query(collection(firestore,'users',uid,'products'),where('photoFilename','==',filename)));
  if(refs.size!==1||refs.docs[0].id!==productId)return false;
  const ref=photoRef(uid,filename);
  const product=remoteRef(uid,'products',productId);
  return runTransaction(firestore,async tx=>{
    const [p,photo]=await Promise.all([tx.get(product),tx.get(ref)]);
    checkSession(uid);
    if(p.data()?.deleted||p.data()?.photoFilename!==filename||!photo.exists())return false;
    const old=photo.data()!;
    if(old.productId===productId)return true;
    if('productId' in old||old.schemaVersion!==1||!validPhotoData(old.base64))return false;
    tx.update(ref,{productId});
    return true;
  });
}

export class SyncRevisionConflict extends Error {
  constructor(){super('Conflito de sincronização.');}
}
export async function sendRecord(uid:string,record:SyncRecord){
  checkSession(uid);
  if(utf8Size(record.payload)>700000)throw new Error('Registro excede o limite da nuvem.');
  const fields=structuredFields(record.tableName,record.payload,!!record.deleted);
  const ref=remoteRef(uid,record.tableName,record.globalId);
  const newPhoto=record.tableName==='products'&&!record.deleted&&validPhotoFilename(fields.photoFilename)?fields.photoFilename:null;
  // A compressão é reutilizada caso o Firestore repita a transação.
  let encoded:Promise<string>|undefined;
  let attemptedAdoption=false;
  for(;;){
    const result=await runTransaction(firestore,async tx=>{
      const previous=await tx.get(ref);
      checkSession(uid);
      const data=previous.data();
      const revision=validateRevision(previous.exists()?data?.revision:0);
      if(data&&sameFields(data,fields,record.tableName,record.globalId,!!record.deleted))return {revision};
      if(record.tableName==='onboarding_state'&&!record.deleted&&data?.schemaVersion===2&&data.deleted===false&&typeof data.completedAt==='string')return {revision};
      if(revision!==record.revision)throw new SyncRevisionConflict();
      const oldPhoto=record.tableName==='products'&&validPhotoFilename(data?.photoFilename)?data.photoFilename:null;
      const replacing=oldPhoto!==newPhoto;
      const oldRef=oldPhoto&&replacing?photoRef(uid,oldPhoto):null;
      const newRef=newPhoto&&replacing?photoRef(uid,newPhoto):null;
      const [oldImage,newImage]=await Promise.all([oldRef?tx.get(oldRef):null,newRef?tx.get(newRef):null]);
      if(oldImage?.exists()&&!('productId' in oldImage.data()!)&&!attemptedAdoption)return {adopt:oldPhoto!};
      if(newImage?.exists()){
        const image=newImage.data()!;
        if(image.productId!==record.globalId||image.schemaVersion!==1||!validPhotoData(image.base64))throw new Error('Foto vinculada a outro produto.');
      }
      if(newRef&&!newImage?.exists()){
        const base64=await (encoded??=prepareCloudPhoto(newPhoto!));
        checkSession(uid);
        tx.set(newRef,{schemaVersion:1,mimeType:'image/jpeg',base64,productId:record.globalId,createdAt:serverTimestamp()});
      }
      tx.set(ref,{...fields,schemaVersion:2,tableName:record.tableName,globalId:record.globalId,revision:revision+1,deleted:!!record.deleted,updatedAt:serverTimestamp()});
      if(oldRef&&oldImage?.exists()&&oldImage.data()?.productId===record.globalId)tx.delete(oldRef);
      return {revision:revision+1};
    });
    if(result.revision!==undefined)return result.revision;
    if(!result.adopt||attemptedAdoption)throw new Error('Migração de foto incompatível.');
    attemptedAdoption=true;
    await adoptLegacyPhoto(uid,record.globalId,result.adopt);
  }
}

export async function readRemoteRecords(uid:string,cursors:SyncCursors){
  checkSession(uid);
  const {CLOUD_PATHS}=await import('../utils/cloudRecords');
  const {decodeRemoteRecord}=await import('../database/syncImportRepository');
  const names=[...new Set(Object.values(CLOUD_PATHS))];
  const snapshots=await Promise.all(names.map(name=>{
    const ref=collection(firestore,'users',uid,name);
    const cursor=cursors[name];
    // Inclusivo para não perder documentos com timestamp idêntico.
    return getDocs(cursor?query(ref,where('updatedAt','>=',new Timestamp(cursor.seconds,cursor.nanoseconds))):ref);
  }));
  checkSession(uid);
  const next:SyncCursors={};
  const records=snapshots.flatMap((snapshot,i)=>snapshot.docs.map(d=>{
    const data=d.data();
    if(!(data.updatedAt instanceof Timestamp))throw new Error('Timestamp remoto inválido.');
    const t={seconds:data.updatedAt.seconds,nanoseconds:data.updatedAt.nanoseconds};
    next[names[i]]=laterCursor(next[names[i]]??cursors[names[i]],t);
    return decodeRemoteRecord(names[i],d.id,data);
  }));
  return {records,cursors:next};
}
