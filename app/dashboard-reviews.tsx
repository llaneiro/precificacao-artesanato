import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useDashboard } from '../src/hooks/useDashboard';
import { formatCurrency } from '../src/utils/currency';
import { formatReferenceQuantity } from '../src/utils/materialCostHistory';
import { EmptyState } from '../src/components/EmptyState';

export default function DashboardReviews() {
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const router = useRouter();
  const { data, loading, error, load } = useDashboard();
  const materials = kind === 'materials';
  const title = materials ? 'Revisar materiais' : kind === 'products' ? 'Reprecificar produtos' : kind === 'unpriced' ? 'Produtos sem precificação' : 'Escolher produto';
  const items: {id:number;name:string;subtitle:string}[] = !data ? [] : materials ?
    data.materialReviews.map(m => ({id:m.id,name:m.name,subtitle:(m.days===null?'Preço ainda não conferido':'Há '+m.days+' dias')+' · '+formatCurrency(m.costCents)+' / '+formatReferenceQuantity(m.quantity,m.unit)})) :
    kind==='products' ? data.productReviews.map(p=>({...p,subtitle:p.reasons.join(' · ')})) :
    kind==='unpriced' ? data.unpriced.map(p=>({...p,subtitle:'Nenhuma precificação salva'})) :
    data.products.map(p=>({id:p.id,name:p.name,subtitle:''}));
  return <SafeAreaView edges={['bottom','left','right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ title }} />
    <FlatList data={items} keyExtractor={p=>String(p.id)} refreshing={loading} onRefresh={()=>void load()} contentContainerStyle={{padding:16,flexGrow:1}}
      ListEmptyComponent={loading?<ActivityIndicator color="#4f46e5" className="mt-8"/>:error?<Pressable onPress={()=>void load()} className="p-4"><Text className="text-red-600">{error}</Text><Text className="text-indigo-700 mt-2">Tentar novamente</Text></Pressable>:<EmptyState title={kind==='all'?'Nenhum produto cadastrado':'Nenhuma pendência'} subtitle={kind==='all'?'Cadastre um produto para começar.':'Tudo em dia por aqui.'}/>}
      renderItem={({item})=><View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
        <Text className="font-bold text-gray-800">{item.name}</Text>
        {!!item.subtitle && <Text className="text-gray-500 text-sm mt-1">{item.subtitle}</Text>}
        <Pressable accessibilityRole="button" onPress={()=>router.push({pathname:materials?'/material-price-form':'/product-pricing',params:{id:String(item.id)}})} className="bg-indigo-50 rounded-lg min-h-11 justify-center items-center mt-3"><Text className="text-indigo-700 font-semibold">{materials?'Atualizar preço':'Precificar'}</Text></Pressable>
      </View>}/>
  </SafeAreaView>;
}
