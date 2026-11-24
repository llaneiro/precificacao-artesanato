import { getDatabase } from './database';
import { CreateExpenseInput, Expense, UpdateExpenseInput } from '../types/expense';

export async function getExpenses(userId: string): Promise<Expense[]> {
  const db = await getDatabase();
  return db.getAllAsync<Expense>(
    'SELECT * FROM fixed_expenses WHERE userId = ? ORDER BY createdAt DESC, id DESC',
    userId,
  );
}

export async function getExpenseById(userId: string, id: number): Promise<Expense | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Expense>(
    'SELECT * FROM fixed_expenses WHERE userId = ? AND id = ?', userId, id,
  );
}

export async function createExpense(userId: string, input: CreateExpenseInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT INTO fixed_expenses (userId, name, monthlyCostCents, description, createdAt) VALUES (?, ?, ?, ?, ?)',
    userId, input.name, input.monthlyCostCents, input.description, new Date().toISOString(),
  );
}

export async function updateExpense(userId: string, input: UpdateExpenseInput): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'UPDATE fixed_expenses SET name = ?, monthlyCostCents = ?, description = ? WHERE userId = ? AND id = ?',
    input.name, input.monthlyCostCents, input.description, userId, input.id,
  );
  if (!result.changes) throw new Error('Despesa não encontrada.');
}

export async function deleteExpense(userId: string, id: number): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    'DELETE FROM fixed_expenses WHERE userId = ? AND id = ?', userId, id,
  );
  if (!result.changes) throw new Error('Despesa não encontrada.');
}
