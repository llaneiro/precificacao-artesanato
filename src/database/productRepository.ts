import type { SQLiteDatabase } from 'expo-sqlite';
import { getDatabase } from './database';
import { CreateProductInput, Product, ProductDetails, ProductMaterial, ProductMaterialInput, ProductSummary, UpdateProductInput } from '../types/product';

export async function getProducts(userId: string): Promise<ProductSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<ProductSummary>(`
    SELECT p.*, COUNT(pm.materialId) AS materialCount,
      CAST(ROUND(COALESCE(SUM(1.0 * m.costCents / m.quantity * pm.quantityUsed), 0)) AS INTEGER) AS materialCostCents
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
  return { ...product, materials };
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

export async function createProduct(userId: string, input: CreateProductInput): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    const result = await tx.runAsync(
      'INSERT INTO products (userId, name, description, productionMinutes, photoFilename, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
      userId, input.name, input.description, input.productionMinutes, input.photoFilename, new Date().toISOString(),
    );
    await insertMaterials(tx, userId, result.lastInsertRowId, input.materials);
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
  });
}

export async function deleteProduct(userId: string, id: number): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async tx => {
    // Exclusão explícita das associações também protege em conexões que não
    // herdam o PRAGMA foreign_keys da conexão principal.
    await tx.runAsync('DELETE FROM product_materials WHERE productId = ? AND userId = ?', id, userId);
    const result = await tx.runAsync('DELETE FROM products WHERE id = ? AND userId = ?', id, userId);
    if (!result.changes) throw new Error('Produto não encontrado.');
  });
}
