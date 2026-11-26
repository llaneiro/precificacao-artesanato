// Apenas apresentação: não altera o cálculo financeiro nem os registros salvos.
export function pricingBreakdown(cost: number, labor: number, profit: number) {
  if (![cost, labor, profit].every(Number.isSafeInteger) || cost < 0 || labor < 0 || labor > cost) return null;
  const denominator = cost + Math.max(0, profit);
  if (!Number.isSafeInteger(denominator) || denominator <= 0) return null;
  const loss = profit < 0;
  const segments = [
    { key: 'expenses', label: 'Materiais e despesas', amount: cost - labor, color: '#9ca3af' },
    { key: 'labor', label: 'Sua mão de obra', amount: labor, color: '#6366f1' },
    ...(!loss ? [{ key: 'profit', label: 'Lucro do negócio', amount: profit, color: '#22c55e' }] : []),
  ].map(segment => ({ ...segment, share: segment.amount / denominator * 100 }));
  return { segments, loss, shortfall: loss ? -profit : 0 };
}
