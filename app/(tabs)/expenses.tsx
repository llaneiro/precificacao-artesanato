import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MainScreen } from '../../src/components/MainScreen';
import { CostSectionItem } from '../../src/components/CostSectionItem';
import { useExpenses } from '../../src/hooks/useExpenses';
import { useAdditionalExpenses } from '../../src/hooks/useAdditionalExpenses';
import { usePricingSettings } from '../../src/hooks/usePricingSettings';
import { financialGuide, requiredGuideProgress } from '../../src/utils/financialGuide';

export default function ExpensesScreen() {
  const router = useRouter();
  const fixed = useExpenses();
  const additional = useAdditionalExpenses();
  const pricing = usePricingSettings(true, true);
  const steps = financialGuide(pricing.settings, fixed.expenses);
  const [labor, monthly, payments, margin] = steps;
  const progress = requiredGuideProgress(steps);
  const loading = fixed.loading || pricing.loading;
  const error = fixed.error || pricing.error;
  const ready = !loading && !error;
  const complete = ready && progress.completed === progress.total;
  const pricingSummary = (value: string) => pricing.error ? 'Não foi possível carregar' : pricing.loading ? 'Carregando...' : value;
  const monthlySummary = error ? 'Não foi possível carregar' : loading ? 'Carregando...' : monthly.summary;
  const extraSummary = additional.error ? 'Não foi possível carregar' : additional.loading ? 'Carregando...' : additional.expenses.length === 0 ? 'Nenhuma cadastrada' : additional.expenses.length === 1 ? '1 despesa cadastrada' : additional.expenses.length + ' despesas cadastradas';

  function refresh() {
    void pricing.loadSettings();
    void fixed.loadExpenses();
    void additional.loadAdditionalExpenses();
  }

  return (
    <MainScreen>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={loading || additional.loading} onRefresh={refresh} tintColor="#4f46e5" colors={['#4f46e5']} />}
      >
        <View className={'rounded-2xl border p-4 mb-6 ' + (complete ? 'bg-white border-gray-200' : 'bg-indigo-50 border-indigo-100')}>
          <View className="flex-row items-center gap-3 mb-3">
            <View className={'w-12 h-12 rounded-2xl items-center justify-center ' + (complete ? 'bg-green-50' : 'bg-indigo-100')}>
              <Ionicons name={complete ? 'checkmark-circle-outline' : 'sparkles-outline'} size={28} color={complete ? '#15803d' : '#4f46e5'} />
            </View>
            <View className="flex-1">
              <Text accessibilityRole="header" className="text-xl font-bold text-gray-900">Prepare seu negócio</Text>
              <Text className="text-gray-600 text-sm leading-5 mt-1">{complete ? 'Tudo pronto para calcular seus preços!' : 'Em poucos passos, configure o essencial para precificar com confiança.'}</Text>
            </View>
          </View>
          {ready && !complete && (
            <View className="mt-1 mb-4">
              <Text className="text-indigo-800 text-sm font-medium mb-2">{progress.completed} de {progress.total} etapas essenciais concluídas</Text>
              <View accessibilityRole="progressbar" accessibilityLabel="Etapas essenciais concluídas" accessibilityValue={{ min: 0, max: progress.total, now: progress.completed }} className="h-2 rounded-full bg-indigo-100 overflow-hidden">
                <View className="h-full rounded-full bg-indigo-600" style={{ width: (progress.completed / progress.total * 100) + '%' }} />
              </View>
            </View>
          )}
          {!!error && <Text accessibilityRole="alert" className="text-gray-700 text-sm mb-3">Não foi possível verificar o progresso. Você pode tentar novamente no guia.</Text>}
          <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} className={'min-h-12 rounded-xl px-4 py-3 flex-row items-center justify-center gap-2 ' + (complete ? 'bg-indigo-50 active:bg-indigo-100' : 'bg-indigo-600 active:bg-indigo-700')}>
            <Text className={'font-semibold text-center text-base shrink ' + (complete ? 'text-indigo-700' : 'text-white')}>
              {complete ? 'Revisar configurações' : ready ? progress.completed > 0 ? 'Continuar configuração' : 'Começar configuração' : 'Abrir guia'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={complete ? '#4338ca' : '#fff'} />
          </Pressable>
        </View>

        <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 mb-3">Custos do negócio</Text>
        <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          <CostSectionItem title="Mão de obra" summary={pricingSummary(labor.done ? labor.summary : 'Defina quanto vale sua hora')} pending={!pricing.loading && !pricing.error && !labor.done} icon={labor.icon} onPress={() => router.push(labor.route)} />
          <CostSectionItem title="Despesas fixas" summary={monthlySummary} pending={ready && !monthly.done} icon={monthly.icon} onPress={() => router.push(monthly.route)} />
          <CostSectionItem title="Despesas adicionais" summary={extraSummary} icon="cube-outline" onPress={() => router.push('/additional-expenses')} last />
        </View>

        <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 mb-3">Vendas e lucro</Text>
        <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <CostSectionItem title="Formas de pagamento" summary={pricingSummary(payments.summary)} pending={!pricing.loading && !pricing.error && !payments.done} icon={payments.icon} onPress={() => router.push(payments.route)} />
          <CostSectionItem title="Margem de lucro padrão" summary={pricingSummary(margin.done ? margin.summary : 'Não definida · opcional')} icon={margin.icon} onPress={() => router.push(margin.route)} last />
        </View>
      </ScrollView>
    </MainScreen>
  );
}
