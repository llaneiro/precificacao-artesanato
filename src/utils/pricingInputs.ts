import { LaborMode, LaborSettings, SalesFees, PaymentDrafts, PaymentDraft, PAYMENT_METHODS } from '../types/pricingSettings';
import { parseCostCents } from './currency';

export function parseFee(value: string): number | null {
  if (!value.trim()) return null;
  if (!/^\d+(?:[,.]\d{1,2})?$/.test(value.trim())) throw new Error('Informe taxas com até duas casas decimais.');
  const bps = parseCostCents(value);
  if (bps >= 10000) throw new Error('A taxa deve ser menor que 100%.');
  return bps;
}

export function parseLabor(mode: LaborMode, hours: string, amount: string): LaborSettings {
  if (!/^\d+$/.test(hours.trim()) || Number(hours) < 1 || Number(hours) > 744) {
    throw new Error('Informe as horas produtivas mensais (de 1 a 744 horas inteiras).');
  }
  const cents = parseCostCents(amount);
  if (cents <= 0) throw new Error('Informe uma remuneração maior que zero.');
  const productiveHours = Number(hours);
  return { laborMode: mode, productiveHours, hourlyCostCents: mode === 'hourly' ? cents : null, monthlyIncomeCents: mode === 'monthly' ? cents : null };
}

function parsePayment(draft: PaymentDraft, name: string): { fee: number | null; unused: 0 | 1 } {
  switch (draft.choice) {
    case 'pending': return { fee: null, unused: 0 };
    case 'unused': return { fee: null, unused: 1 };
    case 'free': return { fee: 0, unused: 0 };
    case 'charged': {
      let fee: number | null;
      try { fee = parseFee(draft.fee); }
      catch (error) { throw new Error(name + ': ' + (error instanceof Error ? error.message : 'Taxa inválida.')); }
      if (fee === null || fee <= 0) throw new Error(name + ': informe uma taxa maior que zero ou selecione "Não pago taxa".');
      return { fee, unused: 0 };
    }
    default: throw new Error(name + ': escolha uma opção válida.');
  }
}

export function parseFees(drafts: PaymentDrafts): SalesFees {
  const pix = parsePayment(drafts.pix, PAYMENT_METHODS[0].name);
  const debit = parsePayment(drafts.debit, PAYMENT_METHODS[1].name);
  const credit = parsePayment(drafts.credit, PAYMENT_METHODS[2].name);
  return { pixBps: pix.fee, debitBps: debit.fee, creditBps: credit.fee,
    pixUnused: pix.unused, debitUnused: debit.unused, creditUnused: credit.unused };
}
