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

  // Despesas fixas mensais; valores em centavos, separados por usuário.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS fixed_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      monthlyCostCents INTEGER NOT NULL CHECK(typeof(monthlyCostCents) = 'integer' AND monthlyCostCents > 0 AND monthlyCostCents <= 9007199254740991),
      description TEXT,
      createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_fixed_expenses_userId ON fixed_expenses(userId);
  `);

  // Custos por peça e configurações independentes de mão de obra e taxas.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS additional_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      name TEXT NOT NULL CHECK(length(trim(name)) > 0),
      costCents INTEGER NOT NULL CHECK(typeof(costCents) = 'integer' AND costCents > 0 AND costCents <= 9007199254740991),
      description TEXT,
      createdAt TEXT NOT NULL,
      UNIQUE(id, userId)
    );
    CREATE INDEX IF NOT EXISTS idx_additional_expenses_userId ON additional_expenses(userId);
    CREATE TABLE IF NOT EXISTS product_additional_expenses (
      productId INTEGER NOT NULL,
      expenseId INTEGER NOT NULL,
      userId TEXT NOT NULL,
      quantity INTEGER NOT NULL CHECK(typeof(quantity) = 'integer' AND quantity > 0),
      PRIMARY KEY(productId, expenseId),
      FOREIGN KEY(productId, userId) REFERENCES products(id, userId) ON DELETE CASCADE,
      FOREIGN KEY(expenseId, userId) REFERENCES additional_expenses(id, userId) ON DELETE RESTRICT
    );
    CREATE INDEX IF NOT EXISTS idx_product_additional_expense ON product_additional_expenses(expenseId, userId);
    CREATE TRIGGER IF NOT EXISTS prevent_linked_additional_expense_delete
    BEFORE DELETE ON additional_expenses
    WHEN EXISTS (SELECT 1 FROM product_additional_expenses WHERE expenseId = OLD.id AND userId = OLD.userId)
    BEGIN
      SELECT RAISE(ABORT, 'ADDITIONAL_EXPENSE_IN_USE');
    END;

    CREATE TABLE IF NOT EXISTS pricing_settings (
      userId TEXT PRIMARY KEY NOT NULL,
      laborMode TEXT CHECK(laborMode IN ('hourly', 'monthly')),
      productiveHours INTEGER CHECK(productiveHours IS NULL OR (typeof(productiveHours) = 'integer' AND productiveHours BETWEEN 1 AND 744)),
      hourlyCostCents INTEGER CHECK(hourlyCostCents IS NULL OR (typeof(hourlyCostCents) = 'integer' AND hourlyCostCents > 0 AND hourlyCostCents <= 9007199254740991)),
      monthlyIncomeCents INTEGER CHECK(monthlyIncomeCents IS NULL OR (typeof(monthlyIncomeCents) = 'integer' AND monthlyIncomeCents > 0 AND monthlyIncomeCents <= 9007199254740991)),
      debitBps INTEGER CHECK(debitBps IS NULL OR (typeof(debitBps) = 'integer' AND debitBps BETWEEN 0 AND 9999)),
      creditBps INTEGER CHECK(creditBps IS NULL OR (typeof(creditBps) = 'integer' AND creditBps BETWEEN 0 AND 9999)),
      pixBps INTEGER CHECK(pixBps IS NULL OR (typeof(pixBps) = 'integer' AND pixBps BETWEEN 0 AND 9999)),
      CHECK (
        (laborMode IS NULL AND productiveHours IS NULL AND hourlyCostCents IS NULL AND monthlyIncomeCents IS NULL)
        OR (laborMode = 'hourly' AND productiveHours IS NOT NULL AND hourlyCostCents IS NOT NULL AND monthlyIncomeCents IS NULL)
        OR (laborMode = 'monthly' AND productiveHours IS NOT NULL AND hourlyCostCents IS NULL AND monthlyIncomeCents IS NOT NULL)
      )
    );
  `);
  const pricingColumns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(pricing_settings)');
  if (!pricingColumns.some(column => column.name === 'marginBps')) {
    await db.execAsync("ALTER TABLE pricing_settings ADD COLUMN marginBps INTEGER CHECK(marginBps IS NULL OR (typeof(marginBps) = 'integer' AND marginBps BETWEEN 0 AND 9999))");
  }

}
