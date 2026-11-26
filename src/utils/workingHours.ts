// Estimativa de rotina produtiva, não o divisor salarial da CLT.
// Usa 52 semanas por ano e arredonda para a hora inteira mais próxima,
// mantendo o formato já usado pelos cálculos e pelo banco de dados.
export const REFERENCE_DAYS = 5;
export const REFERENCE_DAILY_HOURS = 8;

export function estimateProductiveHours(daysPerWeek: number, hoursPerDay: number) {
  if (!Number.isInteger(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7 ||
      !Number.isFinite(hoursPerDay) || hoursPerDay < 1 || hoursPerDay > 12 ||
      !Number.isInteger(hoursPerDay * 2)) {
    throw new Error('Informe de 1 a 7 dias por semana e de 1 a 12 horas por dia, em intervalos de meia hora.');
  }
  const weekly = daysPerWeek * hoursPerDay;
  return { weekly, monthly: Math.round(weekly * 52 / 12) };
}
