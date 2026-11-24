export type LaborMode = 'hourly' | 'monthly';
export interface LaborSettings {
  laborMode: LaborMode;
  productiveHours: number;
  hourlyCostCents: number | null;
  monthlyIncomeCents: number | null;
}
export interface SalesFees {
  debitBps: number | null;
  creditBps: number | null;
  pixBps: number | null;
  pixUnused: 0 | 1;
  debitUnused: 0 | 1;
  creditUnused: 0 | 1;
}
export interface PricingSettings extends SalesFees {
  userId: string;
  marginBps: number | null;
  noFixedExpenses: 0 | 1;
  laborMode: LaborMode | null;
  productiveHours: number | null;
  hourlyCostCents: number | null;
  monthlyIncomeCents: number | null;
}
export function hourlyRate(settings: Pick<PricingSettings, 'laborMode' | 'productiveHours' | 'hourlyCostCents' | 'monthlyIncomeCents'>): number | null {
  if (settings.laborMode === 'hourly') return settings.hourlyCostCents;
  if (settings.laborMode === 'monthly' && settings.productiveHours && settings.monthlyIncomeCents !== null) {
    return settings.monthlyIncomeCents / settings.productiveHours;
  }
  return null;
}

export type PaymentMethod = 'pix' | 'debit' | 'credit';
export type PaymentChoice = 'pending' | 'free' | 'charged' | 'unused';
export type PaymentDraft = { choice: PaymentChoice; fee: string };
export type PaymentDrafts = Record<PaymentMethod, PaymentDraft>;

export const PAYMENT_METHODS = [
  { key: 'pix', name: 'Pix', feeKey: 'pixBps', unusedKey: 'pixUnused', icon: 'qr-code-outline' },
  { key: 'debit', name: 'Débito', feeKey: 'debitBps', unusedKey: 'debitUnused', icon: 'card-outline' },
  { key: 'credit', name: 'Crédito à vista', feeKey: 'creditBps', unusedKey: 'creditUnused', icon: 'card-outline' },
] as const;

export function getPaymentChoice(settings: SalesFees | null, key: PaymentMethod): PaymentChoice {
  const method = PAYMENT_METHODS.find(m => m.key === key)!;
  if (settings?.[method.unusedKey] === 1) return 'unused';
  const fee = settings?.[method.feeKey];
  if (fee == null || !Number.isInteger(fee) || fee < 0 || fee >= 10000) return 'pending';
  return fee === 0 ? 'free' : 'charged';
}

export function countConfiguredPayments(settings: SalesFees | null): number {
  return PAYMENT_METHODS.filter(method => getPaymentChoice(settings, method.key) !== 'pending').length;
}
