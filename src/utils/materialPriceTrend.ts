import { convertQuantity, measureCategory, type MaterialUnit } from '../types/material';
import { formatReal } from './currency';
import type { MaterialCostHistoryRecord } from '../types/materialCostHistory';

export function comparisonUnit(unit: string): MaterialUnit | null {
  switch (measureCategory(unit)) {
    case 'weight': return 'kg';
    case 'length': return 'm';
    case 'volume': return 'l';
    case 'count': return 'un';
    default: return null;
  }
}

// Em reais, sem arredondamento intermediário: preserva os custos fracionários.
export function equivalentPrice(costCents: number, quantity: number, unit: string, target: string): number | null {
  const converted = convertQuantity(quantity, unit, target);
  const value = costCents / 100 / converted;
  return Number.isSafeInteger(costCents) && costCents >= 0 && Number.isFinite(value) && value >= 0 ? value : null;
}

export function priceChange(first: number, last: number): number | null {
  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0 || last < 0) return null;
  const change = (last / first - 1) * 100;
  return Number.isFinite(change) ? Math.abs(change) < 0.000001 ? 0 : change : null;
}

export function materialPriceTrend(records: MaterialCostHistoryRecord[], unit: string) {
  const target = comparisonUnit(unit);
  const points = records.flatMap(record => {
    const value = target ? equivalentPrice(record.costCents, record.quantity, record.unit, target) : null;
    const timestamp = Date.parse(record.recordedAt);
    return value === null || !Number.isFinite(timestamp) ? [] : [{ id: record.id, date: record.recordedAt, timestamp, value }];
  }).sort((a,b) => a.timestamp - b.timestamp || a.id - b.id);
  const first = points[0], last = points[points.length - 1], previous = points[points.length - 2];
  return {
    unit: target, points, omitted: records.length - points.length,
    lastChange: previous && last ? priceChange(previous.value, last.value) : null,
    overallChange: first && last && points.length > 1 ? priceChange(first.value, last.value) : null,
  };
}

export function formatEquivalentPrice(value: number | null) {
  return value === null ? '—' : formatReal(value);
}
