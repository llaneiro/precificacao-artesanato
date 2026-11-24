import { getDatabase } from './database';
import { CreateAdditionalExpenseInput, AdditionalExpense, UpdateAdditionalExpenseInput } from '../types/additionalExpense';

export async function getAdditionalExpenses(userId: string): Promise<AdditionalExpense[]> {
  const db = await getDatabase();
  return db.getAllAsync<AdditionalExpense>(
    'SELECT * FROM additional_expenses WHERE userId = ? ORDER BY createdAt DESC, id DESC',
    userId,
  );
}

export async function getAdditionalExpenseById(userId: string, id: number): Promise<AdditionalExpense | null> {
  const db = await getDatabase();
  return db.getFirstAsync<AdditionalExpense>(
    'SELECT * FROM additional_expenses WHERE userId = ? AND id = ?', userId, id,
  );
}

export async function createAdditionalExpense(userId: string, input: CreateAdditionalExpenseInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO additional_expenses (userId, name, costCents, description, createdAt) VALUES (?, ?, ?, ?, ?)',
    userId, input.name, input.costCents, input.description, new Date().toISOString(),
  );
}

export async function updateAdditionalExpense(userId: string, input: UpdateAdditionalExpenseInput): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE additional_expenses SET name = ?, costCents = ?, description = ? WHERE userId = ? AND id = ?',
    input.name, input.costCents, input.description, userId, input.id,
  );
  if (!result.changes) throw new Error('Despesa não encontrada.');
}

export async function deleteAdditionalExpense(userId: string, id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'DELETE FROM additional_expenses WHERE userId = ? AND id = ?', userId, id,
  );
  if (!result.changes) throw new Error('Despesa não encontrada.');
}
