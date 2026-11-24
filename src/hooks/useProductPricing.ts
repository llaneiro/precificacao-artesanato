import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useProducts } from './useProducts';
import { useExpenses } from './useExpenses';
import { usePricingSettings } from './usePricingSettings';
import { ProductDetails } from '../types/product';
import { calculatePricing, calculateManualPricing } from '../utils/pricing';
import { PaymentMethod } from '../types/pricingSettings';
import { parseCostCents } from '../utils/currency';

export type PricingMode = 'suggested' | 'manual';
export type ManualPayment = PaymentMethod | 'noFee';

export function useProductPricing(id: string) {
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
  return { product, loading: loadingAll, error: loadError, marginText, setOverride, margin, result, override,
    mode, setMode, manualPrice, setManualPrice, manualPriceError, selectedPayment, setManualPayment, manualFee, manual };

}
