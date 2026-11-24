import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as ExpenseRepository from '../database/expenseRepository';
import { CreateExpenseInput, Expense, UpdateExpenseInput } from '../types/expense';

function validateExpense(input: CreateExpenseInput): CreateExpenseInput {
  const name = input.name.trim();
  if (!name) throw new Error('Informe o nome da despesa.');
  if (!Number.isSafeInteger(input.monthlyCostCents) || input.monthlyCostCents <= 0) {
    throw new Error('Informe um valor mensal maior que zero.');
  }
  return { ...input, name, description: input.description?.trim() || null };
}

export function useExpenses(loadOnFocus = true) {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(loadOnFocus);
  const [error, setError] = useState<string | null>(null);

  const loadExpenses = useCallback(async () => {
    if (!userId) {
      setExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setExpenses(await ExpenseRepository.getExpenses(userId));
    } catch {
      setError('Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    if (loadOnFocus) void loadExpenses();
  }, [loadExpenses, loadOnFocus]));

  const getExpenseById = useCallback(
    (id: number) => userId ? ExpenseRepository.getExpenseById(userId, id) : Promise.resolve(null),
    [userId],
  );

  const addExpense = useCallback(async (input: CreateExpenseInput) => {
    if (!userId) throw new Error('Faça login para cadastrar despesas.');
    await ExpenseRepository.createExpense(userId, validateExpense(input));
    if (loadOnFocus) await loadExpenses();
  }, [userId, loadOnFocus, loadExpenses]);

  const editExpense = useCallback(async (input: UpdateExpenseInput) => {
    if (!userId) throw new Error('Faça login para editar despesas.');
    await ExpenseRepository.updateExpense(userId, { ...validateExpense(input), id: input.id });
    if (loadOnFocus) await loadExpenses();
  }, [userId, loadOnFocus, loadExpenses]);

  const removeExpense = useCallback(async (id: number) => {
    if (!userId) throw new Error('Faça login para excluir despesas.');
    await ExpenseRepository.deleteExpense(userId, id);
    if (loadOnFocus) await loadExpenses();
  }, [userId, loadOnFocus, loadExpenses]);

  const total = expenses.reduce((sum, expense) => sum + expense.monthlyCostCents, 0);
  const totalMonthlyCostCents = Number.isSafeInteger(total) ? total : null;

  return { expenses, loading, error, totalMonthlyCostCents, loadExpenses, getExpenseById, addExpense, editExpense, removeExpense };
}
