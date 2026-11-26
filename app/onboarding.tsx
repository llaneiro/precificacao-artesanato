import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../src/hooks/useExpenses';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { financialGuide, requiredGuideProgress } from '../src/utils/financialGuide';

export default function FinancialGuideScreen() {
  const router = useRouter();
  const pricing = usePricingSettings(true, true);
  const fixed = useExpenses();
  const steps = financialGuide(pricing.settings, fixed.expenses);
  const progress = requiredGuideProgress(steps);
  const [index, setIndex] = useState<number | null>(null);
  const loading = pricing.loading || fixed.loading;
  const error = pricing.error || fixed.error;
  const ready = !loading && !error;
  const nextPending = steps.findIndex(step => !step.done && !step.optional);

  // Retoma a partir dos dados realmente salvos, não de um marcador de tutorial.
  // Ao voltar de um formulário, mantém a etapa para mostrar o resultado.
  useEffect(() => {
    if (ready && index === null) setIndex(nextPending >= 0 ? nextPending : 0);
  }, [ready, index, nextPending]);

  const currentIndex = index ?? 0;
  const current = steps[currentIndex];
  const isLast = currentIndex === steps.length - 1;
  const allRequired = progress.completed === progress.total;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/expenses');
  }

  function next() {
    if (isLast) close();
    else setIndex(currentIndex + 1);
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-gray-50">
      {loading ? (
        <ActivityIndicator color="#4f46e5" className="mt-10" />
      ) : error ? (
        <View className="p-4">
          <Text className="text-gray-700">Não foi possível carregar suas configurações.</Text>
          <Pressable accessibilityRole="button" onPress={() => { void pricing.loadSettings(); void fixed.loadExpenses(); }} className="py-4"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable>
        </View>
      ) : index === null ? (
        <ActivityIndicator color="#4f46e5" className="mt-10" />
      ) : (
        <>
          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 24 }}>
            <View className="flex-row flex-wrap items-center justify-between gap-2 mb-3">
              <Text className="text-indigo-700 font-semibold text-sm">Etapa {currentIndex + 1} de {steps.length}</Text>
              <Text className="text-gray-500 text-xs">{progress.completed}/{progress.total} essenciais concluídas</Text>
            </View>
            <View className="flex-row gap-2 mb-5">
              {steps.map((step, i) => (
                <Pressable key={step.route} accessibilityRole="button" accessibilityLabel={'Etapa ' + (i + 1) + ': ' + step.title + (step.done ? ', configurada' : step.optional ? ', opcional' : ', não configurada')} accessibilityState={{ selected: i === currentIndex }} onPress={() => setIndex(i)} className={'flex-1 min-h-12 rounded-xl items-center justify-center border ' + (i === currentIndex ? 'bg-indigo-600 border-indigo-600' : step.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200')}>
                  <Ionicons name={step.done ? 'checkmark' : step.icon} size={20} color={i === currentIndex ? '#fff' : step.done ? '#15803d' : '#9ca3af'} />
                </Pressable>
              ))}
            </View>
            <View className="bg-white rounded-2xl border border-gray-200 p-5">
              <View className="w-16 h-16 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
                <Ionicons name={current.icon} size={32} color="#4f46e5" />
              </View>
              <Text className="text-indigo-700 font-semibold text-sm mb-1">{current.title}{current.optional ? ' · Opcional' : ''}</Text>
              <Text className="text-2xl font-bold text-gray-900 mb-3">{current.question}</Text>
              <Text className="text-gray-600 leading-6">{current.description}</Text>
              <View className="bg-indigo-50 rounded-xl p-3 mt-4 flex-row items-start gap-2">
                <Ionicons name="bulb-outline" size={20} color="#4f46e5" />
                <Text className="text-indigo-800 text-sm leading-5 flex-1">{current.example}</Text>
              </View>
              {current.done && <View className="bg-green-50 rounded-xl p-3 mt-4 flex-row items-center gap-2">
                <Ionicons name="checkmark-circle" size={21} color="#15803d" />
                <View className="flex-1">
                  <Text className="text-green-800 font-semibold">Configuração salva</Text>
                  <Text className="text-green-700 text-sm mt-1">{current.summary}</Text>
                </View>
              </View>}
            </View>
            {current.done && <Pressable accessibilityRole="button" onPress={() => router.push(current.route)} className="items-center py-4">
              <Text className="text-indigo-700 font-semibold">Revisar configuração</Text>
            </Pressable>}
            <Text className="text-gray-500 text-xs text-center mt-4 leading-5">Você pode continuar depois. Os dados que já salvou serão mantidos.</Text>
          </ScrollView>
          <View className="bg-white border-t border-gray-100 px-5 pt-4 pb-4">
            <Pressable accessibilityRole="button" onPress={() => current.done ? next() : router.push(current.route)} className="bg-indigo-600 rounded-xl p-4 flex-row items-center justify-center gap-2">
              <Text className="text-white text-base font-bold">{current.done ? isLast ? allRequired ? 'Concluir configuração' : 'Voltar à Central financeira' : 'Próxima etapa' : 'Configurar agora'}</Text>
              <Ionicons name={current.done && isLast ? 'checkmark' : 'arrow-forward'} size={20} color="#fff" />
            </Pressable>
            <View className="flex-row justify-between items-center mt-2">
              <Pressable accessibilityRole="button" onPress={() => currentIndex > 0 ? setIndex(currentIndex - 1) : close()} className="py-3 px-1">
                <Text className="text-gray-600 font-semibold">{currentIndex > 0 ? 'Anterior' : 'Sair do guia'}</Text>
              </Pressable>
              {!current.done && <Pressable accessibilityRole="button" onPress={next} className="py-3 px-1">
                <Text className="text-indigo-700 font-semibold">{isLast ? allRequired ? 'Concluir sem margem' : 'Voltar à Central' : 'Deixar para depois'}</Text>
              </Pressable>}
            </View>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
