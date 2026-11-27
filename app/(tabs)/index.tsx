import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MainScreen } from '../../src/components/MainScreen';
import { useDashboard } from '../../src/hooks/useDashboard';
import { TipsCarousel } from '../../src/components/TipsCarousel';
import { SESSION_HOME_TIPS } from '../../src/utils/homeTips';
import { formatCurrency } from '../../src/utils/currency';
import { homeNextStep } from '../../src/utils/homeNextStep';

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, error, load } = useDashboard();
  const reviews = data ? [
    { title: 'Materiais para revisar', count: data.materialReviews.length, icon: 'time-outline', kind: 'materials' },
    { title: 'Produtos para reprecificar', count: data.productReviews.length, icon: 'refresh-outline', kind: 'products' },
    { title: 'Produtos sem precificação', count: data.unpriced.length, icon: 'pricetag-outline', kind: 'unpriced' },
  ] as const : [];
  const activeReviews = reviews.filter(item => item.count > 0);
  const step = homeNextStep(error ? null : data);
  const completed = data ? Math.max(0, 3 - data.pending.length) : 0;
  const hero = step === 'costs' ? {
    title: 'Prepare seu negócio',
    description: data?.materialCount === 0 ? 'Configure os custos do ateliê e cadastre seus materiais antes de precificar.' : 'Complete as configurações financeiras antes de calcular seus preços.',
    label: completed ? 'Continuar configuração' : 'Configurar custos',
    icon: 'wallet-outline' as const,
    illustration: 'wallet' as const,
    onPress: () => router.push('/expenses'),
  } : step === 'materials' ? {
    title: 'Cadastre seus materiais',
    description: 'Informe os preços e as quantidades dos materiais que utiliza nas suas peças.',
    label: 'Cadastrar material',
    icon: 'layers-outline' as const,
    illustration: 'layers' as const,
    onPress: () => router.push('/material-form'),
  } : step === 'product' ? {
    title: 'Cadastre sua primeira criação',
    description: 'Informe os materiais utilizados e o tempo de confecção da peça.',
    label: 'Cadastrar produto',
    icon: 'add-circle-outline' as const,
    illustration: 'cube' as const,
    onPress: () => router.push('/product-form'),
  } : step === 'pricing' ? {
    title: 'Quanto vale sua próxima criação?',
    description: 'Calcule um preço que valorize seu trabalho.',
    label: 'Calcular preço',
    icon: 'calculator-outline' as const,
    illustration: 'calculator' as const,
    onPress: () => router.push({ pathname: '/dashboard-reviews', params: { kind: 'all' } }),
  } : null;
  const productShortcut = { label: 'Novo produto', icon: 'add-circle-outline', route: '/product-form' } as const;
  const materialShortcut = { label: 'Novo material', icon: 'layers-outline', route: '/material-form' } as const;
  const historyShortcut = { label: 'Histórico', icon: 'time-outline', route: '/pricing-history' } as const;
  const shortcuts = step === 'pricing' || step === 'product'
    ? [productShortcut, materialShortcut, historyShortcut]
    : [materialShortcut, productShortcut, historyShortcut];
  return <MainScreen>
    <Tabs.Screen options={{ title: 'Início', headerRight: () => <View style={{ marginRight: 16 }}><Pressable accessibilityRole="button" accessibilityLabel="Configurar lembretes" onPress={() => router.push('/dashboard-settings')} className="w-11 h-11 items-center justify-center"><Ionicons name="settings-outline" size={24} color="#fff" /></Pressable></View> }} />
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#4f46e5" colors={['#4f46e5']} />}>
      {hero && <View className="bg-indigo-600 rounded-2xl p-4 mb-5 overflow-hidden">
        <View className="flex-row items-center gap-3 mb-4">
          <View className="flex-1 gap-2">
            <Text accessibilityRole="header" className="text-white text-2xl font-bold">{hero.title}</Text>
            <Text className="text-indigo-100 text-sm leading-5">{hero.description}</Text>
          </View>
          <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="w-20 h-24 items-center justify-center">
            <View className="absolute w-20 h-20 rounded-full bg-indigo-500" />
            <View style={{ transform: [{ rotate: '12deg' }] }} className="w-14 h-20 rounded-xl bg-indigo-200 items-center justify-center">
              <Ionicons name={hero.illustration} size={49} color="#6366f1" />
            </View>
            <View className="absolute bottom-1 left-0 w-8 h-8 rounded-full bg-amber-100 items-center justify-center"><Text className="text-amber-700 font-bold text-lg">$</Text></View>
            <View className="absolute top-0 right-0"><Ionicons name="sparkles" size={23} color="#e0e7ff" /></View>
          </View>
        </View>
        {step === 'costs' && <View className="mb-4">
          <Text className="text-indigo-100 text-xs font-medium mb-2">{completed} de 3 etapas essenciais concluídas</Text>
          <View accessibilityRole="progressbar" accessibilityLabel="Etapas essenciais concluídas" accessibilityValue={{ min: 0, max: 3, now: completed }} className="h-2 rounded-full bg-indigo-400 overflow-hidden">
            <View className="h-full bg-white rounded-full" style={{ width: (completed / 3 * 100) + '%' }} />
          </View>
        </View>}
        <Pressable accessibilityRole="button" onPress={hero.onPress} className="min-h-12 bg-white rounded-xl px-3 py-3 flex-row items-center justify-center gap-2 active:bg-indigo-100">
          <Ionicons name={hero.icon} size={21} color="#4f46e5" />
          <Text className="text-indigo-700 font-bold text-base text-center shrink">{hero.label}</Text>
          <Ionicons name="arrow-forward" size={18} color="#4f46e5" />
        </Pressable>
      </View>}
      <View className="flex-row gap-2 mb-5">
        {shortcuts.map(item => <Pressable key={item.label} accessibilityRole="button" onPress={() => router.push(item.route)} className="flex-1 items-center gap-2 py-1">
          <View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center"><Ionicons name={item.icon} size={28} color="#4f46e5" /></View>
          <Text className="text-gray-700 text-xs font-medium text-center">{item.label}</Text>
        </Pressable>)}
      </View>
      <TipsCarousel tips={SESSION_HOME_TIPS} />
      {!!error ? <View className="bg-white rounded-xl border border-gray-200 p-4"><Text className="text-red-700">{error}</Text><Pressable accessibilityRole="button" onPress={() => void load()} className="min-h-11 justify-center"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable></View> :
        !data ? <ActivityIndicator className="mt-3" color="#4f46e5" /> : <>
        <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 mb-3">Acompanhe seus preços</Text>
        <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6">
          {activeReviews.map((item, index) => <Pressable key={item.kind} accessibilityRole="button" accessibilityLabel={item.count + ' · ' + item.title} onPress={() => router.push({ pathname: '/dashboard-reviews', params: { kind: item.kind } })} className={'flex-row items-center gap-2 px-3 py-3 min-h-14 active:bg-gray-50 ' + (index ? 'border-t border-gray-100' : '')}>
            <View className="w-9 h-9 rounded-lg bg-amber-50 items-center justify-center"><Ionicons name={item.icon} color="#b45309" size={20} /></View>
            <Text className="flex-1 text-gray-800 font-medium text-sm">{item.title}</Text>
            <Text className="text-amber-700 font-bold">{item.count}</Text>
            <Ionicons name="chevron-forward" size={17} color="#9ca3af" />
          </Pressable>)}
          {!activeReviews.length && <View className="flex-row items-center gap-3 p-4">
            <Ionicons name={!data.productCount ? 'pricetag-outline' : 'checkmark-circle-outline'} size={25} color={!data.productCount ? '#6366f1' : '#15803d'} />
            <View className="flex-1">
              <Text className={'font-semibold ' + (!data.productCount ? 'text-gray-800' : 'text-green-700')}>{!data.materialCount && !data.productCount ? 'Comece pelos seus materiais' : data.productCount === 0 ? 'Cadastre seus produtos' : 'Preços em dia!'}</Text>
              <Text className="text-gray-500 text-sm mt-1">{!data.materialCount && !data.productCount ? 'As revisões de preços aparecerão aqui.' : data.productCount === 0 ? 'As revisões dos produtos aparecerão aqui.' : 'Nenhuma revisão de preços pendente.'}</Text>
            </View>
          </View>}
        </View>
        <View className="flex-row items-center gap-2 mb-2">
          <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 flex-1">Precificações recentes</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Ver todas as precificações" onPress={() => router.push('/pricing-history')} className="min-h-11 justify-center"><Text className="text-indigo-700 font-semibold text-sm">Ver todas</Text></Pressable>
        </View>
        {!data.recent.length && <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3"><Text className="text-gray-600 text-sm">Suas precificações salvas aparecerão aqui.</Text></View>}
        {data.recent.map((item, index) => <Pressable key={item.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/pricing-history-details', params: { id: String(item.id) } })} className={'flex-row items-center gap-3 py-3 min-h-16 active:bg-gray-100 ' + (index ? 'border-t border-gray-200' : '')}>
          <View className="w-11 h-11 rounded-xl bg-indigo-50 items-center justify-center"><Ionicons name={item.mode === 'manual' ? 'create-outline' : 'calculator-outline'} size={23} color="#6366f1" /></View>
          <View className="flex-1">
            <Text className="font-semibold text-gray-800" numberOfLines={2}>{item.productName}</Text>
            <Text className="text-gray-500 text-xs mt-1">{new Date(item.createdAt).toLocaleDateString('pt-BR')} · {item.mode === 'manual' ? 'Manual' : 'Sugerida'}</Text>
          </View>
          <View className="items-end flex-shrink">
            <Text className="font-bold text-indigo-700 text-right">{formatCurrency(item.salePriceCents)}</Text>
            <Text className="text-gray-500 text-xs text-right">{item.mode === 'manual' ? 'Preço informado' : 'Preço base'}</Text>
            <Text className={'text-xs mt-1 text-right ' + (item.profitCents < 0 ? 'text-red-700' : item.profitCents > 0 ? 'text-green-700' : 'text-gray-600')}>{item.profitCents < 0 ? 'Prejuízo est.: ' + formatCurrency(-item.profitCents) : item.profitCents > 0 ? 'Lucro est.: ' + formatCurrency(item.profitCents) : 'Sem lucro ou prejuízo'}</Text>
          </View>
        </Pressable>)}
        <View className="flex-row flex-wrap justify-center items-center gap-3 mt-6">
          <Pressable accessibilityRole="button" onPress={() => router.push('/products')} className="flex-row items-center min-h-11 gap-1"><Ionicons name="cube-outline" color="#9ca3af" size={16} /><Text className="text-gray-500 text-xs">{data.productCount} {data.productCount === 1 ? 'produto' : 'produtos'}</Text></Pressable>
          <View className="w-px h-3 bg-gray-300" />
          <Pressable accessibilityRole="button" onPress={() => router.push('/materials')} className="flex-row items-center min-h-11 gap-1"><Ionicons name="layers-outline" color="#9ca3af" size={16} /><Text className="text-gray-500 text-xs">{data.materialCount} {data.materialCount === 1 ? 'material' : 'materiais'}</Text></Pressable>
        </View>
      </>}
    </ScrollView>
  </MainScreen>;
}
