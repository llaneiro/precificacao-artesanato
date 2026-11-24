import { useCallback, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Alert, BackHandler, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { useExpenses } from '../src/hooks/useExpenses';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { hourlyRate, countConfiguredPayments } from '../src/types/pricingSettings';
import { formatCurrency } from '../src/utils/currency';

type Icon = ComponentProps<typeof Ionicons>['name'];
const INTRO = [
  {
    icon: 'sparkles-outline' as Icon,
    title: 'Seu trabalho tem valor.',
    description: 'Descubra quanto custa produzir suas peças e encontre um preço que valorize seu tempo e seu talento.',
    items: [
      { icon: 'layers-outline' as Icon, title: 'Organize seus materiais', description: 'Cadastre o que usa e o valor que pagou.' },
      { icon: 'cube-outline' as Icon, title: 'Crie seus produtos', description: 'Informe os materiais e o tempo de produção de cada peça.' },
      { icon: 'calculator-outline' as Icon, title: 'Precifique com segurança', description: 'Conheça seus custos e encontre um preço de venda sugerido.' },
    ],
  },
  {
    icon: 'wallet-outline' as Icon,
    title: 'Conheça seus custos.',
    description: 'O preço de uma peça vai além dos materiais. A Central financeira ajuda você a organizar tudo.',
    items: [
      { icon: 'time-outline' as Icon, title: 'Mão de obra', description: 'Defina quanto deseja receber pelo seu trabalho.' },
      { icon: 'calendar-outline' as Icon, title: 'Despesas e taxas', description: 'Considere os gastos do negócio e as taxas de pagamento.' },
      { icon: 'trending-up-outline' as Icon, title: 'Lucro do negócio', description: 'Escolha a margem que deseja obter, além da sua remuneração.' },
    ],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const { finish, saving } = useOnboarding();
  const financial = usePricingSettings();
  const fixed = useExpenses();
  const settings = financial.settings;
  const hourly = settings ? hourlyRate(settings) : null;
  const configuredFees = countConfiguredPayments(settings);
  const [error, setError] = useState('');
  const checklist = [
    { title: 'Mão de obra', icon: 'time-outline' as Icon, route: '/labor-settings' as const, done: hourly !== null && !!settings?.productiveHours, summary: hourly === null ? 'Defina sua remuneração e horas produtivas.' : formatCurrency(Math.round(hourly)) + ' / hora' },
    { title: 'Despesas fixas', icon: 'calendar-outline' as Icon, route: '/fixed-expenses' as const, done: fixed.expenses.length > 0 || settings?.noFixedExpenses === 1, summary: fixed.expenses.length ? 'Gastos mensais cadastrados' : settings?.noFixedExpenses === 1 ? 'Sem despesas fixas (confirmado)' : 'Cadastre os gastos mensais ou confirme que não possui.' },
    { title: 'Formas de pagamento', icon: 'card-outline' as Icon, route: '/sales-fees' as const, done: configuredFees === 3, summary: configuredFees ? configuredFees + ' de 3 configuradas' : 'Escolha as formas que utiliza e suas taxas.' },
    { title: 'Margem de lucro', icon: 'trending-up-outline' as Icon, route: '/profit-margin' as const, done: settings?.marginBps != null, summary: settings?.marginBps == null ? 'Escolha uma margem padrão para começar.' : (settings.marginBps / 100).toLocaleString('pt-BR') + '%' },
  ];
  const intro = INTRO[step];

  async function closeGuide() {
    setError('');
    try {
      if (await finish()) {
        if (router.canGoBack()) router.back();
        else router.replace('/');
      }
    } catch {
      setError('Não foi possível concluir o guia. Tente novamente.');
    }
  }

  // O botão físico volta uma etapa; na primeira, permite pular explicitamente.
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (saving) return true;
      if (step > 0) setStep(value => Math.max(0, value - 1));
      else Alert.alert('Pular o guia?', 'Você pode retomá-lo na aba Mais.', [
        { text: 'Continuar', style: 'cancel' },
        { text: 'Pular', onPress: () => void closeGuide() },
      ]);
      return true;
    });
    return () => subscription.remove();
  }, [step, saving, finish, router]));

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 pt-2 pb-3">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" color="#4f46e5" size={20} />
          <Text className="text-indigo-700 font-bold">Primeiros passos</Text>
        </View>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => void closeGuide()} className="p-2">
          <Text className="text-gray-600 font-semibold">Pular</Text>
        </Pressable>
      </View>
      <ScrollView key={step} className="flex-1" contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24, flexGrow: 1 }}>
        {intro ? <>
          <View className="items-center py-6">
            <View className="bg-indigo-50 rounded-3xl w-28 h-28 items-center justify-center mb-5">
              <Ionicons name={intro.icon} size={52} color="#4f46e5" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 text-center">{intro.title}</Text>
            <Text className="text-gray-600 text-center mt-3 text-base leading-6">{intro.description}</Text>
          </View>
          <View className="gap-4 mt-4">
            {intro.items.map(item => <View key={item.title} className="flex-row items-start gap-3">
              <View className="bg-indigo-50 rounded-xl w-12 h-12 items-center justify-center">
                <Ionicons name={item.icon} size={23} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-gray-800">{item.title}</Text>
                <Text className="text-gray-600 text-sm leading-5 mt-1">{item.description}</Text>
              </View>
            </View>)}
          </View>
        </> : <>
          <Text className="text-2xl font-bold text-gray-900 mb-2">Vamos preparar seu negócio?</Text>
          <Text className="text-gray-600 leading-6 mb-4">Configure os itens abaixo quando puder. Você não precisa preencher tudo agora.</Text>
          {(financial.loading || fixed.loading) ? <ActivityIndicator color="#4f46e5" /> : (financial.error || fixed.error) ?
            <View className="bg-gray-50 rounded-xl p-4 mb-3">
              <Text className="text-gray-600">Não foi possível consultar suas configurações.</Text>
              <Pressable onPress={() => { void financial.loadSettings(); void fixed.loadExpenses(); }} className="py-3"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable>
            </View> :
            <View className="gap-3">
              {checklist.map(item => <Pressable accessibilityRole="button" key={item.route} disabled={saving} onPress={() => router.push(item.route)} className="flex-row items-center gap-3 rounded-xl p-3 border border-gray-200 bg-white">
                <View className="w-11 h-11 rounded-xl bg-indigo-50 items-center justify-center">
                  <Ionicons name={item.icon} color="#4f46e5" size={23} />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-semibold">{item.title}</Text>
                  <Text className="text-gray-600 text-sm mt-1">{item.summary}</Text>
                </View>
                <Ionicons name={item.done ? 'checkmark-circle' : 'chevron-forward'} color={item.done ? '#16a34a' : '#9ca3af'} size={21} />
              </Pressable>)}
            </View>}
          <View className="bg-indigo-50 rounded-xl p-4 mt-4">
            <Text className="text-indigo-800 text-sm leading-5">Você também pode configurar despesas adicionais na Central financeira. Retome este guia a qualquer momento pela aba Mais.</Text>
          </View>
        </>}
      </ScrollView>
      <View className="px-6 pb-4 pt-3 border-t border-gray-100">
        {!!error && <Text accessibilityRole="alert" className="text-red-600 text-sm mb-3">{error}</Text>}
        <View className="flex-row items-center justify-center gap-2 mb-4">
          {[0, 1, 2].map(index => <View key={index} accessibilityLabel={'Etapa ' + (index + 1) + ' de 3'} style={{ width: step === index ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: step === index ? '#4f46e5' : '#d1d5db' }} />)}
        </View>
        <Pressable accessibilityRole="button" disabled={saving} onPress={() => intro ? setStep(value => value + 1) : void closeGuide()} className="bg-indigo-600 rounded-xl p-4 flex-row items-center justify-center gap-2">
          {saving ? <ActivityIndicator color="#fff" /> : <>
            <Text className="text-white font-bold text-base">{step === 0 ? 'Vamos começar' : step === 1 ? 'Configurar meu negócio' : 'Começar a usar'}</Text>
            <Ionicons name="arrow-forward" size={19} color="#fff" />
          </>}
        </Pressable>
        {step > 0 && <Pressable accessibilityRole="button" disabled={saving} onPress={() => setStep(value => value - 1)} className="items-center p-3"><Text className="text-gray-600 font-semibold">Voltar</Text></Pressable>}
      </View>
    </SafeAreaView>
  );
}
