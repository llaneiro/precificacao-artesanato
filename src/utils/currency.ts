// Aceita estados intermediários da digitação, sem arredondar ou truncar valores colados.
// null indica uma edição rejeitada; o campo controlado mantém o último texto válido.
export function moneyInputText(value: string): string | null {
  if (!/^\d*(?:[,.]\d{0,2})?$/.test(value)) return null;
  return /^[,.]/.test(value) ? '0' + value : value;
}

// Converte reais em centavos sem multiplicar números decimais.
export function parseCostCents(value: string): number {
  const match = /^(\d+)(?:[,.](\d{0,2}))?$/.exec(value.trim());
  if (!match) throw new Error('Informe um valor em reais com até duas casas decimais.');
  const cents = Number(match[1] + (match[2] ?? '').padEnd(2, '0'));
  if (!Number.isSafeInteger(cents)) throw new Error('O valor informado é muito alto.');
  return cents;
}

export function centsToInput(cents: number): string {
  return Math.floor(cents / 100) + ',' + String(cents % 100).padStart(2, '0');
}

const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2,
});

// Recebe reais, inclusive custos unitários fracionários. Não altera o cálculo.
export function formatReal(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.01) return (value < 0 ? '−' : '') + '< R$ 0,01';
  return currencyFormatter.format(value);
}

export function formatCurrency(cents: number): string {
  return formatReal(cents / 100);
}
