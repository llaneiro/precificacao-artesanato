import { useSyncStatus } from '../contexts/SyncContext';
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as Repository from '../database/pricingSettingsRepository';
import { LaborMode, PricingSettings, PaymentDrafts } from '../types/pricingSettings';
import { parseFees, parseLabor, parseMargin } from '../utils/pricingInputs';

export function usePricingSettings(loadOnFocus = true, refreshOnSync = false) {
  const { user } = useAuthContext();
  const userId = user?.uid;
  const syncVersion = useSyncStatus().remoteVersion;
  const refreshVersion = refreshOnSync ? syncVersion : undefined;
  const [settings, setSettings] = useState<PricingSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(userId ? await Repository.getPricingSettings(userId) : null);
    } catch {
      setError('Não foi possível carregar as configurações.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(useCallback(() => {
    if (loadOnFocus) void loadSettings();
  }, [loadOnFocus, loadSettings, refreshVersion]));

  const saveLabor = useCallback(async (mode: LaborMode, hours: string, amount: string) => {
    if (!userId) throw new Error('Faça login para configurar a mão de obra.');
    await Repository.saveLaborSettings(userId, parseLabor(mode, hours, amount));
  }, [userId]);

  const saveFees = useCallback(async (drafts: PaymentDrafts) => {
    if (!userId) throw new Error('Faça login para configurar as taxas.');
    await Repository.saveSalesFees(userId, parseFees(drafts));
  }, [userId]);

  const saveMargin = useCallback(async (value: string) => {
    if (!userId) throw new Error('Faça login para configurar a margem.');
    await Repository.saveProfitMargin(userId, parseMargin(value));
  }, [userId]);

  const saveNoFixedExpenses = useCallback(async (confirmed: boolean) => {
    if (!userId) throw new Error('Faça login para configurar as despesas.');
    await Repository.saveNoFixedExpenses(userId, confirmed);
    await loadSettings();
  }, [userId, loadSettings]);

  return { settings, loading, error, loadSettings, saveLabor, saveFees, saveMargin, saveNoFixedExpenses };
}
