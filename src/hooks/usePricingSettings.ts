import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useAuthContext } from '../contexts/AuthContext';
import * as Repository from '../database/pricingSettingsRepository';
import { LaborMode, PricingSettings } from '../types/pricingSettings';
import { parseFees, parseLabor } from '../utils/pricingInputs';

export function usePricingSettings(loadOnFocus = true) {
  const { user } = useAuthContext();
  const userId = user?.uid;
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
  }, [loadOnFocus, loadSettings]));

  const saveLabor = useCallback(async (mode: LaborMode, hours: string, amount: string) => {
    if (!userId) throw new Error('Faça login para configurar a mão de obra.');
    await Repository.saveLaborSettings(userId, parseLabor(mode, hours, amount));
  }, [userId]);

  const saveFees = useCallback(async (debit: string, credit: string, pix: string) => {
    if (!userId) throw new Error('Faça login para configurar as taxas.');
    await Repository.saveSalesFees(userId, parseFees(debit, credit, pix));
  }, [userId]);

  const saveMargin = useCallback(async (value: string) => {
    if (!userId) throw new Error('Faça login para configurar a margem.');
    const trimmed = value.trim();
    if (trimmed && !/^\d+(?:[,.]\d{1,2})?$/.test(trimmed)) throw new Error('Informe uma margem com até duas casas decimais.');
    const bps = trimmed ? Math.round(Number(trimmed.replace(',', '.')) * 100) : null;
    if (bps !== null && (!Number.isSafeInteger(bps) || bps < 0 || bps >= 10000)) throw new Error('A margem deve estar entre 0% e 99,99%.');
    await Repository.saveProfitMargin(userId, bps);
  }, [userId]);

  return { settings, loading, error, loadSettings, saveLabor, saveFees, saveMargin };
}
