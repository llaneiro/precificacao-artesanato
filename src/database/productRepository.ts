import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './database';
import { CreateProductInput, ProductAdditionalExpense, ProductAdditionalExpenseInput, Product, ProductDetails, ProductMaterial, ProductMaterialInput, ProductSummary, UpdateProductInput } from '../types/product';

export async function getProducts(userId: string): Promise<ProductSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<ProductSummary>(`
    SELECT p.*, COUNT(pm.materialId) AS materialCount,
      CAST(ROUND(COALESCE(SUM(1.0 * m.costCents / m.quantity * pm.quantityUsed), 0)) AS INTEGER) AS materialCostCents,
      COALESCE((SELECT SUM(a.costCents * pa.quantity)
        FROM product_additional_expenses pa
        JOIN additional_expenses a ON a.id = pa.expenseId AND a.userId = pa.userId
        WHERE pa.productId = p.id AND pa.userId = p.userId), 0) AS additionalCostCents
    FROM products p
    LEFT JOIN product_materials pm ON pm.productId = p.id AND pm.userId = p.userId
    LEFT JOIN materials m ON m.id = pm.materialId AND m.userId = pm.userId
    WHERE p.userId = ?
    GROUP BY p.id
    ORDER BY p.createdAt DESC, p.id DESC
  `, userId);
}

export async function getProductById(userId: string, id: number): Promise<ProductDetails | null> {
  const db = await getDatabase();
  const product = await db.getFirstAsync<Product>(
    'SELECT * FROM products WHERE id = ? AND userId = ?', id, userId,
  );
  if (!product) return null;
  const materials = await db.getAllAsync<ProductMaterial>(`
    SELECT pm.materialId, pm.quantityUsed, m.name, m.unit, m.costCents, m.quantity AS referenceQuantity
    FROM product_materials pm
    JOIN materials m ON m.id = pm.materialId AND m.userId = pm.userId
    WHERE pm.productId = ? AND pm.userId = ?
    ORDER BY m.name
  `, id, userId);
  const additionalExpenses = await db.getAllAsync<ProductAdditionalExpense>(`
    SELECT pa.expenseId, pa.quantity, a.name, a.costCents
    FROM product_additional_expenses pa
    JOIN additional_expenses a ON a.id = pa.expenseId AND a.userId = pa.userId
    WHERE pa.productId = ? AND pa.userId = ?
    ORDER BY a.name
  `, id, userId);
  return { ...product, materials, additionalExpenses };
}

async function insertMaterials(db: SQLiteDatabase, userId: string, productId: number, materials: ProductMaterialInput[]) {
  for (const material of materials) {
    const exists = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM materials WHERE id = ? AND userId = ?', material.materialId, userId,
    );
    if (!exists) throw new Error('Um dos materiais não está mais disponível.');
    // As chaves estrangeiras também impedem associação a materiais de outra conta.
    await db.runAsync(
      'INSERT INTO product_materials (productId, materialId, userId, quantityUsed) VALUES (?, ?, ?, ?)',
      productId, material.materialId, userId, material.quantityUsed,
    );
  }
}

async function insertAdditionalExpenses(db: SQLiteDatabase, userId: string, productId: number, expenses: ProductAdditionalExpenseInput[]) {
  let total = 0;
  for (const expense of expenses) {
    const existing = await db.getFirstAsync<{ costCents: number }>(
      'SELECT costCents FROM additional_expenses WHERE id = ? AND userId = ?', expense.expenseId, userId,
    );
    if (!existing) throw new Error('Uma das despesas adicionais não está mais disponível.');
    total += existing.costCents * expense.quantity;
    if (!Number.isSafeInteger(total)) throw new Error('O total de despesas adicionais é muito alto.');
    await db.runAsync(
      'INSERT INTO product_additional_expenses (productId, expenseId, userId, quantity) VALUES (?, ?, ?, ?)',
      productId, expense.expenseId, userId, expense.quantity,
    );
  }
}

export async function createProduct(userId: string, input: CreateProductInput): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    const result = await tx.runAsync(
      'INSERT INTO products (userId, name, description, productionMinutes, photoFilename, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      userId, input.name, input.description, input.productionMinutes, input.photoFilename, new Date().toISOString(),
    );
    await insertMaterials(tx, userId, result.lastInsertRowId, input.materials);
    await insertAdditionalExpenses(tx, userId, result.lastInsertRowId, input.additionalExpenses);
  });
}

export async function updateProduct(userId: string, input: UpdateProductInput): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    const result = await tx.runAsync(
      'UPDATE products SET name = ?, description = ?, productionMinutes = ?, photoFilename = ? WHERE id = ? AND userId = ?',
      input.name, input.description, input.productionMinutes, input.photoFilename, input.id, userId,
    );
    if (!result.changes) throw new Error('Produto não encontrado.');
    await tx.runAsync('DELETE FROM product_materials WHERE productId = ? AND userId = ?', input.id, userId);
    await insertMaterials(tx, userId, input.id, input.materials);
    await tx.runAsync('DELETE FROM product_additional_expenses WHERE productId = ? AND userId = ?', input.id, userId);
    await insertAdditionalExpenses(tx, userId, input.id, input.additionalExpenses);
  });
}

export async function deleteProduct(userId: string, id: number): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    // Exclusão explícita das associações também protege em conexões que não
    // herdam o PRAGMA foreign_keys da conexão principal.
    await tx.runAsync('DELETE FROM product_materials WHERE productId = ? AND userId = ?', id, userId);
    await tx.runAsync('DELETE FROM product_additional_expenses WHERE productId = ? AND userId = ?', id, userId);
    const result = await tx.runAsync('DELETE FROM products WHERE id = ? AND userId = ?', id, userId);
    if (!result.changes) throw new Error('Produto não encontrado.');
  });
}
