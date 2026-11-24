import { LaborMode, LaborSettings, SalesFees } from '../types/pricingSettings';
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

export function parseFees(debit: string, credit: string, pix: string): SalesFees {
  return { debitBps: parseFee(debit), creditBps: parseFee(credit), pixBps: parseFee(pix) };
}
