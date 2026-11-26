import { useState } from 'react';
import { HelpLabel } from '../src/components/HelpTip';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePricingHistory } from '../src/hooks/usePricingHistory';
import { money, percent, outcomeLabel, outcomeColor } from '../src/components/PricingDisplay';

const FILTERS = [{ key: 'all', label: 'Todas' }, { key: 'suggested', label: 'Sugeridas' }, { key: 'manual', label: 'Manuais' }] as const;

export default function PricingHistoryScreen() {
  const router = useRouter();
  const { productId, productName } = useLocalSearchParams<{ productId?: string; productName?: string }>();
  const { records, loading, error, load } = usePricingHistory(productId === undefined ? undefined : Number(productId));
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all');
  const filtered = records.filter(item => filter === 'all' || item.mode === filter);
  const singleProduct = productId !== undefined && !!productName;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Histórico de precificações' }} />
      <View className="px-4 pt-4 pb-2">
        {singleProduct && <Text className="text-xl font-bold text-gray-900">{productName}</Text>}
        <HelpLabel title="Simulações salvas" message="Os registros preservam os custos e preços da época. Não são vendas realizadas." className="text-gray-600 text-sm" />
        <View className="flex-row gap-2 mb-3">
          {FILTERS.map(option => <Pressable key={option.key} accessibilityRole="button" accessibilityState={{ selected: filter === option.key }} onPress={() => setFilter(option.key)}
            className={'flex-1 min-h-11 items-center justify-center rounded-xl border px-1 ' + (filter === option.key ? 'bg-indigo-50 border-indigo-300' : 'bg-white border-gray-200')}>
            <Text className={'text-sm font-medium ' + (filter === option.key ? 'text-indigo-700' : 'text-gray-600')}>{option.label}</Text>
          </Pressable>)}
        </View>
        {!error && !(loading && !records.length) && <Text className="text-xs text-gray-500 mb-1">{filtered.length} {filtered.length === 1 ? 'precificação' : 'precificações'}</Text>}
      </View>
      <FlatList data={error ? [] : filtered} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void load()}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, flexGrow: 1 }}
        ListEmptyComponent={loading ? <ActivityIndicator color="#4f46e5" className="mt-6" /> : error ?
          <View className="items-center py-8"><Text className="text-red-600 text-center">{error}</Text><Pressable onPress={() => void load()} className="p-3"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable></View> :
          <View className="flex-1 items-center justify-center gap-3 px-5 py-8">
            <View className="w-16 h-16 rounded-2xl bg-indigo-50 items-center justify-center"><Ionicons name="time-outline" size={30} color="#818cf8" /></View>
            <Text className="text-lg font-bold text-gray-800 text-center">{records.length ? 'Nenhuma simulação neste filtro' : 'Nenhuma precificação salva'}</Text>
            <Text className="text-gray-500 text-sm text-center">{records.length ? 'Veja todas as precificações ou escolha outro filtro.' : 'Salve uma precificação para começar.'}</Text>
            {records.length > 0 && <Pressable onPress={() => setFilter('all')} className="min-h-12 px-4 justify-center"><Text className="text-indigo-700 font-semibold">Ver todas</Text></Pressable>}
          </View>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pricing-history-details', params: { id: String(item.id) } })} className="bg-white rounded-2xl border border-gray-200 p-3 mb-3 active:bg-gray-50">
          <View className="flex-row items-center gap-3 mb-3">
            <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name={item.mode === 'suggested' ? 'calculator-outline' : 'create-outline'} size={22} color="#4f46e5" /></View>
            <View className="flex-1">
              {!singleProduct && <Text className="font-bold text-gray-800">{item.productName}</Text>}
              <Text className={singleProduct ? 'font-semibold text-gray-800' : 'text-gray-600 text-sm'}>{item.mode === 'manual' ? 'Preço manual' : 'Preço sugerido'}</Text>
              <Text className="text-gray-500 text-xs mt-1">{new Date(item.createdAt).toLocaleDateString('pt-BR')} · {new Date(item.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color="#9ca3af" />
          </View>
          <View className="flex-row flex-wrap gap-x-3 gap-y-2 border-t border-gray-100 pt-3">
            <View className="flex-1 min-w-[105px]">
              <Text className="text-gray-500 text-xs">{item.mode === 'manual' ? 'Preço informado' : item.formulaVersion === 2 ? 'Preço base' : 'Preço registrado'}</Text>
              <Text className="text-lg font-bold text-indigo-700 mt-1">{money(item.salePriceCents)}</Text>
            </View>
            <View className="flex-1 min-w-[105px]">
              <Text className="text-gray-500 text-xs">{outcomeLabel(item.profitCents)}</Text>
              <Text className={'text-lg font-semibold mt-1 ' + outcomeColor(item.profitCents)}>{money(Math.abs(item.profitCents))}</Text>
            </View>
          </View>
          {(item.formulaVersion === 1 || item.formulaVersion === 2) && <Text className="text-gray-500 text-xs mt-3">Margem sobre o {item.formulaVersion === 1 ? 'bruto' : 'líquido'}: {percent(item.savedMarginPercent ?? null)}{item.formulaVersion === 1 ? ' · Fórmula anterior' : ''}</Text>}
        </Pressable>}
      />
    </SafeAreaView>
  );
}
