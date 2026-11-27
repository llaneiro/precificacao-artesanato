const decimalFormatter = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 });

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.01) return (value < 0 ? '−' : '') + '< 0,01';
  return decimalFormatter.format(value);
}
