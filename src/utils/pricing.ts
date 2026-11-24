import { ProductDetails, getMaterialCostCents } from '../types/product';
import { PricingSettings, hourlyRate, PAYMENT_METHODS, getPaymentChoice } from '../types/pricingSettings';

export type PricingIssue = {
  code: 'materials' | 'additional' | 'time' | 'labor' | 'fixed' | 'range' | 'margin';
  message: string;
};

const cents = (value: number): number | null =>
  Number.isSafeInteger(value) && value >= 0 ? value : null;
const positive = (value: number) => Number.isFinite(value) && value > 0;
const validBps = (value: number | null): value is number =>
  value !== null && Number.isInteger(value) && value >= 0 && value < 10000;

export function calculatePricing(product: ProductDetails, settings: PricingSettings | null, monthlyFixed: number | null, margin: number | null) {
  const costIssues: PricingIssue[] = [];
  const hours = Number.isSafeInteger(product.productionMinutes) && product.productionMinutes > 0 ? product.productionMinutes / 60 : null;
  const rate = settings ? hourlyRate(settings) : null;
  const productive = settings?.productiveHours;
  const validHours = typeof productive === 'number' && Number.isInteger(productive) && productive >= 1 && productive <= 744;
  const materials = product.materials.length && product.materials.every(m =>
    cents(m.costCents) !== null && positive(m.referenceQuantity) && positive(m.quantityUsed))
    ? cents(getMaterialCostCents(product.materials)) : null;
  const additional = product.additionalExpenses.every(e => cents(e.costCents) !== null &&
    e.costCents > 0 && Number.isSafeInteger(e.quantity) && e.quantity > 0)
    ? cents(product.additionalExpenses.reduce((sum, e) => sum + e.costCents * e.quantity, 0)) : null;
  const labor = hours !== null && rate !== null && positive(rate) && validHours ? cents(Math.round(rate * hours)) : null;
  const fixed = monthlyFixed === 0 && settings?.noFixedExpenses === 1 ? 0 :
    monthlyFixed !== null && monthlyFixed > 0 && cents(monthlyFixed) !== null && hours !== null && validHours
      ? cents(Math.round(monthlyFixed / productive! * hours)) : null;

  if (materials === null) costIssues.push({ code: 'materials', message: 'Revise os materiais, valores e quantidades do produto.' });
  if (additional === null) costIssues.push({ code: 'additional', message: 'Revise as despesas adicionais do produto.' });
  if (hours === null) costIssues.push({ code: 'time', message: 'Informe um tempo de produção válido.' });
  if (labor === null) costIssues.push({ code: 'labor', message: 'Configure a remuneração e as horas produtivas.' });
  if (fixed === null) costIssues.push({ code: 'fixed', message: monthlyFixed === 0
    ? 'Cadastre suas despesas fixas ou confirme que não possui nenhuma.'
    : monthlyFixed === null ? 'O total das despesas fixas está acima do limite. Revise os valores.'
    : 'Revise as despesas fixas e as horas produtivas para calcular o rateio.' });

  const knownTotal = cents((materials ?? 0) + (additional ?? 0) + (labor ?? 0) + (fixed ?? 0));
  if (knownTotal === null) costIssues.push({ code: 'range', message: 'A soma dos custos excede o limite suportado.' });
  // O subtotal conhecido nunca é tratado como custo total quando há pendências.
  const total = costIssues.length === 0 ? knownTotal : null;
  const issues = [...costIssues];
  if (!validBps(margin)) issues.push({ code: 'margin', message: 'Defina a margem de lucro desejada.' });

  // A margem incide sobre o valor líquido que o negócio deseja receber.
  const base = total === null || !validBps(margin) ? null :
    cents(Number((BigInt(total) * BigInt(10000) + BigInt(9999 - margin)) / BigInt(10000 - margin)));
  if (!issues.length && base === null) issues.push({ code: 'range', message: 'O preço calculado excede o limite suportado. Revise custos e margem.' });

  const payments = PAYMENT_METHODS
    .filter(method => getPaymentChoice(settings, method.key) !== 'unused')
    .map(method => {
      const fee = settings?.[method.feeKey] ?? null;
      const calculated = grossPriceForNet(base, fee);
      const status = !validBps(fee) ? 'missingFee' :
        !validBps(margin) || total === null ? 'incomplete' :
        calculated === null ? 'outOfRange' : 'ready';
      return { key: method.key, name: method.name, fee, price: calculated, status } as const;
    });

  return { materials, additional, labor, fixed, knownTotal, total, costIssues, issues, base,
    profit: base === null || total === null ? null : base - total, payments };
}

// Menor preço bruto que, após a taxa arredondada ao centavo,
// entrega exatamente o líquido solicitado. Taxa percentual entre 0 e 99,99%.
export function grossPriceForNet(net: number | null, fee: number | null): number | null {
  if (net === null || cents(net) === null || !validBps(fee)) return null;
  const denominator = BigInt(10000 - fee);
  const numerator = BigInt(net) * BigInt(10000) - BigInt(4999);
  return cents(Number(numerator <= BigInt(0) ? BigInt(0) :
    (numerator + denominator - BigInt(1)) / denominator));
}

// Análise inversa: o preço é definido pelo usuário, não pela margem desejada.
// Todos os valores monetários são inteiros em centavos.
export function calculateManualPricing(total: number | null, salePrice: number | null, fee: number | null) {
  if (total === null || cents(total) === null || !validBps(fee)) {
    return { minimumPrice: null, result: null };
  }

  const minimumPrice = grossPriceForNet(total, fee);

  if (salePrice === null || cents(salePrice) === null || salePrice <= 0) {
    return { minimumPrice, result: null };
  }

  const feeCents = Number((BigInt(salePrice) * BigInt(fee) + BigInt(5000)) / BigInt(10000));
  const netCents = salePrice - feeCents;
  const profitCents = netCents - total;
  const marginPercent = netCents > 0 ? profitCents / netCents * 100 : null;

  return { minimumPrice, result: {
    salePrice, feeCents, netCents, profitCents, marginPercent,
    status: profitCents > 0 ? 'profit' : profitCents < 0 ? 'loss' : 'breakEven',
  } as const };
}
