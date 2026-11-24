import { ComponentProps, ComponentRef, useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, AppState, Pressable, ScrollView, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

export interface Tip {
  title: string;
  description: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  iconColor?: string;
}

interface TipsCarouselProps {
  title?: string;
  tips: readonly Tip[];
}

const AUTO_SCROLL_INTERVAL_MS = 10000;

// Avança automaticamente até a primeira interação manual.
export function TipsCarousel({ title = 'Dicas de precificação', tips }: TipsCarouselProps) {
  const [expanded, setExpanded] = useState(true);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const [manualNavigation, setManualNavigation] = useState(false);
  const manualNavigationRef = useRef(false);
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');
  const [reduceMotion, setReduceMotion] = useState(true);
  const [screenReader, setScreenReader] = useState(true);

  useEffect(() => {
    let mounted = true;
    const appSubscription = AppState.addEventListener('change', state => setAppActive(state === 'active'));
    const motionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const readerSubscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduceMotion(value); }).catch(() => {});
    void AccessibilityInfo.isScreenReaderEnabled().then(value => { if (mounted) setScreenReader(value); }).catch(() => {});
    return () => {
      mounted = false;
      appSubscription.remove();
      motionSubscription.remove();
      readerSubscription.remove();
    };
  }, []);

  // Interrompe a rotação quando a tela perde o foco ou o app vai para segundo plano.
  useFocusEffect(useCallback(() => {
    if (!expanded || width <= 0 || tips.length <= 1 || manualNavigation || !appActive || reduceMotion || screenReader) return;
    const timer = setTimeout(() => {
      if (manualNavigationRef.current || AppState.currentState !== 'active') return;
      const nextIndex = (activeIndex + 1) % tips.length;
      scrollRef.current?.scrollTo({ x: nextIndex * width, animated: nextIndex !== 0 });
      setActiveIndex(nextIndex);
    }, AUTO_SCROLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [expanded, width, tips.length, manualNavigation, appActive, reduceMotion, screenReader, activeIndex]));

  function stopAutoScroll() {
    manualNavigationRef.current = true;
    setManualNavigation(true);
  }

  function updatePage(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!width) return;
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(Math.max(0, Math.min(tips.length - 1, index)));
  }

  function goToPage(index: number) {
    stopAutoScroll();
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
  }

  function toggleExpanded() {
    setExpanded(value => !value);
    setActiveIndex(0);
  }

  if (!tips.length) return null;

  return (
    <View className="mb-4">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={expanded ? 'Recolher ' + title : 'Mostrar ' + title}
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}
        className="flex-row items-center justify-between py-2 mb-1"
      >
        <View className="flex-row items-center flex-1 gap-2">
          <Ionicons name="bulb-outline" size={20} color="#4f46e5" />
          <Text className="text-gray-800 font-bold text-base flex-1">{title}</Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Text className="text-indigo-600 text-sm">{expanded ? 'Recolher' : 'Mostrar'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#4f46e5" />
        </View>
      </Pressable>
      {expanded && (
        <View onLayout={event => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth !== width) {
            setWidth(nextWidth);
            setActiveIndex(0);
          }
        }}>
          {width > 0 && (
            <>
              <ScrollView
                key={width}
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                bounces={false}
                scrollEventThrottle={32}
                onScrollBeginDrag={stopAutoScroll}
                onScroll={updatePage}
                onMomentumScrollEnd={updatePage}
                accessibilityLabel="Dicas, deslize para ver mais"
                contentContainerStyle={{ alignItems: 'stretch' }}
              >
                {tips.map(tip => (
                  <View key={tip.title} style={{ width }} className="bg-white border border-gray-200 rounded-xl p-4 gap-2">
                    <View className="flex-row items-center gap-2">
                      <Ionicons name={tip.icon} color={tip.iconColor ?? '#4f46e5'} size={24} />
                      <Text className="text-gray-800 font-bold flex-1">{tip.title}</Text>
                    </View>
                    <Text className="text-gray-600 text-sm leading-5">{tip.description}</Text>
                  </View>
                ))}
              </ScrollView>
              <View className="flex-row items-center justify-center mt-1">
                {tips.map((tip, index) => (
                  <Pressable
                    key={tip.title}
                    accessibilityRole="button"
                    accessibilityLabel={'Dica ' + (index + 1) + ' de ' + tips.length + ': ' + tip.title}
                    accessibilityState={{ selected: activeIndex === index }}
                    onPress={() => goToPage(index)}
                    className="w-9 h-9 items-center justify-center"
                  >
                    <View className={'h-2 rounded-full ' + (activeIndex === index ? 'w-5 bg-indigo-600' : 'w-2 bg-gray-300')} />
                  </Pressable>
                ))}
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );
}
