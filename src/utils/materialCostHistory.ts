import { formatReal } from './currency';
import { formatNumber } from './numberDisplay';
import type { MaterialCostHistoryRecord } from '../types/materialCostHistory';

const units: Record<string, { group: string; factor: number }> = {
  g: { group: 'mass', factor: 1 }, kg: { group: 'mass', factor: 1000 },
  cm: { group: 'length', factor: 1 }, m: { group: 'length', factor: 100 },
  ml: { group: 'volume', factor: 1 }, l: { group: 'volume', factor: 1000 },
  un: { group: 'count', factor: 1 },
};

export function materialCostVariation(record: MaterialCostHistoryRecord): number | null {
  const { costCents, quantity, unit, previousCostCents, previousQuantity, previousUnit } = record;
  if (previousCostCents === null || previousCostCents <= 0 || !previousQuantity || previousQuantity <= 0 || !previousUnit) return null;
  const current = units[unit], previous = units[previousUnit];
  if (!current || !previous || current.group !== previous.group || quantity <= 0) return null;
  const oldRate = previousCostCents / previousQuantity / previous.factor;
  const newRate = costCents / quantity / current.factor;
  const change = (newRate / oldRate - 1) * 100;
  return Number.isFinite(change) ? (Math.abs(change) < 0.000001 ? 0 : change) : null;
}

export function formatReferenceQuantity(quantity: number, unit: string): string {
  return formatNumber(quantity) + ' ' + unit;
}

export function formatUnitCost(costCents: number, quantity: number, unit: string): string {
  const value = costCents / 100 / quantity;
  if (!Number.isFinite(value)) return '—';
  return formatReal(value) + ' / ' + unit;
}
