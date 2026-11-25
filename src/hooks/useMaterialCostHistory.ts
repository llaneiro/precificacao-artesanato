import { useSyncStatus } from '../contexts/SyncContext';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import { getMaterialCostHistory } from '../database/materialCostHistoryRepository';
import { getMaterialById } from '../database/materialRepository';
import type { MaterialCostHistoryRecord } from '../types/materialCostHistory';
import type { Material } from '../types/material';

export function useMaterialCostHistory(materialId: number) {
  const { user } = useAuthContext();
  const remoteVersion = useSyncStatus().remoteVersion;
  const userId = user?.uid;
  const [records, setRecords] = useState<MaterialCostHistoryRecord[]>([]);
  const [material, setMaterial] = useState<Material | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      if (!userId || !Number.isSafeInteger(materialId) || materialId <= 0) throw new Error('Material inválido');
      const [history, current] = await Promise.all([
        getMaterialCostHistory(userId, materialId), getMaterialById(userId, materialId),
      ]);
      setRecords(history); setMaterial(current);
    } catch {
      setRecords([]); setMaterial(null);
      setError('Não foi possível carregar o histórico.');
    } finally { setLoading(false); }
  }, [userId, materialId]);
  useFocusEffect(useCallback(() => { void load(); }, [load, remoteVersion]));
  return { records, material, loading, error, load };
}
