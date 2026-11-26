import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpenses } from '../src/hooks/useExpenses';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { financialGuide, requiredGuideProgress } from '../src/utils/financialGuide';

type GuideStep = ReturnType<typeof financialGuide>[number];

function GuideCard({ step }: { step: GuideStep }) {
  return (
    <View className="bg-white rounded-2xl border border-gray-200 p-5">
      <View className="w-14 h-14 bg-indigo-50 rounded-2xl items-center justify-center mb-4">
        <Ionicons name={step.icon} size={28} color="#4f46e5" />
      </View>
      <Text className="text-indigo-700 font-semibold text-sm mb-1">{step.title}{step.optional ? ' · Opcional' : ''}</Text>
      <Text accessibilityRole="header" className="text-2xl font-bold text-gray-900 mb-3">{step.question}</Text>
      <Text className="text-gray-600 leading-6">{step.description}</Text>
      <View className="bg-indigo-50 rounded-xl p-3 mt-4 flex-row items-start gap-2">
        <Ionicons name="bulb-outline" size={20} color="#4f46e5" />
        <Text className="text-indigo-800 text-sm leading-5 flex-1">{step.example}</Text>
      </View>
      {step.done && (
        <View className="bg-green-50 rounded-xl p-3 mt-4 flex-row items-center gap-2">
          <Ionicons name="checkmark-circle" size={21} color="#15803d" />
          <View className="flex-1">
            <Text className="text-green-800 font-semibold">Configuração salva</Text>
            <Text className="text-green-700 text-sm mt-1">{step.summary}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

export default function FinancialGuideScreen() {
  const router = useRouter();
  const pricing = usePricingSettings(true, true);
  const fixed = useExpenses();
  const steps = financialGuide(pricing.settings, fixed.expenses);
  const progress = requiredGuideProgress(steps);
  const [index, setIndex] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState(0);
  const carousel = useRef<FlatList<GuideStep>>(null);
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { isViewable: boolean; index?: number | null }[] }) => {
    const visible = viewableItems.find(item => item.isViewable && item.index != null);
    if (visible?.index != null) setIndex(visible.index);
  }).current;
  const loading = pricing.loading || fixed.loading;
  const error = pricing.error || fixed.error;
  const ready = !loading && !error;
  const nextPending = steps.findIndex(step => !step.done && !step.optional);

  // Retoma a primeira pendência real; ao voltar de um formulário, mantém a etapa.
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

  function goTo(target: number) {
    if (!ready || target < 0 || target >= steps.length || target === currentIndex) return;
    // A etapa ativa acompanha o card visível, inclusive durante gestos manuais.
    carousel.current?.scrollToIndex({ index: target, animated: true });
  }

  function next() {
    if (isLast) close();
    else goTo(currentIndex + 1);
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{
        headerBackVisible: false,
        gestureEnabled: false,
        headerRight: () => (
          <Pressable accessibilityRole="button" accessibilityLabel="Fechar guia" onPress={close} className="min-w-11 min-h-11 items-center justify-center">
            <Ionicons name="close" size={26} color="#fff" />
          </Pressable>
        ),
      }} />
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
          <View className="px-5 pt-4 pb-3">
            <View className="flex-row flex-wrap items-center justify-between gap-2 mb-3">
              <Text className="text-indigo-700 font-semibold text-sm">Etapa {currentIndex + 1} de {steps.length}</Text>
              <Text className="text-gray-500 text-xs">{progress.completed} de {progress.total} essenciais concluídas</Text>
            </View>
            <View className="flex-row gap-2">
              {steps.map((step, i) => (
                <Pressable key={step.route} accessibilityRole="button" accessibilityLabel={'Etapa ' + (i + 1) + ': ' + step.title + (step.done ? ', configurada' : step.optional ? ', opcional' : ', não configurada')} accessibilityState={{ selected: i === currentIndex }} onPress={() => goTo(i)} className={'flex-1 min-h-12 rounded-xl items-center justify-center border ' + (i === currentIndex ? 'bg-indigo-600 border-indigo-600' : step.done ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200')}>
                  <Ionicons name={step.done ? 'checkmark' : step.icon} size={20} color={i === currentIndex ? '#fff' : step.done ? '#15803d' : '#9ca3af'} />
                </Pressable>
              ))}
            </View>
          </View>

          <View className="flex-1" onLayout={event => setPageWidth(event.nativeEvent.layout.width)}>
            {pageWidth > 0 && (
              <FlatList
                key={pageWidth}
                ref={carousel}
                data={steps}
                extraData={currentIndex}
                keyExtractor={step => step.route}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                initialScrollIndex={currentIndex}
                initialNumToRender={steps.length}
                getItemLayout={(_, i) => ({ length: pageWidth, offset: pageWidth * i, index: i })}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                style={{ flex: 1 }}
                renderItem={({ item, index: i }) => (
                  <View style={{ width: pageWidth }} accessibilityElementsHidden={i !== currentIndex} importantForAccessibility={i === currentIndex ? 'auto' : 'no-hide-descendants'}>
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }} nestedScrollEnabled directionalLockEnabled showsVerticalScrollIndicator={false}>
                      <GuideCard step={item} />
                    </ScrollView>
                  </View>
                )}
              />
            )}
          </View>

          <View className="flex-row items-center justify-center gap-2 py-1">
            {steps.map((step, i) => (
              <Pressable key={step.route} accessibilityRole="button" accessibilityLabel={'Ir à etapa ' + (i + 1)} accessibilityState={{ selected: i === currentIndex }} onPress={() => goTo(i)} className="min-h-11 min-w-11 items-center justify-center">
                <View className={'h-2 rounded-full ' + (i === currentIndex ? 'w-6 bg-indigo-600' : 'w-2 bg-gray-300')} />
              </Pressable>
            ))}
          </View>

          <View className="bg-white border-t border-gray-200 px-5 pt-3 pb-3 gap-2">
            {current.done && (
              <Pressable accessibilityRole="button" onPress={() => router.push(current.route)} className="min-h-12 border border-indigo-300 bg-white active:bg-indigo-50 rounded-xl px-3 py-3 flex-row items-center justify-center gap-2">
                <Ionicons name="create-outline" size={20} color="#4f46e5" />
                <Text className="text-indigo-700 font-semibold text-center">Revisar configuração</Text>
              </Pressable>
            )}
            <View className="flex-row gap-2">
              <Pressable accessibilityRole="button" accessibilityLabel="Etapa anterior" accessibilityState={{ disabled: currentIndex === 0 }} disabled={currentIndex === 0} onPress={() => goTo(currentIndex - 1)} className={'w-14 min-h-14 border rounded-xl items-center justify-center ' + (currentIndex === 0 ? 'bg-gray-50 border-gray-200' : 'bg-white border-indigo-300 active:bg-indigo-50')}>
                <Ionicons name="arrow-back" size={23} color={currentIndex === 0 ? '#d1d5db' : '#4f46e5'} />
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => current.done ? next() : router.push(current.route)} className="flex-1 min-h-14 bg-indigo-600 active:bg-indigo-700 rounded-xl px-3 py-3 flex-row items-center justify-center gap-2">
                <Text className="text-white text-base font-bold text-center flex-shrink">{current.done ? isLast ? allRequired ? 'Concluir configuração' : 'Voltar à Central financeira' : 'Próxima etapa' : 'Configurar agora'}</Text>
                <Ionicons name={current.done && isLast ? allRequired ? 'checkmark' : 'arrow-forward' : 'arrow-forward'} size={20} color="#fff" />
              </Pressable>
            </View>
            {!current.done && (
              <Pressable accessibilityRole="button" onPress={next} className="min-h-11 items-center justify-center px-2">
                <Text className="text-gray-600 font-medium text-center">{isLast ? allRequired ? 'Concluir sem margem' : 'Voltar à Central' : 'Deixar para depois'}</Text>
              </Pressable>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
