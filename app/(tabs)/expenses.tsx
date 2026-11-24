import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MainScreen } from '../../src/components/MainScreen';
import { TipsCarousel, type Tip } from '../../src/components/TipsCarousel';
import { CostSectionItem } from '../../src/components/CostSectionItem';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useAdditionalExpenses } from '../../src/hooks/useAdditionalExpenses';
import { usePricingSettings } from '../../src/hooks/usePricingSettings';
import { hourlyRate, countConfiguredPayments } from '../../src/types/pricingSettings';
import { formatCurrency } from '../../src/utils/currency';

const TIPS: readonly Tip[] = [
  { title: 'Conheça os custos do seu negócio', description: 'Organize seus gastos mensais, custos por peça, taxas de venda e remuneração. Cada tipo entra no preço de uma forma diferente.', icon: 'bulb-outline', iconColor: '#d97706' },
  { title: 'Gastos que acontecem todo mês', description: 'Energia, aluguel e internet entram nas despesas fixas. Considere apenas a parte usada no seu negócio.', icon: 'calendar-outline' },
  { title: 'Custos de cada peça', description: 'Fios, embalagens e etiquetas ficam em Materiais. Serviços terceirizados e outros gastos específicos ficam em Despesas adicionais.', icon: 'cube-outline' },
  { title: 'Seu trabalho tem valor', description: 'Defina sua remuneração na seção Mão de obra. O lucro do negócio é separado dessa remuneração.', icon: 'time-outline', iconColor: '#0d9488' },
];

export default function ExpensesScreen() {
  const router = useRouter();
  const fixed = useExpenses();
  const additional = useAdditionalExpenses();
  const pricing = usePricingSettings();
  const hourly = pricing.settings ? hourlyRate(pricing.settings) : null;
  const feeCount = countConfiguredPayments(pricing.settings);
  const missingFixed = fixed.totalMonthlyCostCents === 0 && pricing.settings?.noFixedExpenses !== 1;
  const monthly = fixed.error || pricing.error ? 'Indisponível' : fixed.loading || pricing.loading ? 'Carregando...' : fixed.totalMonthlyCostCents === null ? 'Total acima do limite' : missingFixed ? 'Não informado' : formatCurrency(fixed.totalMonthlyCostCents);
  return (
    <MainScreen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TipsCarousel title="Dicas financeiras" tips={TIPS} />
        <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
          <Text className="text-gray-600 font-medium">Despesas fixas mensais</Text>
          <Text className="text-2xl text-indigo-700 font-bold mt-1">{monthly}</Text>
          <Text className="text-gray-500 text-sm mt-1">Não inclui gastos por peça, taxas ou mão de obra.</Text>
        </View>
        <CostSectionItem title="Despesas fixas" description="Energia, água, aluguel e internet" summary={monthly + (fixed.error || pricing.error || fixed.loading || pricing.loading || missingFixed || fixed.totalMonthlyCostCents === null ? '' : ' / mês')} icon="calendar-outline" onPress={() => router.push('/fixed-expenses')} />
        <CostSectionItem title="Formas de pagamento" description="Débito, crédito à vista e Pix" summary={pricing.error ? 'Indisponível' : pricing.loading ? 'Carregando...' : feeCount ? feeCount + ' de 3 configuradas' : 'Não configuradas'} icon="card-outline" onPress={() => router.push('/sales-fees')} />
        <CostSectionItem title="Despesas adicionais" description="Serviços, fretes e gastos por peça" summary={additional.error ? 'Indisponível' : additional.loading ? 'Carregando...' : additional.expenses.length + ' cadastradas'} icon="cube-outline" onPress={() => router.push('/additional-expenses')} />
        <CostSectionItem title="Mão de obra" description="Remuneração e horas produtivas" summary={pricing.error ? 'Indisponível' : pricing.loading ? 'Carregando...' : hourly === null ? 'Não configurada' : formatCurrency(Math.round(hourly)) + ' / hora'} icon="time-outline" onPress={() => router.push('/labor-settings')} />
        <CostSectionItem title="Margem de lucro padrão" description="Percentual inicial para novas precificações" summary={pricing.error ? 'Indisponível' : pricing.loading ? 'Carregando...' : pricing.settings?.marginBps == null ? 'Não configurada' : (pricing.settings.marginBps / 100).toLocaleString('pt-BR') + '%'} icon="trending-up-outline" onPress={() => router.push('/profit-margin')} />
      </ScrollView>
    </MainScreen>
  );
}
