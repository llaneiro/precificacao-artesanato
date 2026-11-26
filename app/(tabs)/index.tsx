import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MainScreen } from '../../src/components/MainScreen';
import { useDashboard } from '../../src/hooks/useDashboard';
import { DashboardAction } from '../../src/components/DashboardAction';
import { formatCurrency } from '../../src/utils/currency';

export default function HomeScreen() {
  const router = useRouter();
  const { data, loading, error, load } = useDashboard();
  return <MainScreen>
    <Tabs.Screen options={{ title:'Início', headerRight: () => <View style={{ marginRight:16 }}><Pressable accessibilityRole="button" accessibilityLabel="Configurar lembretes" onPress={() => router.push('/dashboard-settings')} className="w-11 h-11 items-center justify-center"><Ionicons name="settings-outline" size={24} color="#fff" /></Pressable></View> }} />
    <ScrollView contentContainerStyle={{ padding:16, paddingBottom:24 }} refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor="#4f46e5" colors={['#4f46e5']} />}>
      <Text className="text-2xl font-bold text-gray-900">Olá! 👋</Text>
      <Text className="text-gray-500 text-sm mt-1 mb-4">Vamos cuidar dos preços do seu negócio?</Text>
      {error ? <View className="bg-white rounded-xl p-4"><Text className="text-red-600">{error}</Text><Pressable onPress={() => void load()} className="py-3"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable></View> :
        !data ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : <>
        <View className="flex-row gap-3 mb-5">
          <Pressable onPress={() => router.push('/materials')} className="flex-1 bg-white rounded-2xl border border-gray-200 p-3">
            <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center mb-2"><Ionicons name="layers-outline" color="#4f46e5" size={23} /></View>
            <Text className="text-2xl font-bold text-gray-900">{data.materialCount}</Text><Text className="text-gray-500 text-xs">Materiais cadastrados</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/products')} className="flex-1 bg-white rounded-2xl border border-gray-200 p-3">
            <View className="w-10 h-10 rounded-xl bg-indigo-50 items-center justify-center mb-2"><Ionicons name="cube-outline" color="#4f46e5" size={23} /></View>
            <Text className="text-2xl font-bold text-gray-900">{data.productCount}</Text><Text className="text-gray-500 text-xs">Produtos cadastrados</Text>
          </Pressable>
        </View>
        <Text className="text-lg font-bold text-gray-800 mb-3">Ações rápidas</Text>
        <View className="flex-row gap-2 mb-5">
          {([{ label:'Novo material', icon:'layers-outline', route:'/material-form' },{label:'Novo produto',icon:'cube-outline',route:'/product-form'},{label:'Precificar',icon:'calculator-outline',route:'/dashboard-reviews'}] as const).map(a => <Pressable key={a.label} accessibilityRole="button" onPress={() => a.route === '/dashboard-reviews' ? router.push({pathname:a.route,params:{kind:'all'}}) : router.push(a.route)} className="flex-1 bg-white border border-gray-200 rounded-xl p-2 items-center justify-center gap-2 min-h-[92px]">
            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name={a.icon} size={22} color="#4f46e5" /></View>
            <Text className="text-xs text-center font-medium text-gray-800">{a.label}</Text>
          </Pressable>)}
        </View>
        <Text className="text-lg font-bold text-gray-800 mb-3">Precisa da sua atenção</Text>
        <View className="bg-white border border-gray-200 rounded-2xl px-3 mb-5">
          {!!data.materialReviews.length && <DashboardAction icon="time-outline" warning title={data.materialReviews.length + ' materiais para revisar'} subtitle={'Preços sem revisão há ' + data.interval + ' dias ou sem conferência'} onPress={() => router.push({pathname:'/dashboard-reviews',params:{kind:'materials'}})} />}
          {!!data.productReviews.length && <DashboardAction icon="refresh-outline" warning title={data.productReviews.length + ' produtos para reprecificar'} subtitle="Os dados de precificação mudaram" onPress={() => router.push({pathname:'/dashboard-reviews',params:{kind:'products'}})} />}
          {!!data.unpriced.length && <DashboardAction icon="pricetag-outline" warning title={data.unpriced.length + ' produtos sem precificação salva'} onPress={() => router.push({pathname:'/dashboard-reviews',params:{kind:'unpriced'}})} />}
          {!!data.pending.length && <DashboardAction icon="wallet-outline" title="Configuração financeira" subtitle={data.pending.length + ' configurações pendentes'} onPress={() => router.push('/expenses')} />}
          {!data.materialReviews.length && !data.productReviews.length && !data.unpriced.length && !data.pending.length && <View className="flex-row items-center gap-2 py-4"><Ionicons name="checkmark-circle-outline" size={23} color="#15803d"/><Text className="text-gray-700 flex-1">Tudo em dia!</Text></View>}
        </View>
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-800 flex-1">Últimas precificações</Text>
          <Pressable onPress={() => router.push('/pricing-history')} className="py-2"><Text className="text-indigo-700 font-semibold text-sm">Ver todas</Text></Pressable>
        </View>
        {!data.recent.length && <View className="bg-white border border-gray-200 rounded-xl p-4"><Text className="text-gray-500">Nenhuma precificação salva.</Text></View>}
        {data.recent.map(p => <Pressable key={p.id} accessibilityRole="button" onPress={() => router.push({pathname:'/pricing-history-details',params:{id:String(p.id)}})} className="bg-white border border-gray-200 rounded-xl p-3 mb-2 flex-row items-center gap-3">
          <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name="calculator-outline" size={22} color="#4f46e5"/></View>
          <View className="flex-1"><Text className="font-semibold text-gray-800">{p.productName}</Text><Text className="text-gray-500 text-xs mt-1">{new Date(p.createdAt).toLocaleDateString('pt-BR')} · {p.mode==='manual'?'Manual':'Sugerida'}</Text></View>
          <View className="items-end"><Text className="font-bold text-indigo-700">{formatCurrency(p.salePriceCents)}</Text><Text className="text-xs text-gray-500">{p.mode==='manual'?'Preço informado':'Preço base'}</Text></View>
        </Pressable>)}
      </>}
    </ScrollView>
  </MainScreen>;
}
