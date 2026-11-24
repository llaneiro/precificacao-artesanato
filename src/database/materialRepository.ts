import { getDatabase } from './database';
import { Material, CreateMaterialInput, UpdateMaterialInput, UpdateMaterialPriceInput } from '../types/material';

// Busca os materiais do usuário, do mais recente ao mais antigo.
export async function getMaterials(userId: string): Promise<Material[]> {
  const db = await getDatabase();
  return db.getAllAsync<Material>(
    'SELECT * FROM materials WHERE userId = ? ORDER BY createdAt DESC, id DESC',
    userId,
  );
}

// Busca um material específico, pertencente ao usuário.
export async function getMaterialById(
  userId: string,
  id: number,
): Promise<Material | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Material>(
    'SELECT * FROM materials WHERE userId = ? AND id = ?',
    userId,
    id,
  );
}

// Cadastra um material e retorna o registro com o ID gerado.
export async function createMaterial(
  userId: string,
  input: CreateMaterialInput,
): Promise<Material> {
  const db = await getDatabase();
  const createdAt = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO materials (userId, name, costCents, quantity, unit, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    userId,
    input.name,
    input.costCents,
    input.quantity,
    input.unit,
    createdAt,
  );

  const material = await getMaterialById(userId, result.lastInsertRowId);
  if (!material) throw new Error('Não foi possível localizar o material cadastrado.');
  return material;
}

// Atualiza os dados de um material.
export async function updateMaterial(
  userId: string,
  input: UpdateMaterialInput,
): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE materials SET name = ? WHERE userId = ? AND id = ?',
    input.name, userId, input.id,
  );

  if (result.changes === 0) throw new Error('Material não encontrado.');
}

// Uma atualização explícita registra também a confirmação de um preço inalterado.
export async function updateMaterialPrice(userId: string, input: UpdateMaterialPriceInput): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE materials SET costCents = ?, quantity = ?, unit = ? WHERE userId = ? AND id = ?',
    input.costCents, input.quantity, input.unit, userId, input.id,
  );
  if (result.changes === 0) throw new Error('Material não encontrado.');
}

// Remove um material pertencente ao usuário.
export async function deleteMaterial(userId: string, id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'DELETE FROM materials WHERE userId = ? AND id = ?',
    userId,
    id,
  );

  if (result.changes === 0) throw new Error('Material não encontrado.');
}
