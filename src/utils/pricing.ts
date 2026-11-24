import { ProductDetails, getMaterialCostCents } from '../types/product';
import { PricingSettings, hourlyRate } from '../types/pricingSettings';

export function calculatePricing(product: ProductDetails, settings: PricingSettings | null, monthlyFixed: number, margin: number | null) {
  const hours = product.productionMinutes / 60;
  const rate = settings ? hourlyRate(settings) : null;
  const productive = settings?.productiveHours;
  const materials = getMaterialCostCents(product.materials);
  const additional = product.additionalExpenses.reduce((sum, e) => sum + e.costCents * e.quantity, 0);
  const labor = rate === null ? null : Math.round(rate * hours);
  const fixed = monthlyFixed === 0 ? 0 : productive && productive > 0 ? Math.round(monthlyFixed / productive * hours) : null;
  const total = materials + additional + (labor ?? 0) + (fixed ?? 0);
  const missing = [labor === null && 'Remuneração pelo trabalho', fixed === null && 'Horas produtivas para ratear despesas fixas', margin === null && 'Margem de lucro'].filter(Boolean) as string[];
  function price(fee: number | null) {
    if (fee === null || margin === null || !Number.isInteger(margin) || margin < 0 || fee < 0 || margin + fee >= 10000) return null;
    const result = Math.ceil(total * 10000 / (10000 - margin - fee));
    return Number.isSafeInteger(result) ? result : null;
  }
  const base = price(0);
  return { materials, additional, labor, fixed, total, missing, base, profit: base === null ? null : base - total,
    payments: [
      { name: 'Pix', fee: settings?.pixBps ?? null },
      { name: 'Débito', fee: settings?.debitBps ?? null },
      { name: 'Crédito', fee: settings?.creditBps ?? null },
    ].map(method => ({ ...method, price: price(method.fee) })) };
}
