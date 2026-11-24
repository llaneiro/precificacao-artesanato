import { HelpLabel } from '../src/components/HelpTip';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePricingHistory } from '../src/hooks/usePricingHistory';
import { EmptyState } from '../src/components/EmptyState';
import { formatCurrency } from '../src/utils/currency';

export default function PricingHistoryScreen() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams<{ productId?: string; productName?: string }>();
  const { records, loading, error, load } = usePricingHistory(productId === undefined ? undefined : Number(productId));
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Histórico de precificações' }} />
      <FlatList data={records} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void load()}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        ListHeaderComponent={<View className="mb-4">
          {productName && <Text className="text-xl font-bold text-gray-800 mb-2">{productName}</Text>}
          <HelpLabel title="Simulações salvas" message="Os registros preservam os custos e preços da época. Não são vendas realizadas." className="text-gray-600" />
        </View>}
        ListEmptyComponent={loading ? <ActivityIndicator color="#4f46e5" className="mt-6" /> : error ?
          <View className="items-center py-8"><Text className="text-red-600">{error}</Text><Pressable onPress={() => void load()} className="p-3"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable></View> :
          <EmptyState title="Nenhuma precificação salva" subtitle="Salve uma precificação para começar." />}
        renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pricing-history-details', params: { id: String(item.id) } })} className="bg-white rounded-xl border border-gray-200 p-4 mb-3">
          <View className="flex-row items-start gap-2 mb-3">
            <View className="flex-1">
              <Text className="font-bold text-gray-800 text-base">{item.productName}</Text>
              <Text className="text-gray-500 text-xs mt-1">{new Date(item.createdAt).toLocaleString('pt-BR')} · {item.mode === 'manual' ? 'Manual' : 'Sugerida'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6b7280" />
          </View>
          <View className="flex-row gap-4">
            <View className="flex-1">
              <Text className="text-gray-500 text-xs">{item.mode === 'suggested' ? 'Preço base' : 'Preço informado'}</Text>
              <Text className="text-lg font-bold text-indigo-700 mt-1">{formatCurrency(item.salePriceCents)}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 text-xs">{item.profitCents < 0 ? 'Prejuízo estimado' : item.profitCents === 0 ? 'Equilíbrio' : 'Lucro estimado'}{item.mode === 'suggested' ? ' (base)' : ''}</Text>
              <Text className={'text-lg font-semibold mt-1 ' + (item.profitCents < 0 ? 'text-red-700' : item.profitCents > 0 ? 'text-green-700' : 'text-gray-800')}>{formatCurrency(item.profitCents)}</Text>
            </View>
          </View>
        </Pressable>}
      />
    </SafeAreaView>
  );
}
