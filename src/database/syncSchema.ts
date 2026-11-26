// Identidades globais independentes dos IDs locais, inclusive para relações.
export const SYNC_TABLES = {
  materials: { keys:['id'], columns:'id,name,costCents,quantity,unit,createdAt' },
  products: { keys:['id'], columns:'id,name,description,productionMinutes,createdAt,photoFilename' },
  product_materials: { keys:['productId','materialId'], columns:'productId,materialId,quantityUsed,usageUnit' },
  material_cost_history: { keys:['id'], columns:'id,materialId,materialName,kind,costCents,quantity,unit,previousCostCents,previousQuantity,previousUnit,recordedAt' },
  fixed_expenses: { keys:['id'], columns:'id,name,monthlyCostCents,description,createdAt' },
  additional_expenses: { keys:['id'], columns:'id,name,costCents,description,createdAt' },
  product_additional_expenses: { keys:['productId','expenseId'], columns:'productId,expenseId,quantity' },
  pricing_settings: { keys:[], columns:'laborMode,productiveHours,hourlyCostCents,monthlyIncomeCents,debitBps,creditBps,pixBps,marginBps,noFixedExpenses,debitUnused,creditUnused,pixUnused' },
  pricing_history: { keys:['id'], columns:'id,productId,productName,mode,totalCostCents,salePriceCents,profitCents,createdAt,snapshot' },
  onboarding_state: { keys:[], columns:'completedAt' },
  dashboard_settings: { keys:[], columns:'reviewDays' },
} as const;
export type SyncTable = keyof typeof SYNC_TABLES;
export const syncTables = Object.keys(SYNC_TABLES) as SyncTable[];
export function localKey(table:SyncTable, alias:string) {
  return SYNC_TABLES[table].keys.length ? SYNC_TABLES[table].keys.map(k=> 'CAST('+alias+'.'+k+' AS TEXT)').join(" || ':' || ") : "'account'";
}
export function syncSchemaSql() {
  const base = `
    CREATE TABLE IF NOT EXISTS sync_identity (
      userId TEXT NOT NULL, tableName TEXT NOT NULL, localKey TEXT NOT NULL,
      globalId TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(userId,tableName,localKey), UNIQUE(userId,tableName,globalId)
    );
    CREATE TABLE IF NOT EXISTS sync_queue (
      userId TEXT NOT NULL, tableName TEXT NOT NULL, localKey TEXT NOT NULL,
      generation INTEGER NOT NULL DEFAULT 1, deleted INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(userId,tableName,localKey)
    );
    CREATE TABLE IF NOT EXISTS sync_account (userId TEXT PRIMARY KEY, lastSync TEXT);
    CREATE TABLE IF NOT EXISTS sync_cursor (
      userId TEXT NOT NULL, entity TEXT NOT NULL, seconds INTEGER NOT NULL, nanoseconds INTEGER NOT NULL,
      PRIMARY KEY(userId,entity)
    );
    CREATE TABLE IF NOT EXISTS sync_legacy_done (userId TEXT PRIMARY KEY);
  `;
  return base + syncTables.map(table=>{
    const singleton = SYNC_TABLES[table].keys.length === 0;
    const identity = singleton ? "'account'" : 'lower(hex(randomblob(16)))';
    const seed = `
      INSERT OR IGNORE INTO sync_queue(userId,tableName,localKey)
        SELECT t.userId,'${table}',${localKey(table,'t')} FROM ${table} t
        WHERE NOT EXISTS(SELECT 1 FROM sync_identity i WHERE i.userId=t.userId AND i.tableName='${table}' AND i.localKey=${localKey(table,'t')});
      INSERT OR IGNORE INTO sync_identity(userId,tableName,localKey,globalId)
        SELECT t.userId,'${table}',${localKey(table,'t')},${identity} FROM ${table} t;
    `;
    return seed + ['INSERT','UPDATE','DELETE'].map(op=>{
      const alias=op==='DELETE'?'OLD':'NEW';
      const key=localKey(table,alias);
      return `
        DROP TRIGGER IF EXISTS sync_${table}_${op.toLowerCase()};
        CREATE TRIGGER sync_${table}_${op.toLowerCase()} AFTER ${op} ON ${table}
        WHEN NOT EXISTS (SELECT 1 FROM sync_import_guard WHERE userId=${alias}.userId)
        BEGIN
          -- Um UPSERT externo pode sobrepor o OR IGNORE de um trigger.
          -- Só cria a identidade quando ela ainda não existe, preservando a revisão.
          INSERT INTO sync_identity(userId,tableName,localKey,globalId)
            SELECT ${alias}.userId,'${table}',${key},${identity}
            WHERE NOT EXISTS (
              SELECT 1 FROM sync_identity i
              WHERE i.userId=${alias}.userId AND i.tableName='${table}' AND i.localKey=${key}
            );
          INSERT INTO sync_queue(userId,tableName,localKey,generation,deleted)
            VALUES(${alias}.userId,'${table}',${key},1,${op==='DELETE'?1:0})
            ON CONFLICT(userId,tableName,localKey) DO UPDATE SET generation=generation+1,deleted=excluded.deleted;
        END;
      `;
    }).join('');
  }).join('');
}
