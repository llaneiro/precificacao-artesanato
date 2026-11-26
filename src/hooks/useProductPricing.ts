import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useProducts } from './useProducts';
import { useExpenses } from './useExpenses';
import { usePricingSettings } from './usePricingSettings';
import { ProductDetails } from '../types/product';
import { calculatePricing, calculateManualPricing } from '../utils/pricing';
import { useAuthContext } from '../contexts/AuthContext';
import type { PricingMode, ManualPayment } from '../types/pricingHistory';
import { buildPricingSnapshot } from '../utils/pricingHistory';
import { createPricingHistory } from '../database/pricingHistoryRepository';
import { parseCostCents } from '../utils/currency';

export function useProductPricing(id: string) {
  const { user } = useAuthContext();
  const { getProductById } = useProducts(false);
  const financial = usePricingSettings();
  const expenses = useExpenses();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [override, setOverride] = useState<string | null>(null);
  const [mode, setMode] = useState<PricingMode>('suggested');
  const [manualPrice, setManualPrice] = useState('');
  const [manualPayment, setManualPayment] = useState<ManualPayment | null>(null);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError('');
    getProductById(Number(id)).then(p => { if (active) setProduct(p); })
      .catch(() => { if (active) setError('Não foi possível carregar o produto.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getProductById]));
  const marginText = override ?? (financial.settings?.marginBps == null ? '' : String(financial.settings.marginBps / 100).replace('.', ','));
  const parsed = /^\d+(?:[,.]\d{1,2})?$/.test(marginText.trim()) ? Math.round(Number(marginText.replace(',', '.')) * 100) : null;
  const margin = parsed !== null && parsed >= 0 && parsed < 10000 ? parsed : null;
  const loadingAll = loading || financial.loading || expenses.loading;
  const loadError = error || financial.error || expenses.error;
  const result = product && !loadingAll && !loadError ? calculatePricing(product, financial.settings, expenses.totalMonthlyCostCents, margin) : null;
  let manualPriceCents: number | null = null;
  let manualPriceError = '';
  if (manualPrice.trim()) {
    try {
      const value = parseCostCents(manualPrice);
      if (value <= 0) throw new Error('Informe um preço maior que zero.');
      manualPriceCents = value;
    } catch (e) {
      manualPriceError = e instanceof Error ? e.message : 'Preço inválido.';
    }
  }
  const selectedMethod = result?.payments.find(payment => payment.key === manualPayment);
  const selectedPayment = manualPayment === 'noFee' ? 'noFee' : selectedMethod?.key ?? null;
  const manualFee = selectedPayment === 'noFee' ? 0 : selectedMethod?.fee ?? null;
  const manual = calculateManualPricing(result?.total ?? null, manualPriceCents, manualFee);
  const canSave = !!user && !!product && product.userId === user.uid && !loadingAll && !loadError &&
    (mode === 'manual' ? manual.result !== null : !!result && !result.issues.length && result.base !== null && result.base > 0);

  async function saveHistory(): Promise<number | null> {
    if (savingRef.current) return null;
    if (!canSave || !user || !product) throw new Error('Complete a precificação antes de salvar.');
    if ((financial.settings && financial.settings.userId !== user.uid) ||
        expenses.expenses.some(expense => expense.userId !== user.uid)) throw new Error('Configurações indisponíveis. Tente novamente.');
    savingRef.current = true;
    setSaving(true);
    try {
      const snapshot = buildPricingSnapshot(product, financial.settings, expenses.expenses, margin, mode, selectedPayment, manualPriceCents);
      return await createPricingHistory(user.uid, snapshot);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  return { product, loading: loadingAll, error: loadError, marginText, setOverride, margin, result, override, defaultMargin: financial.settings?.marginBps ?? null,
    mode, setMode, manualPrice, setManualPrice, manualPriceError, selectedPayment, setManualPayment, manualFee, manual, saving, canSave, saveHistory };

}
