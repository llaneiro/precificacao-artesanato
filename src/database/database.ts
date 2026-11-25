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

  // Cada associação guarda sua própria unidade; a compra pode mudar dentro da categoria.
  await db.withTransactionAsync(async () => {
    const columns = await db.getAllAsync<{ name: string }>('PRAGMA table_info(product_materials)');
    if (!columns.some(c => c.name === 'usageUnit')) {
      await db.execAsync("ALTER TABLE product_materials ADD COLUMN usageUnit TEXT");
      await db.execAsync(`
        UPDATE product_materials SET usageUnit = (
          SELECT m.unit FROM materials m WHERE m.id = product_materials.materialId AND m.userId = product_materials.userId
        );
      `);
    }
    await db.execAsync(`
      DROP TRIGGER IF EXISTS prevent_linked_material_unit_change;
      CREATE TRIGGER IF NOT EXISTS prevent_material_category_change
      BEFORE UPDATE OF unit ON materials
      WHEN NOT (
        NEW.unit = OLD.unit OR
        (NEW.unit IN ('g','kg') AND OLD.unit IN ('g','kg')) OR
        (NEW.unit IN ('cm','m') AND OLD.unit IN ('cm','m')) OR
        (NEW.unit IN ('ml','l') AND OLD.unit IN ('ml','l'))
      )
      BEGIN SELECT RAISE(ABORT, 'MATERIAL_CATEGORY_CHANGE'); END;
      CREATE TRIGGER IF NOT EXISTS validate_product_material_usage_insert
      BEFORE INSERT ON product_materials
      WHEN NOT EXISTS (
        SELECT 1 FROM materials m WHERE m.id = NEW.materialId AND m.userId = NEW.userId AND (
          NEW.usageUnit = m.unit OR
          (NEW.usageUnit IN ('g','kg') AND m.unit IN ('g','kg')) OR
          (NEW.usageUnit IN ('cm','m') AND m.unit IN ('cm','m')) OR
          (NEW.usageUnit IN ('ml','l') AND m.unit IN ('ml','l'))
        )
      )
      BEGIN SELECT RAISE(ABORT, 'INVALID_USAGE_UNIT'); END;
      CREATE TRIGGER IF NOT EXISTS validate_product_material_usage_update
      BEFORE UPDATE ON product_materials
      WHEN NOT EXISTS (
        SELECT 1 FROM materials m WHERE m.id = NEW.materialId AND m.userId = NEW.userId AND (
          NEW.usageUnit = m.unit OR
          (NEW.usageUnit IN ('g','kg') AND m.unit IN ('g','kg')) OR
          (NEW.usageUnit IN ('cm','m') AND m.unit IN ('cm','m')) OR
          (NEW.usageUnit IN ('ml','l') AND m.unit IN ('ml','l'))
        )
      )
      BEGIN SELECT RAISE(ABORT, 'INVALID_USAGE_UNIT'); END;
    `);
  });

  // Histórico atômico: cada alteração de referência gera um registro na mesma operação SQL.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS material_cost_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      materialId INTEGER NOT NULL,
      materialName TEXT NOT NULL,
      kind TEXT NOT NULL CHECK(kind IN ('baseline', 'created', 'changed')),
      costCents INTEGER NOT NULL CHECK(typeof(costCents) = 'integer' AND costCents >= 0),
      quantity REAL NOT NULL CHECK(quantity > 0),
      unit TEXT NOT NULL,
      previousCostCents INTEGER,
      previousQuantity REAL,
      previousUnit TEXT,
      recordedAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_material_cost_history ON material_cost_history(userId, materialId, id DESC);

    -- Valores já cadastrados são apenas uma referência inicial, não uma compra datada.
    INSERT INTO material_cost_history (userId, materialId, materialName, kind, costCents, quantity, unit, recordedAt)
    SELECT m.userId, m.id, m.name, 'baseline', m.costCents, m.quantity, m.unit,
      strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
    FROM materials m WHERE NOT EXISTS (
      SELECT 1 FROM material_cost_history h WHERE h.userId = m.userId AND h.materialId = m.id
    );

    CREATE TRIGGER IF NOT EXISTS record_material_cost_insert
    AFTER INSERT ON materials
    BEGIN
      INSERT INTO material_cost_history (userId, materialId, materialName, kind, costCents, quantity, unit, recordedAt)
      VALUES (NEW.userId, NEW.id, NEW.name, 'created', NEW.costCents, NEW.quantity, NEW.unit, NEW.createdAt);
    END;

    DROP TRIGGER IF EXISTS record_material_cost_update;
    CREATE TRIGGER IF NOT EXISTS record_material_cost_update
    AFTER UPDATE OF costCents, quantity, unit ON materials
    BEGIN
      INSERT INTO material_cost_history (
        userId, materialId, materialName, kind, costCents, quantity, unit,
        previousCostCents, previousQuantity, previousUnit, recordedAt
      ) VALUES (
        NEW.userId, NEW.id, NEW.name, 'changed', NEW.costCents, NEW.quantity, NEW.unit,
        OLD.costCents, OLD.quantity, OLD.unit, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      );
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

  // Mantém os percentuais existentes. A ausência de uso é uma decisão distinta.
  // O antigo desconto Pix, caso exista no banco local, não é mais usado.
  for (const column of ['pixUnused', 'debitUnused', 'creditUnused'] as const) {
    if (!pricingColumns.some(existing => existing.name === column)) {
      await db.execAsync(`ALTER TABLE pricing_settings ADD COLUMN ${column} INTEGER NOT NULL DEFAULT 0 CHECK(${column} IN (0, 1))`);
    }
  }

  // Uma lista vazia só equivale a zero após confirmação explícita.
  if (!pricingColumns.some(column => column.name === 'noFixedExpenses')) {
    await db.execAsync('ALTER TABLE pricing_settings ADD COLUMN noFixedExpenses INTEGER NOT NULL DEFAULT 0 CHECK(noFixedExpenses IN (0, 1))');
  }
  await db.execAsync(`
    CREATE TRIGGER IF NOT EXISTS reset_no_fixed_expenses
    AFTER INSERT ON fixed_expenses
    BEGIN
      UPDATE pricing_settings SET noFixedExpenses = 0 WHERE userId = NEW.userId;
    END;
  `);

  // Primeiro acesso por conta, sem modificar as configurações financeiras.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS onboarding_state (
      userId TEXT PRIMARY KEY NOT NULL,
      completedAt TEXT NOT NULL
    );
  `);

  // Registros históricos independentes: excluir um produto não apaga cálculos salvos.
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS pricing_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      productId INTEGER NOT NULL,
      productName TEXT NOT NULL,
      mode TEXT NOT NULL CHECK(mode IN ('suggested', 'manual')),
      totalCostCents INTEGER NOT NULL CHECK(typeof(totalCostCents) = 'integer' AND totalCostCents >= 0),
      salePriceCents INTEGER NOT NULL CHECK(typeof(salePriceCents) = 'integer' AND salePriceCents > 0),
      profitCents INTEGER NOT NULL CHECK(typeof(profitCents) = 'integer'),
      createdAt TEXT NOT NULL,
      snapshot TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_pricing_history_user_date ON pricing_history(userId, createdAt DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_pricing_history_product_date ON pricing_history(userId, productId, createdAt DESC, id DESC);
  `);

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS dashboard_settings (
      userId TEXT PRIMARY KEY NOT NULL,
      reviewDays INTEGER NOT NULL CHECK(reviewDays IN (15,30,60,90))
    );
  `);

}
