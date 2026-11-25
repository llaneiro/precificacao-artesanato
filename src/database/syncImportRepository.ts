import { type SyncCursors,validCursor } from '../utils/syncCursor';
import { CLOUD_PATHS } from '../utils/cloudRecords';
import { getDatabase } from './database';
import { SYNC_TABLES,type SyncTable } from './syncSchema';
import { cloudPath,structuredFields } from '../utils/cloudRecords';
import type { SQLiteBindValue } from 'expo-sqlite';

export type RemoteRecord={tableName:SyncTable;globalId:string;revision:number;deleted:boolean;fields:Record<string,unknown>};
const parentTables:SyncTable[]=['materials','products','fixed_expenses','additional_expenses'];
const histories:SyncTable[]=['material_cost_history','pricing_history'];
const relations:SyncTable[]=['product_materials','product_additional_expenses'];
const settings:SyncTable[]=['pricing_settings','onboarding_state','dashboard_settings'];
type Identity={localKey:string;revision:number};

// Uma transação exclusiva: nunca importa parcialmente, nem gera novos envios.
export async function importRemoteRecords(uid:string,records:RemoteRecord[],cursors:SyncCursors={}):Promise<boolean>{
 const db=await getDatabase();
 let changed=false;
 await db.withExclusiveTransactionAsync(async tx=>{
   // Se houve edição desde a leitura remota, deixa o envio local ocorrer primeiro.
   const pending=await tx.getFirstAsync<{count:number}>('SELECT COUNT(*) count FROM sync_queue WHERE userId=?',uid);
   if(pending?.count)return;
   const ids=new Map<string,Identity>();
   const key=(table:SyncTable,id:string)=>table+':'+id;
   for(const r of await tx.getAllAsync<{tableName:SyncTable;globalId:string;localKey:string;revision:number}>('SELECT tableName,globalId,localKey,revision FROM sync_identity WHERE userId=?',uid))ids.set(key(r.tableName,r.globalId),r);
   const known=new Map(records.map(r=>[key(r.tableName,r.globalId),r]));
   if(known.size!==records.length)throw new Error('Registros remotos duplicados.');
   const updates=records.filter(r=>(ids.get(key(r.tableName,r.globalId))?.revision??0)<r.revision);
   async function saveCursors(){
     for(const [entity,cursor] of Object.entries(cursors)){
       if(!Object.values(CLOUD_PATHS).includes(entity)||!validCursor(cursor))throw new Error('Cursor remoto inválido.');
       await tx.runAsync(`INSERT INTO sync_cursor(userId,entity,seconds,nanoseconds) VALUES(?,?,?,?)
         ON CONFLICT(userId,entity) DO UPDATE SET seconds=excluded.seconds,nanoseconds=excluded.nanoseconds
         WHERE excluded.seconds>sync_cursor.seconds OR (excluded.seconds=sync_cursor.seconds AND excluded.nanoseconds>sync_cursor.nanoseconds)`,uid,entity,cursor.seconds,cursor.nanoseconds);
     }
   }
   if(!updates.length){await saveCursors();return;}
   await tx.runAsync('INSERT INTO sync_import_guard(userId) VALUES(?)',uid);
   async function reserve(table:SyncTable,id:string):Promise<number>{
     cloudPath(table,id);
     const existing=ids.get(key(table,id));
     if(existing)return Number(existing.localKey);
     if(!parentTables.includes(table)&&!histories.includes(table))throw new Error('Referência inválida.');
     // Reserva ID inclusive para entidade excluída: não reutilizar em histórico.
     const seq=await tx.getFirstAsync<{seq:number}>('SELECT seq FROM sqlite_sequence WHERE name=?',table);
     const max=await tx.getFirstAsync<{maxId:number}>('SELECT COALESCE(MAX(id),0) maxId FROM '+table);
     const next=Math.max(seq?.seq??0,max?.maxId??0)+1;
     if(!Number.isSafeInteger(next))throw new Error('Limite de identificadores.');
     if(seq)await tx.runAsync('UPDATE sqlite_sequence SET seq=? WHERE name=?',next,table);
     else await tx.runAsync('INSERT INTO sqlite_sequence(name,seq) VALUES(?,?)',table,next);
     await tx.runAsync('INSERT INTO sync_identity(userId,tableName,localKey,globalId,revision) VALUES(?,?,?,?,0)',uid,table,String(next),id);
     ids.set(key(table,id),{localKey:String(next),revision:0});
     return next;
   }
   async function reference(table:SyncTable,id:unknown,live:boolean){
     if(typeof id!=='string')throw new Error('Referência remota inválida.');
     const n=await reserve(table,id);
     if(live&&!await tx.getFirstAsync('SELECT id FROM '+table+' WHERE id=? AND userId=?',n,uid))throw new Error('Registro relacionado ainda indisponível.');
     return n;
   }
   async function apply(r:RemoteRecord){
     const table=r.tableName;
     const k=key(table,r.globalId);
     const old=ids.get(k);
     let fields={...r.fields};
     let local=old?.localKey;
     if(parentTables.includes(table)||histories.includes(table))local=String(await reserve(table,r.globalId));
     else if(settings.includes(table))local='account';
     else if(!r.deleted){
       fields.productId=await reference('products',fields.productId,true);
       if(table==='product_materials')fields.materialId=await reference('materials',fields.materialId,true);
       else fields.expenseId=await reference('additional_expenses',fields.expenseId,true);
       const relationKey=SYNC_TABLES[table].keys.map(col=>String(fields[col])).join(':');
       if(local&&local!==relationKey)throw new Error('Identidade de associação divergente.');
       local=relationKey;
     }
     if(!local){
       // Tombstone de relação desconhecida não precisa criar vínculo local.
       return;
     }
     const mapped=await tx.getFirstAsync<{globalId:string}>('SELECT globalId FROM sync_identity WHERE userId=? AND tableName=? AND localKey=?',uid,table,local);
     if(mapped&&mapped.globalId!==r.globalId)throw new Error('Associações concorrentes incompatíveis.');
     const keys=SYNC_TABLES[table].keys;
     const where=['userId=?',...keys.map(col=>col+'=?')].join(' AND ');
     const values:SQLiteBindValue[]=[uid,...(keys.length?local.split(':').map(Number):[])];
     if(r.deleted){
       // Não cascatar vínculos não confirmados pelo servidor.
       if(table==='products'){
         for(const rel of relations){
           if(await tx.getFirstAsync('SELECT 1 FROM '+rel+' WHERE userId=? AND productId=?',uid,Number(local)))throw new Error('Exclusão aguarda associações.');
         }
       }
       await tx.runAsync('DELETE FROM '+table+' WHERE '+where,...values);
     }else{
       if(table==='material_cost_history')fields.materialId=await reference('materials',fields.materialId,false);
       if(table==='pricing_history'){
         fields.productId=await reference('products',fields.productId,false);
         const snap=structuredCloneSafe(fields.snapshot);
         snap.productId=await reference('products',snap.productId,false);
         for(const m of snap.materials)m.materialId=await reference('materials',m.materialId,false);
         for(const e of snap.additionalExpenses)e.expenseId=await reference('additional_expenses',e.expenseId,false);
         for(const e of snap.financial.fixedExpenses)e.id=await reference('fixed_expenses',e.id,false);
         fields.snapshot=JSON.stringify(snap);
       }
       if(keys.includes('id' as never))fields.id=Number(local);
       const columns=Object.keys(fields);
       const args=columns.map(c=>{
         const v=fields[c];
         if(v===null||typeof v==='string'||(typeof v==='number'&&Number.isFinite(v)))return v;
         throw new Error('Valor remoto inválido.');
       });
       const exists=await tx.getFirstAsync('SELECT 1 FROM '+table+' WHERE '+where,...values);
       if(exists){
         const update=columns.filter(c=>!(keys as readonly string[]).includes(c));
         await tx.runAsync('UPDATE '+table+' SET '+update.map(c=>c+'=?').join(',')+' WHERE '+where,...update.map(c=>args[columns.indexOf(c)]),...values);
       }else await tx.runAsync('INSERT INTO '+table+' (userId,'+columns.join(',')+') VALUES ('+Array(columns.length+1).fill('?').join(',')+')',uid,...args);
     }
     await tx.runAsync('INSERT INTO sync_identity(userId,tableName,localKey,globalId,revision) VALUES(?,?,?,?,?) ON CONFLICT(userId,tableName,localKey) DO UPDATE SET revision=excluded.revision',uid,table,local,r.globalId,r.revision);
     ids.set(k,{localKey:local,revision:r.revision});
   }
   const order=[...parentTables,...histories,...settings,...relations];
   for(const t of relations)for(const r of updates.filter(r=>r.tableName===t&&r.deleted))await apply(r);
   for(const t of order)for(const r of updates.filter(r=>r.tableName===t&&!r.deleted))await apply(r);
   for(const t of [...histories,...settings,...parentTables])for(const r of updates.filter(r=>r.tableName===t&&r.deleted))await apply(r);
   // Evita histórico sintético criado na próxima inicialização se o envio estiver incompleto.
   if(await tx.getFirstAsync('SELECT 1 FROM materials m WHERE m.userId=? AND NOT EXISTS (SELECT 1 FROM material_cost_history h WHERE h.userId=m.userId AND h.materialId=m.id)',uid))throw new Error('Aguardando histórico do material.');
   await tx.runAsync('DELETE FROM sync_import_guard WHERE userId=?',uid);
   await saveCursors();
   changed=true;
 });
 return changed;
}
function structuredCloneSafe(value:unknown){
 const snap=JSON.parse(JSON.stringify(value));
 if(!snap||![1,2].includes(snap.version)||!Array.isArray(snap.materials)||!Array.isArray(snap.additionalExpenses)||!Array.isArray(snap.financial?.fixedExpenses))throw new Error('Histórico remoto incompatível.');
 return snap;
}

// Valida os campos antes de gerar SQL; nenhuma chave remota arbitrária chega ao banco.
export function decodeRemoteRecord(entity:string,id:string,raw:Record<string,unknown>):RemoteRecord{
 const table=raw.tableName as SyncTable;
 const globalId=raw.globalId as string;
 const [path,docId]=cloudPath(table,globalId);
 if(path!==entity||docId!==id||raw.schemaVersion!==2||typeof raw.revision!=='number'||!Number.isSafeInteger(raw.revision)||raw.revision<1||typeof raw.deleted!=='boolean')throw new Error('Documento remoto inválido.');
 const fields={...raw};
 for(const c of ['schemaVersion','tableName','globalId','revision','deleted','updatedAt'])delete fields[c];
 const serialized={...fields};
 if(table==='pricing_history'&&!raw.deleted)serialized.snapshot=JSON.stringify(fields.snapshot);
 const validated=structuredFields(table,JSON.stringify(serialized),raw.deleted);
 return {tableName:table,globalId,revision:raw.revision,deleted:raw.deleted,fields:validated};
}
