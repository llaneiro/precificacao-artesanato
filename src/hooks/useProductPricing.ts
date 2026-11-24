import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useProducts } from './useProducts';
import { useExpenses } from './useExpenses';
import { usePricingSettings } from './usePricingSettings';
import { ProductDetails } from '../types/product';
import { calculatePricing } from '../utils/pricing';

export function useProductPricing(id: string) {
  const { getProductById } = useProducts(false);
  const financial = usePricingSettings();
  const expenses = useExpenses();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [override, setOverride] = useState<string | null>(null);
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
  const result = product && expenses.totalMonthlyCostCents !== null ? calculatePricing(product, financial.settings, expenses.totalMonthlyCostCents, margin) : null;
  return { product, loading: loading || financial.loading || expenses.loading, error: error || financial.error || expenses.error, marginText, setOverride, margin, result, override };
}
