import { type SyncCursors,validCursor } from '../utils/syncCursor';
import { getDatabase } from './database';
import { SYNC_TABLES, syncTables, localKey, type SyncTable } from './syncSchema';
type Row = Record<string,string|number|null>;
export interface SyncRecord { tableName:SyncTable; localKey:string; globalId:string; revision:number; generation:number; deleted:number; payload:string }
type QueueEntry=Omit<SyncRecord,'payload'>;

export async function getPendingRecords(uid:string):Promise<SyncRecord[]> {
  const db=await getDatabase();
  const records:SyncRecord[]=[];
  await db.withExclusiveTransactionAsync(async tx=>{
    const queue=await tx.getAllAsync<QueueEntry>(`
      SELECT q.tableName,q.localKey,q.generation,q.deleted,i.globalId,i.revision
      FROM sync_queue q JOIN sync_identity i ON i.userId=q.userId AND i.tableName=q.tableName AND i.localKey=q.localKey
      WHERE q.userId=? ORDER BY q.tableName,q.localKey
    `,uid);
    const identities=await tx.getAllAsync<{tableName:SyncTable;localKey:string;globalId:string}>('SELECT tableName,localKey,globalId FROM sync_identity WHERE userId=?',uid);
    const ids=new Map(identities.map(i=>[i.tableName+':'+i.localKey,i.globalId]));
    async function global(table:SyncTable,id:unknown) {
      const key=table+':'+String(id);
      const value=ids.get(key);
      if(value)return value;
      if(typeof id!=='number'||!Number.isSafeInteger(id)||id<=0)throw new Error('Referência histórica inválida.');
      await tx.runAsync("INSERT OR IGNORE INTO sync_identity(userId,tableName,localKey,globalId) VALUES(?,?,?,lower(hex(randomblob(16))))",uid,table,String(id));
      const created=await tx.getFirstAsync<{globalId:string}>('SELECT globalId FROM sync_identity WHERE userId=? AND tableName=? AND localKey=?',uid,table,String(id));
      if(!created)throw new Error('Identidade histórica indisponível.');
      ids.set(key,created.globalId);
      return created.globalId;
    }
    for(const entry of queue){
      if(!syncTables.includes(entry.tableName))throw new Error('Tabela de sincronização inválida.');
      let payload:Record<string,unknown>={};
      if(!entry.deleted){
        const row=await tx.getFirstAsync<Row>('SELECT '+SYNC_TABLES[entry.tableName].columns+' FROM '+entry.tableName+' t WHERE userId=? AND '+localKey(entry.tableName,'t')+'=?',uid,entry.localKey);
        if(!row)throw new Error('Registro pendente não encontrado.');
        payload={...row};
        delete payload.id;
        if('materialId' in payload)payload.materialId=await global('materials',payload.materialId);
        if('productId' in payload)payload.productId=await global('products',payload.productId);
        if('expenseId' in payload)payload.expenseId=await global('additional_expenses',payload.expenseId);
        if(entry.tableName==='pricing_history'){
          const snapshot=JSON.parse(String(payload.snapshot));
          snapshot.productId=await global('products',snapshot.productId);
          snapshot.materials=await Promise.all(snapshot.materials.map(async (m:Record<string,unknown>)=>({...m,materialId:await global('materials',m.materialId)})));
          snapshot.additionalExpenses=await Promise.all(snapshot.additionalExpenses.map(async (e:Record<string,unknown>)=>({...e,expenseId:await global('additional_expenses',e.expenseId)})));
          snapshot.financial.fixedExpenses=await Promise.all(snapshot.financial.fixedExpenses.map(async (e:Record<string,unknown>)=>({...e,id:await global('fixed_expenses',e.id)})));
          payload.snapshot=JSON.stringify(snapshot);
        }
      }
      records.push({...entry,payload:JSON.stringify(payload)});
    }
  });
  return records;
}
export async function acknowledgeRecord(uid:string,record:SyncRecord,revision:number){
  const db=await getDatabase();
  await db.withExclusiveTransactionAsync(async tx=>{
    await tx.runAsync('UPDATE sync_identity SET revision=? WHERE userId=? AND tableName=? AND localKey=? AND globalId=?',revision,uid,record.tableName,record.localKey,record.globalId);
    await tx.runAsync('DELETE FROM sync_queue WHERE userId=? AND tableName=? AND localKey=? AND generation=?',uid,record.tableName,record.localKey,record.generation);
  });
}
export async function syncStatus(uid:string){
  const db=await getDatabase();
  const count=await db.getFirstAsync<{count:number}>('SELECT COUNT(*) AS count FROM sync_queue WHERE userId=?',uid);
  const account=await db.getFirstAsync<{lastSync:string}>('SELECT lastSync FROM sync_account WHERE userId=?',uid);
  return {pending:count?.count??0,lastSync:account?.lastSync??null};
}
export async function recordSyncSuccess(uid:string){
  const db=await getDatabase();
  await db.runAsync('INSERT INTO sync_account(userId,lastSync) VALUES(?,?) ON CONFLICT(userId) DO UPDATE SET lastSync=excluded.lastSync',uid,new Date().toISOString());
}

export async function getSyncCursors(uid:string):Promise<SyncCursors>{
  const db=await getDatabase();
  const rows=await db.getAllAsync<{entity:string;seconds:number;nanoseconds:number}>('SELECT entity,seconds,nanoseconds FROM sync_cursor WHERE userId=?',uid);
  const cursors:SyncCursors={};
  for(const row of rows){if(!validCursor(row))throw new Error('Cursor local inválido.');cursors[row.entity]={seconds:row.seconds,nanoseconds:row.nanoseconds};}
  return cursors;
}
export async function isLegacyMigrated(uid:string){
  const db=await getDatabase();
  return !!await db.getFirstAsync('SELECT 1 FROM sync_legacy_done WHERE userId=?',uid);
}
export async function markLegacyMigrated(uid:string){
  const db=await getDatabase();
  await db.runAsync('INSERT OR IGNORE INTO sync_legacy_done(userId) VALUES(?)',uid);
}
export async function getReferencedPhotos(uid:string){
  const db=await getDatabase();
  return (await db.getAllAsync<{photoFilename:string}>('SELECT DISTINCT photoFilename FROM products WHERE userId=? AND photoFilename IS NOT NULL',uid)).map(r=>r.photoFilename);
}
