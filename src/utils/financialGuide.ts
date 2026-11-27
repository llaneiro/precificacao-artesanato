import { formatNumber } from './numberDisplay';
import type { Expense } from '../types/expense';
import type { PricingSettings } from '../types/pricingSettings';
import { hourlyRate, countConfiguredPayments } from '../types/pricingSettings';
import { formatCurrency } from './currency';
import { financialPending } from './dashboard';

export function financialGuide(settings: PricingSettings | null, expenses: Expense[]) {
  const pending = financialPending(settings, expenses);
  const hourly = settings ? hourlyRate(settings) : null;
  const fees = countConfiguredPayments(settings);
  const total = expenses.reduce((sum, expense) => sum + expense.monthlyCostCents, 0);
  return [
    {
      title: 'Mão de obra',
      icon: 'time-outline',
      route: '/labor-settings',
      question: 'Quanto vale o seu tempo?',
      description: 'Defina quanto deseja receber por hora ou por mês e quantas horas dedica à produção. Sua remuneração é um custo, separado do lucro.',
      example: 'Se não souber quantas horas trabalha por mês, use a calculadora de horas.',
      done: !pending.includes('Mão de obra'),
      summary: hourly !== null && Number.isFinite(hourly) ? formatCurrency(Math.round(hourly)) + ' / hora' : 'Não configurada',
      optional: false,
    },
    {
      title: 'Despesas fixas',
      icon: 'calendar-outline',
      route: '/fixed-expenses',
      question: 'Quais são seus gastos mensais?',
      description: 'Inclua os gastos recorrentes do seu negócio, como energia, aluguel e internet. Se não houver despesas fixas, confirme essa informação.',
      example: 'Se trabalha em casa, considere apenas a parte dos gastos relacionada à produção artesanal.',
      done: !pending.includes('Despesas fixas'),
      summary: expenses.length ? Number.isSafeInteger(total) ? formatCurrency(total) + ' / mês' : 'Total acima do limite' : settings?.noFixedExpenses === 1 ? 'Sem despesas fixas' : 'Cadastre seus gastos mensais',
      optional: false,
    },
    {
      title: 'Formas de pagamento',
      icon: 'card-outline',
      route: '/sales-fees',
      question: 'Como seus clientes pagam?',
      description: 'Informe se aceita Pix, débito e crédito e se paga alguma taxa por venda. Assim o preço pode cobrir as taxas sem reduzir seu lucro.',
      example: 'Se não utiliza uma modalidade, marque “Não utilizo”. Se não paga taxa, escolha “Sem taxa”.',
      done: !pending.includes('Formas de pagamento'),
      summary: fees + ' de 3 configuradas',
      optional: false,
    },
    {
      title: 'Margem de lucro padrão',
      icon: 'trending-up-outline',
      route: '/profit-margin',
      question: 'Quanto deseja lucrar?',
      description: 'Escolha a porcentagem que deseja ter de lucro sobre o valor líquido da venda, depois de cobrir todos os custos, inclusive sua mão de obra.',
      example: 'A margem padrão pode ser ajustada em cada precificação. Você também pode deixar essa escolha para depois.',
      done: settings?.marginBps != null,
      summary: settings?.marginBps == null ? 'Ainda não definida' : formatNumber(settings.marginBps / 100) + '%',
      optional: true,
    },
  ] as const;
}

export function requiredGuideProgress(steps: ReturnType<typeof financialGuide>) {
  const required = steps.filter(step => !step.optional);
  return { completed: required.filter(step => step.done).length, total: required.length };
}
