import { downloadCloudPhoto } from '../services/cloudProductPhoto';
import { importRemoteRecords } from '../database/syncImportRepository';
import { createContext,useContext,useEffect,useState,type ReactNode } from 'react';
import { AppState } from 'react-native';
import { useAuthContext } from './AuthContext';
import { getPendingRecords,acknowledgeRecord,syncStatus,recordSyncSuccess,getSyncCursors,isLegacyMigrated,markLegacyMigrated,getReferencedPhotos } from '../database/syncRepository';
import { sendRecord,migrateLegacyRecords,readRemoteRecords,SyncRevisionConflict } from '../services/cloudSync';
type Status={phase:'waiting'|'syncing'|'synced'|'pending'|'error';pending:number;lastSync:string|null;owner:string|null;remoteVersion?:number};
const initial:Status={phase:'waiting',pending:0,lastSync:null,owner:null};
const Context=createContext<Status>(initial);
// Um único worker, inclusive durante troca de sessão.
let activeWorker:Promise<void>|null=null;
export function SyncProvider({children}:{children:ReactNode}){
 const uid=useAuthContext().user?.uid;
 const [status,setStatus]=useState<Status>(initial);
 useEffect(()=>{
   let stopped=false;
   let timer:ReturnType<typeof setTimeout>|undefined;
   let failures=0;
   let migrated=false;
   let lastPull=0;
   let pullInterval=60000;
   let idlePulls=0;
   let photoRetry=false;
   let remoteVersion=0;
   setStatus({...initial,owner:uid??null});
   if(!uid)return;
   const schedule=(ms:number)=>{if(!stopped){if(timer)clearTimeout(timer);timer=setTimeout(tick,ms);}};
   async function tick(){
     if(stopped||AppState.currentState!=='active')return;
     if(activeWorker){schedule(2000);return;}
     const owner=uid!;
     activeWorker=(async()=>{
       try{
         const before=await syncStatus(owner);
         if(stopped)return;
         setStatus({owner,phase:before.pending||Date.now()-lastPull>=pullInterval?'syncing':before.lastSync?'synced':'waiting',...before,remoteVersion});
         if(!migrated){
           migrated=await isLegacyMigrated(owner);
           if(!migrated){
             migrated=await migrateLegacyRecords(owner,()=>!stopped&&AppState.currentState==='active');
             if(migrated)await markLegacyMigrated(owner);
           }
           if(!migrated)return;
         }
         const records=await getPendingRecords(owner);
         for(const record of records){
           if(stopped||AppState.currentState!=='active')return;
           await acknowledgeRecord(owner,record,await sendRecord(owner,record));
         }
         if(!stopped&&AppState.currentState==='active'&&(records.length>0||Date.now()-lastPull>=pullInterval)){
           const remote=await readRemoteRecords(owner,await getSyncCursors(owner));
           if(!stopped&&AppState.currentState==='active'){
             const changed=await importRemoteRecords(owner,remote.records,remote.cursors);
             if(changed)remoteVersion++;
             idlePulls=changed||records.length?0:idlePulls+1;
             pullInterval=idlePulls>=3?300000:idlePulls>=1?120000:60000;
             lastPull=Date.now();
             photoRetry=true;
           }
         }
         // Uma imagem indisponível não faz repetir as consultas às coleções.
         if(photoRetry&&!stopped&&AppState.currentState==='active'){
             let photoFailed=false;
             for(const filename of await getReferencedPhotos(owner)){
               if(stopped||AppState.currentState!=='active')return;
               try{if(await downloadCloudPhoto(owner,filename))remoteVersion++;}
               catch{photoFailed=true;}
             }
             photoRetry=photoFailed;
             if(photoFailed)throw new Error('Fotos aguardando sincronização.');
             await recordSyncSuccess(owner);
         }else if(records.length)await recordSyncSuccess(owner);
         const after=await syncStatus(owner);
         failures=0;
         if(!stopped)setStatus({owner,phase:after.pending?'pending':after.lastSync?'synced':'waiting',...after,remoteVersion});
       }catch(error){
         failures++;
         const info=await syncStatus(owner).catch(()=>({pending:0,lastSync:null}));
         if(!stopped)setStatus({owner,phase:error instanceof SyncRevisionConflict?'error':'pending',...info,remoteVersion});
       }
     })();
     try{await activeWorker;}finally{activeWorker=null;schedule(failures?Math.min(120000,5000*2**Math.min(failures,5)):5000);}
   }
   const listener=AppState.addEventListener('change',state=>{if(state==='active'){pullInterval=60000;idlePulls=0;if(Date.now()-lastPull>=30000)lastPull=0;schedule(0)}else if(timer)clearTimeout(timer);});
   schedule(0);
   return()=>{stopped=true;if(timer)clearTimeout(timer);listener.remove();};
 },[uid]);
 return <Context.Provider value={status.owner===uid?status:initial}>{children}</Context.Provider>;
}
export const useSyncStatus=()=>useContext(Context);
