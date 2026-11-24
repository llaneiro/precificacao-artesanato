import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as Repository from '../database/pricingHistoryRepository';
import type { PricingHistorySummary } from '../types/pricingHistory';

export function usePricingHistory(productId?: number, loadOnFocus = true) {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const [records, setRecords] = useState<PricingHistorySummary[]>([]);
  const [loading, setLoading] = useState(loadOnFocus);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (productId !== undefined && (!Number.isSafeInteger(productId) || productId <= 0)) throw new Error('Produto inválido.');
      setRecords(userId ? await Repository.getPricingHistory(userId, productId) : []);
    } catch { setRecords([]); setError('Não foi possível carregar o histórico.'); }
    finally { setLoading(false); }
  }, [userId, productId]);

  useFocusEffect(useCallback(() => { if (loadOnFocus) void load(); }, [load, loadOnFocus]));
  const getById = useCallback((id: number) => userId && Number.isSafeInteger(id) && id > 0
    ? Repository.getPricingHistoryById(userId, id) : Promise.resolve(null), [userId]);
  const remove = useCallback(async (id: number) => {
    if (!userId) throw new Error('Faça login para excluir a precificação.');
    await Repository.deletePricingHistory(userId, id);
  }, [userId]);
  return { records, loading, error, load, getById, remove };
}
