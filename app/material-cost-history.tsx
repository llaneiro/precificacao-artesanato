import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMaterialCostHistory } from '../src/hooks/useMaterialCostHistory';
import { HelpLabel } from '../src/components/HelpTip';
import { EmptyState } from '../src/components/EmptyState';
import { formatCurrency } from '../src/utils/currency';
import { formatReferenceQuantity, formatUnitCost, materialCostVariation } from '../src/utils/materialCostHistory';
import type { MaterialCostHistoryRecord } from '../src/types/materialCostHistory';

function HistoryItem({ item }: { item: MaterialCostHistoryRecord }) {
  const variation = materialCostVariation(item);
  const changed = item.kind === 'changed';
  const confirmed = changed && item.costCents === item.previousCostCents && item.quantity === item.previousQuantity && item.unit === item.previousUnit;
  const color = variation === null || variation === 0 ? '#6b7280' : variation > 0 ? '#dc2626' : '#15803d';
  const variationLabel = variation === null ? 'Sem comparação' : variation === 0 ? 'Sem variação' :
    (variation > 0 ? '+' : '') + variation.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%';
  return <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
    <View className="flex-row items-center gap-2 mb-3">
      <View className="flex-1">
        <Text className="font-semibold text-gray-800">{changed ? (confirmed ? 'Preço confirmado' : 'Atualização de referência') : item.kind === 'baseline' ? 'Referência inicial do histórico' : 'Cadastro do material'}</Text>
        <Text className="text-gray-500 text-xs mt-1">{new Date(item.recordedAt).toLocaleString('pt-BR')}</Text>
      </View>
      {changed && <View className="flex-row items-center gap-1">
        <Ionicons name={variation === null || variation === 0 ? 'remove-outline' : variation > 0 ? 'trending-up-outline' : 'trending-down-outline'} size={18} color={color} />
        <Text style={{ color, fontWeight: '600', fontSize: 13 }}>{variationLabel}</Text>
      </View>}
    </View>
    {changed && !confirmed && item.previousCostCents !== null && item.previousQuantity !== null && item.previousUnit !== null &&
      <View className="mb-3">
        <Text className="text-gray-500 text-xs">Anterior</Text>
        <Text className="text-gray-600 mt-1">{formatCurrency(item.previousCostCents)} / {formatReferenceQuantity(item.previousQuantity, item.previousUnit)}</Text>
        <Text className="text-gray-500 text-xs">{formatUnitCost(item.previousCostCents, item.previousQuantity, item.previousUnit)}</Text>
      </View>}
    <View className="bg-gray-50 rounded-xl p-3">
      <Text className="text-gray-500 text-xs">{changed && !confirmed ? 'Novo valor' : 'Valor de referência'}</Text>
      <Text className="text-indigo-700 font-bold text-lg mt-1">{formatCurrency(item.costCents)} <Text className="text-gray-600 font-normal text-sm">/ {formatReferenceQuantity(item.quantity, item.unit)}</Text></Text>
      <Text className="text-gray-500 text-xs mt-1">{formatUnitCost(item.costCents, item.quantity, item.unit)}</Text>
    </View>
  </View>;
}

export default function MaterialCostHistoryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records, material, loading, error, load } = useMaterialCostHistory(Number(id));
  return <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ title: 'Histórico de custos' }} />
    <FlatList data={records} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void load()}
      contentContainerStyle={{ padding: 16, flexGrow: 1 }}
      ListHeaderComponent={<View className="mb-3">
        <Text className="text-xl font-bold text-gray-800">{material?.name ?? records[0]?.materialName ?? ''}</Text>
        {material && <View className="bg-indigo-50 rounded-2xl p-4 mt-3">
          <Text className="text-indigo-700 text-sm">Preço atual</Text>
          <Text className="text-indigo-700 text-2xl font-bold mt-1">{formatCurrency(material.costCents)}</Text>
          <Text className="text-indigo-700 text-sm">/ {formatReferenceQuantity(material.quantity, material.unit)}</Text>
        </View>}
        {material && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/material-price-form', params: { id: String(material.id) } })}
          className="mt-3 min-h-11 rounded-xl bg-indigo-600 flex-row items-center justify-center gap-2">
          <Ionicons name="refresh-outline" size={19} color="#fff" />
          <Text className="text-white font-semibold">Atualizar preço</Text>
        </Pressable>}
        <HelpLabel title="Alterações de custo" message="Cada atualização ou confirmação de preço fica registrada. A variação compara o custo por unidade equivalente, não o preço da embalagem. A referência inicial de materiais antigos corresponde ao valor existente quando o histórico foi ativado, não à data da compra." className="text-gray-700 font-semibold" rowClassName="mt-2" />
      </View>}
      ListEmptyComponent={loading ? <ActivityIndicator color="#4f46e5" className="mt-6" /> : error ?
        <View className="items-center py-8"><Text className="text-red-600">{error}</Text><Pressable onPress={() => void load()} className="p-3"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable></View> :
        <EmptyState title="Nenhum registro encontrado" subtitle="As alterações de custo serão registradas aqui." />}
      renderItem={({ item }) => <HistoryItem item={item} />} />
  </SafeAreaView>;
}
