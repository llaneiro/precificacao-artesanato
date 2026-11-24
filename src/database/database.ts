import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'precificacao-artesanal.db';
let database: Promise<SQLite.SQLiteDatabase> | null = null;

// Singleton: reutiliza a mesma conexão, inclusive durante a inicialização.
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (database === null) {
    database = SQLite.openDatabaseAsync(DATABASE_NAME)
      .then(async (db) => {
        try {
          await runMigrations(db);
          return db;
        } catch (error) {
          await db.closeAsync();
          throw error;
        }
      })
      .catch((error) => {
        database = null;
        throw error;
      });
  }

  return database;
}

// Cria as tabelas necessárias, sem apagar os registros existentes.
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS materials (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      userId     TEXT    NOT NULL,
      name       TEXT    NOT NULL CHECK(length(trim(name)) > 0),
      costCents  INTEGER NOT NULL CHECK(typeof(costCents) = 'integer' AND costCents >= 0),
      quantity   REAL    NOT NULL CHECK(quantity > 0),
      unit       TEXT    NOT NULL CHECK(length(trim(unit)) > 0),
      createdAt  TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_materials_userId ON materials(userId);
  `);

  // Preserva o valor pago e a quantidade total dos registros antigos,
  // mantendo o mesmo custo por unidade de medida sem arredondar centavos.
  await db.withTransactionAsync(async () => {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(materials)');
    if (columns.some(column => column.name === 'quantityPerPackage')) {
      await db.execAsync('ALTER TABLE materials RENAME COLUMN quantityPerPackage TO quantity');
    }
    if (columns.some(column => column.name === 'packageCount')) {
      await db.execAsync('UPDATE materials SET quantity = quantity * packageCount');
      await db.execAsync('ALTER TABLE materials DROP COLUMN packageCount');
    }
  });

  // Relaciona produtos e materiais da mesma conta.
  await db.execAsync(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_materials_owner ON materials(id, userId);
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      description TEXT,
      productionMinutes INTEGER NOT NULL CHECK(typeof(productionMinutes) = 'integer' AND productionMinutes > 0),
      photoFilename TEXT,
      createdAt TEXT NOT NULL,
      UNIQUE(id, userId)
    );
    CREATE INDEX IF NOT EXISTS idx_products_userId ON products(userId);
    CREATE TABLE IF NOT EXISTS product_materials (
      productId INTEGER NOT NULL,
      materialId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      quantityUsed REAL NOT NULL CHECK(quantityUsed > 0),
      PRIMARY KEY(productId, materialId),
      FOREIGN KEY(productId, userId) REFERENCES products(id, userId) ON DELETE CASCADE,
      FOREIGN KEY(materialId, userId) REFERENCES materials(id, userId) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_product_materials_material ON product_materials(materialId, userId);

    -- Alterar a unidade de um material utilizado mudaria o significado das quantidades.
    CREATE TRIGGER IF NOT EXISTS prevent_linked_material_unit_change
    BEFORE UPDATE OF unit ON materials
    WHEN NEW.unit <> OLD.unit AND EXISTS (
      SELECT 1 FROM product_materials WHERE materialId = OLD.id AND userId = OLD.userId
    )
    BEGIN
      SELECT RAISE(ABORT, 'MATERIAL_UNIT_IN_USE');
    END;

    CREATE TRIGGER IF NOT EXISTS prevent_linked_material_delete
    BEFORE DELETE ON materials
    WHEN EXISTS (
      SELECT 1 FROM product_materials WHERE materialId = OLD.id AND userId = OLD.userId
    )
    BEGIN
      SELECT RAISE(ABORT, 'MATERIAL_IN_USE');
    END;
  `);
}
