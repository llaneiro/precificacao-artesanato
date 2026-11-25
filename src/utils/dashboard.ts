import type { ProductDetails } from '../types/product';
import type { PricingSnapshot } from '../types/pricingHistory';
import type { PricingSettings } from '../types/pricingSettings';
import type { Expense } from '../types/expense';
import { hourlyRate, countConfiguredPayments, PAYMENT_METHODS, getPaymentChoice } from '../types/pricingSettings';
import { convertQuantity } from '../types/material';
import { calculatePricing } from './pricing';

export const REVIEW_INTERVALS = [15, 30, 60, 90] as const;
export type ReviewInterval = typeof REVIEW_INTERVALS[number];

export function daysSince(date: string | null, now: number): number | null {
  if (!date) return null;
  const time = Date.parse(date);
  return Number.isFinite(time) ? Math.max(0, Math.floor((now - time) / 86400000)) : null;
}

export function financialPending(settings: PricingSettings | null, expenses: Expense[]) {
  const rate = settings ? hourlyRate(settings) : null;
  const total = expenses.reduce((sum, e) => sum + e.monthlyCostCents, 0);
  const result: string[] = [];
  if (rate === null || !Number.isFinite(rate) || rate <= 0 || !Number.isInteger(settings?.productiveHours) || settings!.productiveHours! < 1 || settings!.productiveHours! > 744) result.push('Mão de obra');
  if (!Number.isSafeInteger(total) || (expenses.length === 0 && settings?.noFixedExpenses !== 1)) result.push('Despesas fixas');
  if (countConfiguredPayments(settings) < 3) result.push('Formas de pagamento');
  return result;
}

function equalNumber(a: number, b: number) {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= Math.max(1e-10, Math.max(Math.abs(a), Math.abs(b)) * 1e-12);
}

export function pricingReviewReasons(product: ProductDetails, snapshot: PricingSnapshot, settings: PricingSettings | null, expenses: Expense[]): string[] {
  const reasons: string[] = [];
  if (snapshot.version === 1) reasons.push('Fórmula de precificação atualizada');
  if (product.productionMinutes !== snapshot.productionMinutes) reasons.push('Tempo de produção alterado');
  const oldMaterials = new Map(snapshot.materials.map(m => [m.materialId, m]));
  if (product.materials.length !== oldMaterials.size || product.materials.some(m => {
    const old = oldMaterials.get(m.materialId);
    if (!old) return true;
    const oldQty = convertQuantity(old.quantityUsed, old.usageUnit ?? old.unit, m.usageUnit ?? m.unit);
    const oldRef = convertQuantity(old.referenceQuantity, old.unit, m.unit);
    return !equalNumber(oldQty, m.quantityUsed) ||
      !equalNumber(old.costCents / oldRef, m.costCents / m.referenceQuantity);
  })) reasons.push('Materiais ou custos alterados');
  const oldAdditional = new Map(snapshot.additionalExpenses.map(e => [e.expenseId, e]));
  if (product.additionalExpenses.length !== oldAdditional.size || product.additionalExpenses.some(e => {
    const old = oldAdditional.get(e.expenseId);
    return !old || old.quantity !== e.quantity || old.costCents !== e.costCents;
  })) reasons.push('Despesas adicionais alteradas');
  const f = snapshot.financial;
  if (f.laborMode !== (settings?.laborMode ?? null) || f.productiveHours !== (settings?.productiveHours ?? null) ||
    f.hourlyCostCents !== (settings?.hourlyCostCents ?? null) || f.monthlyIncomeCents !== (settings?.monthlyIncomeCents ?? null)) reasons.push('Mão de obra alterada');
  const monthly = expenses.reduce((sum, e) => sum + e.monthlyCostCents, 0);
  if (monthly !== f.monthlyFixedCents || f.noFixedExpenses !== (monthly === 0 && settings?.noFixedExpenses === 1)) reasons.push('Despesas fixas alteradas');
  const relevant = snapshot.mode === 'manual' ? PAYMENT_METHODS.filter(m => m.key === snapshot.scenarios[0]?.key) : PAYMENT_METHODS;
  if (relevant.some(m => {
    const scenario = snapshot.scenarios.find(s => s.key === m.key);
    const unavailable = snapshot.unavailablePayments.find(p => p.key === m.key);
    const choice = getPaymentChoice(settings, m.key);
    return scenario ? choice === 'unused' || choice === 'pending' || settings?.[m.feeKey] !== scenario.feeBps :
      unavailable ? (choice === 'free' || choice === 'charged') : choice !== 'unused';
  })) reasons.push('Taxas de pagamento alteradas');
  const current = calculatePricing(product, settings, Number.isSafeInteger(monthly) ? monthly : null, snapshot.targetMarginBps);
  if (current.costIssues.length && !reasons.length) reasons.push('Dados de custo precisam de revisão');
  return reasons;
}
