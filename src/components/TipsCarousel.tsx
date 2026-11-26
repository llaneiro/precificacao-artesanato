import { type ComponentProps, type ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, PixelRatio, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export interface Tip {
  category: string;
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
}

const AUTO_SCROLL_INTERVAL_MS = 12000;

export function TipsCarousel({ title = 'Vale lembrar', tips }: { title?: string; tips: readonly Tip[] }) {
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const indexRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [screenReader, setScreenReader] = useState(true);

  useEffect(() => {
    let mounted = true;
    const subscriptions = [
      AppState.addEventListener('change', state => setAppActive(state === 'active')),
      AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion),
      AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader),
    ];
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
    void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (mounted) setScreenReader(value); }).catch(() => {});
    return () => { mounted = false; subscriptions.forEach(subscription => subscription.remove()); };
  }, []);

  const goToPage = useCallback((index: number, animated = true) => {
    if (width <= 0 || !tips.length) return;
    const next = (index + tips.length) % tips.length;
    indexRef.current = next;
    setActiveIndex(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: animated && !reduceMotion && Math.abs(next - index) <= 1 });
  }, [width, tips.length, reduceMotion]);

  useFocusEffect(useCallback(() => {
    if (width <= 0 || tips.length < 2 || paused || !appActive || reduceMotion || screenReader) return;
    const timer = setInterval(() => {
      if (!pausedRef.current && AppState.currentState === 'active') {
        const next = indexRef.current + 1;
        goToPage(next, next < tips.length);
      }
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [width, tips.length, paused, appActive, reduceMotion, screenReader, goToPage]));

  function pause() { pausedRef.current = true; setPaused(true); }
  function togglePause() { pausedRef.current = !pausedRef.current; setPaused(pausedRef.current); }
  function updatePage(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    // A paginação nativa utiliza a largura do viewport, não a largura arredondada em dp.
    const viewport = layoutMeasurement.width || width;
    const index = Math.max(0, Math.min(tips.length - 1, Math.round(contentOffset.x / viewport)));
    indexRef.current = index;
    setActiveIndex(index);
  }

  if (!tips.length) return null;
  return <View className="rounded-2xl bg-indigo-50 p-4 mb-6">
    <View className="flex-row items-center gap-2 mb-2">
      <Ionicons name="bulb-outline" size={22} color="#6366f1" />
      <Text accessibilityRole="header" className="text-indigo-800 font-semibold flex-1">{title}</Text>
      <Text className="text-indigo-600 text-xs">{activeIndex + 1} de {tips.length}</Text>
    </View>
    <View style={{ overflow: 'hidden' }} onLayout={event => {
      // Viewport e páginas devem ocupar exatamente o mesmo número de pixels físicos.
      // Arredondar em dp acumula um deslocamento a cada página em telas com densidade fracionária.
      const nextWidth = PixelRatio.roundToNearestPixel(event.nativeEvent.layout.width);
      if (nextWidth > 0 && nextWidth !== width) {
        indexRef.current = 0;
        setActiveIndex(0);
        setWidth(nextWidth);
      }
    }}>
      {width > 0 && <ScrollView key={width} ref={scrollRef} horizontal pagingEnabled bounces={false}
        style={{ width, flexGrow: 0, overflow: 'hidden' }}
        showsHorizontalScrollIndicator={false} scrollEventThrottle={32} onScrollBeginDrag={pause}
        disableIntervalMomentum decelerationRate="fast" overScrollMode="never"
        onScrollEndDrag={updatePage} onMomentumScrollEnd={updatePage}
        onTouchStart={pause}
        accessibilityLabel="Dicas, deslize para navegar" contentContainerStyle={{ alignItems: 'stretch' }}>
        {tips.map((tip, index) => <View key={tip.title} style={{ width, minWidth: width, maxWidth: width, flexGrow: 0, flexShrink: 0 }} accessibilityElementsHidden={index !== activeIndex}
          importantForAccessibility={index === activeIndex ? 'auto' : 'no-hide-descendants'} className="flex-row items-center gap-3 py-2 min-h-[88px]">
          <View className="flex-1 gap-1">
            <Text className="text-indigo-900 font-bold text-lg">{tip.title}</Text>
            <Text className="text-indigo-800 text-sm leading-5">{tip.description}</Text>
          </View>
          <View className="w-14 h-14 shrink-0 rounded-2xl bg-indigo-100 items-center justify-center">
            <Ionicons name={tip.icon} size={30} color="#6366f1" />
          </View>
        </View>)}
      </ScrollView>}
    </View>
    {tips.length > 1 && <View className="items-center mt-2">
      <View accessible accessibilityRole="adjustable"
        accessibilityLabel="Navegação das dicas"
        accessibilityValue={{ min: 1, max: tips.length, now: activeIndex + 1, text: (activeIndex + 1) + ' de ' + tips.length }}
        accessibilityActions={[
          { name: 'increment', label: 'Próxima dica' },
          { name: 'decrement', label: 'Dica anterior' },
          ...(!reduceMotion && !screenReader ? [{ name: 'toggleRotation', label: paused ? 'Retomar rotação automática' : 'Pausar rotação automática' }] : []),
        ]}
        onAccessibilityAction={event => {
          const action = event.nativeEvent.actionName;
          if (action === 'toggleRotation') togglePause();
          else if (action === 'increment') { pause(); goToPage(indexRef.current + 1, indexRef.current < tips.length - 1); }
          else if (action === 'decrement') { pause(); goToPage(indexRef.current - 1, indexRef.current > 0); }
        }}
        className="w-24 h-1 rounded-full bg-indigo-200 overflow-hidden">
        <View className="h-full rounded-full bg-indigo-600" style={{ width: ((activeIndex + 1) / tips.length * 100) + '%' }} />
      </View>
    </View>}
  </View>;
}
