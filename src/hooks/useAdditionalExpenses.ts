import { useSyncStatus } from '../contexts/SyncContext';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as AdditionalExpenseRepository from '../database/additionalExpenseRepository';
import { CreateAdditionalExpenseInput, AdditionalExpense, UpdateAdditionalExpenseInput } from '../types/additionalExpense';

function validateAdditionalExpense(input: CreateAdditionalExpenseInput): CreateAdditionalExpenseInput {
  const name = input.name.trim();
  if (!name) throw new Error('Informe o nome da despesa.');
  if (!Number.isSafeInteger(input.costCents) || input.costCents <= 0) {
    throw new Error('Informe um valor maior que zero.');
  }
  return { ...input, name, description: input.description?.trim() || null };
}

export function useAdditionalExpenses(loadOnFocus = true) {
  const { user } = useAuthContext();
  const remoteVersion = useSyncStatus().remoteVersion;
  const userId = user?.uid;
  const [expenses, setAdditionalExpenses] = useState<AdditionalExpense[]>([]);
  const [loading, setLoading] = useState(loadOnFocus);
  const [error, setError] = useState<string | null>(null);

  const loadAdditionalExpenses = useCallback(async () => {
    if (!userId) {
      setAdditionalExpenses([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setAdditionalExpenses(await AdditionalExpenseRepository.getAdditionalExpenses(userId));
    } catch {
      setError('Não foi possível carregar as despesas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    if (loadOnFocus) void loadAdditionalExpenses();
  }, [loadAdditionalExpenses, loadOnFocus, remoteVersion]));

  const getAdditionalExpenseById = useCallback(
    (id: number) => userId ? AdditionalExpenseRepository.getAdditionalExpenseById(userId, id) : Promise.resolve(null),
    [userId],
  );

  const addAdditionalExpense = useCallback(async (input: CreateAdditionalExpenseInput) => {
    if (!userId) throw new Error('Faça login para cadastrar despesas.');
    await AdditionalExpenseRepository.createAdditionalExpense(userId, validateAdditionalExpense(input));
    if (loadOnFocus) await loadAdditionalExpenses();
  }, [userId, loadOnFocus, loadAdditionalExpenses]);

  const editAdditionalExpense = useCallback(async (input: UpdateAdditionalExpenseInput) => {
    if (!userId) throw new Error('Faça login para editar despesas.');
    await AdditionalExpenseRepository.updateAdditionalExpense(userId, { ...validateAdditionalExpense(input), id: input.id });
    if (loadOnFocus) await loadAdditionalExpenses();
  }, [userId, loadOnFocus, loadAdditionalExpenses]);

  const removeAdditionalExpense = useCallback(async (id: number) => {
    if (!userId) throw new Error('Faça login para excluir despesas.');
    await AdditionalExpenseRepository.deleteAdditionalExpense(userId, id);
    if (loadOnFocus) await loadAdditionalExpenses();
  }, [userId, loadOnFocus, loadAdditionalExpenses]);

  return { expenses, loading, error, loadAdditionalExpenses, getAdditionalExpenseById, addAdditionalExpense, editAdditionalExpense, removeAdditionalExpense };
}
