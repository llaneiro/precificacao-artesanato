import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsMenu } from '../src/components/OptionsMenu';
import { MaterialPriceChart } from '../src/components/MaterialPriceChart';
import { MaterialHistoryRow } from '../src/components/MaterialHistoryRow';
import type { MaterialCostHistoryRecord } from '../src/types/materialCostHistory';
import { useMaterialCostHistory } from '../src/hooks/useMaterialCostHistory';
import { useMaterials } from '../src/hooks/useMaterials';
import { MEASURE_CATEGORIES, measureCategory } from '../src/types/material';
import { formatCurrency } from '../src/utils/currency';
import { formatReferenceQuantity } from '../src/utils/materialCostHistory';
import { equivalentPrice, formatEquivalentPrice, materialPriceTrend } from '../src/utils/materialPriceTrend';

export default function MaterialDetailsScreen() {
  const router = useRouter();
  const { id, section } = useLocalSearchParams<{ id: string; section?: string }>();
  const { material, records, loading, error, load } = useMaterialCostHistory(Number(id));
  const { removeMaterial } = useMaterials(false);
  const [deleting, setDeleting] = useState(false);
  const busy = useRef(false);
  const [showAll, setShowAll] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const list = useRef<FlatList<MaterialCostHistoryRecord>>(null);
  const chartOffset = useRef<number | null>(null);
  const historyOffset = useRef(0);
  const initialJump = useRef(section === 'history');
  const orderedRecords = useMemo(() => [...records].sort((a, b) => {
    const aTime = Date.parse(a.recordedAt), bTime = Date.parse(b.recordedAt);
    if (Number.isFinite(aTime) && Number.isFinite(bTime)) return bTime - aTime || b.id - a.id;
    if (Number.isFinite(aTime)) return -1;
    if (Number.isFinite(bTime)) return 1;
    return b.id - a.id;
  }), [records]);
  const visibleRecords = showAll ? orderedRecords : orderedRecords.slice(0, 3);
  const historicalUnit = material?.unit ?? orderedRecords[0]?.unit ?? '';
  function jumpToChart() {
    if (!initialJump.current || chartOffset.current === null || !list.current) return;
    initialJump.current = false;
    list.current.scrollToOffset({ offset: Math.max(0, chartOffset.current - 16), animated: false });
  }
  const category = MEASURE_CATEGORIES.find(c => c.id === measureCategory(material?.unit ?? ''));
  const trend = useMemo(() => materialPriceTrend(records, historicalUnit), [records, historicalUnit]);
  const currentPrice = material && trend.unit ? equivalentPrice(material.costCents, material.quantity, material.unit, trend.unit) : null;
  const latest = trend.points[trend.points.length - 1];
  const unavailable = loading || deleting || !material || !!error;

  function confirmDelete() {
    if (!material || busy.current) return;
    Alert.alert('Excluir material', 'Deseja excluir "' + material.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (busy.current) return;
        busy.current = true; setDeleting(true);
        try {
          await removeMaterial(material.id);
          if (router.canGoBack()) router.back(); else router.replace('/materials');
        } catch (e) {
          const linked = String(e).includes('MATERIAL_IN_USE') || String(e).includes('FOREIGN KEY constraint failed');
          Alert.alert('Não foi possível excluir', linked ? 'Este material está vinculado a um produto. Remova a associação antes de excluí-lo.' : 'Não foi possível excluir o material.');
        } finally { busy.current = false; setDeleting(false); }
      }},
    ]);
  }

  return <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ title: 'Detalhes do material', headerRight: () => <View style={{ marginRight: 16 }}><OptionsMenu label="Opções do material" color="#fff" disabled={unavailable} actions={[
      { label: 'Editar material', icon: 'create-outline', onPress: () => { if (material) router.push({ pathname: '/material-form', params: { id: String(material.id) } }); } },
      { label: 'Excluir material', icon: 'trash-outline', destructive: true, onPress: confirmDelete },
    ]} /></View> }} />
    {loading && !material && !records.length ? <ActivityIndicator color="#4f46e5" className="mt-8" /> : error || (!material && !records.length) ? <View className="p-4">
      <Text className="text-gray-600">{error || 'Material não encontrado.'}</Text>
      {!!error && <Pressable accessibilityRole="button" onPress={() => void load()} className="min-h-12 justify-center"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable>}
    </View> : <FlatList
      ref={list}
      data={visibleRecords}
      extraData={expandedId}
      keyExtractor={item => String(item.id)}
      refreshing={loading}
      onRefresh={() => void load()}
      onContentSizeChange={jumpToChart}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      ListHeaderComponent={<View className="pt-4">
      {material ? <>
      <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <View className="flex-row items-center gap-3">
          <View className="w-14 h-14 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name={category?.icon ?? 'layers-outline'} size={28} color="#4f46e5" /></View>
          <View className="flex-1"><Text accessibilityRole="header" className="text-xl font-bold text-gray-900">{material.name}</Text><Text className="text-gray-500 text-xs mt-1">{category?.label ?? 'Unidade de medida'}</Text></View>
        </View>
        <View className="border-t border-gray-100 mt-4 pt-4">
          <Text className="text-gray-500 text-sm">Preço de referência atual</Text>
          <View className="flex-row flex-wrap items-baseline gap-2 mt-1">
            <Text className="text-2xl font-bold text-indigo-700">{formatCurrency(material.costCents)}</Text>
            <Text className="text-gray-600">/ {formatReferenceQuantity(material.quantity, material.unit)}</Text>
          </View>
          {trend.unit && <View className="bg-gray-50 rounded-xl p-3 mt-3 flex-row items-center gap-3">
            <Text className="text-gray-600 text-sm flex-1">Custo equivalente por {trend.unit}</Text>
            <Text className="font-semibold text-gray-800 text-right flex-shrink">{formatEquivalentPrice(currentPrice)}</Text>
          </View>}
          {!!latest && <Text className="text-gray-500 text-xs mt-3">Último registro: {new Date(latest.date).toLocaleDateString('pt-BR')}</Text>}
        </View>
        <Pressable accessibilityRole="button" disabled={unavailable} onPress={() => router.push({ pathname: '/material-price-form', params: { id: String(material.id) } })} className="min-h-12 bg-indigo-600 rounded-xl flex-row items-center justify-center gap-2 mt-4 px-4 py-3 active:bg-indigo-700">
          <Ionicons name="refresh-outline" size={21} color="#fff" /><Text className="text-white font-bold">Atualizar preço</Text>
        </Pressable>
      </View>
      </> : <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
        <Text className="text-xl font-bold text-gray-900">{orderedRecords[0]?.materialName ?? 'Material'}</Text>
        <Text className="text-gray-500 text-sm mt-2">Material excluído. Os registros anteriores foram preservados.</Text>
      </View>}
      <View onLayout={event => { chartOffset.current = event.nativeEvent.layout.y; requestAnimationFrame(jumpToChart); }}>
        <MaterialPriceChart key={id} trend={trend} />
      </View>
      <View className="flex-row items-center justify-between gap-2 mt-5 mb-3" onLayout={event => { historyOffset.current = event.nativeEvent.layout.y; }}>
        <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 flex-1">Histórico de alterações</Text>
        <Text className="text-gray-500 text-xs">{records.length} {records.length === 1 ? 'registro' : 'registros'}</Text>
      </View>
      {!!visibleRecords.length && <View className="h-3 rounded-t-xl bg-white border-t border-x border-gray-200" />}
      </View>}
      renderItem={({ item }) => <MaterialHistoryRow item={item} expanded={expandedId === item.id} onToggle={() => setExpandedId(current => current === item.id ? null : item.id)} />}
      ListEmptyComponent={<View className="bg-white border border-gray-200 rounded-xl p-4"><Text className="text-gray-500 text-sm">Nenhum registro encontrado. As alterações de custo serão registradas aqui.</Text></View>}
      ListFooterComponent={visibleRecords.length ? <View className="bg-white border-x border-b border-gray-200 rounded-b-xl overflow-hidden">
        {records.length > 3 ? <Pressable accessibilityRole="button" accessibilityState={{ expanded: showAll }} onPress={() => {
          if (showAll) {
            list.current?.scrollToOffset({ offset: Math.max(0, historyOffset.current - 16), animated: false });
            setExpandedId(current => orderedRecords.slice(0, 3).some(item => item.id === current) ? current : null);
          }
          setShowAll(value => !value);
        }} className="min-h-12 flex-row items-center justify-center gap-2 px-3 py-3 active:bg-indigo-50">
          <Text className="text-indigo-700 font-semibold text-sm">{showAll ? 'Mostrar menos' : 'Ver todas as alterações'}</Text>
          <Ionicons name={showAll ? 'chevron-up' : 'chevron-down'} size={18} color="#4f46e5" />
        </Pressable> : <View className="h-2" />}
      </View> : undefined}
    />}
  </SafeAreaView>;
}
