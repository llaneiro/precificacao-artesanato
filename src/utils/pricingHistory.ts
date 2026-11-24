import type { ProductDetails } from '../types/product';
import type { Expense } from '../types/expense';
import type { PricingSettings } from '../types/pricingSettings';
import type { ManualPayment, PricingMode, PricingScenario, PricingSnapshot } from '../types/pricingHistory';
import { calculatePricing, calculateManualPricing } from './pricing';

export function buildPricingSnapshot(
  product: ProductDetails,
  settings: PricingSettings | null,
  fixedExpenses: Expense[],
  margin: number | null,
  mode: PricingMode,
  manualPayment: ManualPayment | null,
  manualPrice: number | null,
): PricingSnapshot {
  const monthlyFixed = fixedExpenses.reduce((sum, expense) => sum + expense.monthlyCostCents, 0);
  const pricing = calculatePricing(product, settings, Number.isSafeInteger(monthlyFixed) ? monthlyFixed : null, margin);
  if (pricing.costIssues.length || pricing.total === null || pricing.materials === null ||
    pricing.additional === null || pricing.labor === null || pricing.fixed === null) {
    throw new Error('Complete os custos antes de salvar a precificação.');
  }
  const total = pricing.total;
  function scenario(key: ManualPayment, name: string, price: number | null, fee: number | null): PricingScenario {
    const { result, minimumPrice } = calculateManualPricing(total, price, fee);
    if (!result || fee === null) throw new Error('Não foi possível salvar um resultado válido.');
    return {
      key, name, feeBps: fee, salePriceCents: result.salePrice, feeCents: result.feeCents,
      netCents: result.netCents, profitCents: result.profitCents, marginPercent: result.marginPercent,
      minimumPriceCents: minimumPrice,
    };
  }

  let scenarios: PricingScenario[];
  const unavailablePayments: PricingSnapshot['unavailablePayments'] = [];
  if (mode === 'suggested') {
    if (pricing.issues.length || pricing.base === null || pricing.base <= 0) {
      throw new Error('Defina uma margem e um preço sugerido válidos antes de salvar.');
    }
    scenarios = [scenario('noFee', 'Preço base (sem taxa)', pricing.base, 0)];
    for (const payment of pricing.payments) {
      if (payment.status === 'ready' && payment.price !== null && payment.price > 0) {
        scenarios.push(scenario(payment.key, payment.name, payment.price, payment.fee));
      } else {
        unavailablePayments.push({ key: payment.key, name: payment.name, reason: payment.status === 'ready' ? 'outOfRange' : payment.status });
      }
    }
  } else {
    if (manualPayment === null) throw new Error('Escolha uma forma de pagamento.');
    const method = pricing.payments.find(payment => payment.key === manualPayment);
    if (manualPayment !== 'noFee' && (!method || method.fee === null)) {
      throw new Error('Configure a forma de pagamento antes de salvar.');
    }
    scenarios = [manualPayment === 'noFee'
      ? scenario('noFee', 'Venda sem taxa', manualPrice, 0)
      : scenario(method!.key, method!.name, manualPrice, method!.fee)];
  }
  return {
    version: 2, productId: product.id, productName: product.name, productionMinutes: product.productionMinutes,
    mode, targetMarginBps: margin,
    costs: { materials: pricing.materials, additional: pricing.additional, labor: pricing.labor, fixed: pricing.fixed, total },
    materials: product.materials.map(material => ({ ...material })),
    additionalExpenses: product.additionalExpenses.map(expense => ({ ...expense })),
    financial: {
      laborMode: settings?.laborMode ?? null, productiveHours: settings?.productiveHours ?? null,
      hourlyCostCents: settings?.hourlyCostCents ?? null, monthlyIncomeCents: settings?.monthlyIncomeCents ?? null,
      monthlyFixedCents: monthlyFixed, noFixedExpenses: monthlyFixed === 0 && settings?.noFixedExpenses === 1,
      fixedExpenses: fixedExpenses.map(({ id, name, monthlyCostCents }) => ({ id, name, monthlyCostCents })),
    },
    scenarios, unavailablePayments,
  };
}
