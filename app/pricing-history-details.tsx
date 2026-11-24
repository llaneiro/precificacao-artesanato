import { HelpLabel } from '../src/components/HelpTip';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePricingHistory } from '../src/hooks/usePricingHistory';
import type { PricingHistoryRecord } from '../src/types/pricingHistory';
import { formatCurrency } from '../src/utils/currency';

function Detail({ label, value }: { label: string; value: string }) {
  return <View className="flex-row items-center justify-between py-2 gap-3">
    <Text className="text-gray-600 flex-1">{label}</Text><Text className="font-semibold text-gray-800 text-right flex-shrink">{value}</Text>
  </View>;
}

function percent(value: number | null) {
  if (value === null) return '—';
  if (value !== 0 && Math.abs(value) < 0.01) return (value < 0 ? '−' : '') + 'menos de 0,01%';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

export default function PricingHistoryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getById, remove } = usePricingHistory(undefined, false);
  const [record, setRecord] = useState<PricingHistoryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const busy = useRef(false);
  const [retry, setRetry] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true); setError(''); setRecord(null);
    getById(Number(id)).then(value => {
      if (active) setRecord(value);
    }).catch(() => { if (active) setError('Não foi possível carregar a precificação salva.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getById, retry]));

  function confirmDelete() {
    if (!record || busy.current) return;
    Alert.alert('Excluir registro?', 'Apenas esta precificação será excluída. O produto e seus custos não serão alterados.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (busy.current) return;
        busy.current = true; setDeleting(true);
        try { await remove(record.id); if (router.canGoBack()) router.back(); else router.replace('/pricing-history'); }
        catch { Alert.alert('Erro', 'Não foi possível excluir o registro.'); }
        finally { busy.current = false; setDeleting(false); }
      } },
    ]);
  }

  const snapshot = record?.snapshot;
  return <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ title: 'Precificação salva', headerRight: () => <View style={{ marginRight: 16 }}><Pressable accessibilityRole="button" accessibilityLabel="Excluir registro" disabled={!record || deleting || loading} onPress={confirmDelete} className="w-11 h-11 items-center justify-center"><Ionicons name="trash-outline" size={23} color="#fff" /></Pressable></View> }} />
    {loading ? <ActivityIndicator color="#4f46e5" className="mt-8" /> : !record || !snapshot ?
      <View className="p-4"><Text className="text-gray-600">{error || 'Registro não encontrado.'}</Text>{!!error && <Pressable onPress={() => setRetry(v => v + 1)} className="py-3"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable>}</View> :
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-2xl font-bold text-gray-800">{record.productName}</Text>
        <Text className="text-gray-500 text-sm mt-1">{new Date(record.createdAt).toLocaleString('pt-BR')} · {record.mode === 'suggested' ? 'Preço sugerido' : 'Preço manual'}</Text>
        <View className="bg-indigo-50 rounded-xl p-4 my-4">
          <HelpLabel title="Valores da data do cálculo" message="O registro não muda quando você altera materiais ou configurações. É uma simulação, não uma venda." className="font-semibold text-indigo-800" />
        </View>
        {!(snapshot.mode === 'suggested' && snapshot.version === 2) && <>
        <Text className="text-lg font-bold text-gray-800 mb-2">Custos de produção</Text>
        <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <Detail label="Materiais" value={formatCurrency(snapshot.costs.materials)} />
          <Detail label="Despesas adicionais" value={formatCurrency(snapshot.costs.additional)} />
          <Detail label="Mão de obra" value={formatCurrency(snapshot.costs.labor)} />
          <Detail label="Despesas fixas (rateio)" value={formatCurrency(snapshot.costs.fixed)} />
          <View className="border-t border-gray-100 mt-2"><Detail label="Custo total" value={formatCurrency(snapshot.costs.total)} /></View>
          <Detail label="Tempo de produção" value={Math.floor(snapshot.productionMinutes / 60) + 'h ' + snapshot.productionMinutes % 60 + 'min'} />
        </View>
        </>}
        <Text className="text-lg font-bold text-gray-800 mb-2">{record.mode === 'suggested' ? 'Preços calculados' : 'Resultado da simulação'}</Text>
        {snapshot.targetMarginBps !== null && <Text className="text-gray-600 mb-3">Margem desejada: {percent(snapshot.targetMarginBps / 100)}</Text>}
        {snapshot.version === 1 && <View className="bg-amber-50 rounded-xl p-3 mb-3">
          <Text className="text-amber-900 text-sm">Fórmula anterior: margem sobre o bruto. Refaça o cálculo para usar a fórmula atual.</Text>
        </View>}
        {snapshot.mode === 'suggested' && snapshot.version === 2 ? <>
          <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-600">Preço base (valor líquido)</Text>
            <Text className="text-3xl font-bold text-indigo-700 mt-1 mb-3">{formatCurrency(snapshot.scenarios[0].salePriceCents)}</Text>
            <Detail label="Custo total" value={formatCurrency(snapshot.costs.total)} />
            <Detail label="Lucro estimado" value={formatCurrency(snapshot.scenarios[0].profitCents)} />
            <Detail label="Margem sobre o líquido" value={percent(snapshot.scenarios[0].marginPercent)} />
            <Detail label="Preço mínimo sem taxa" value={formatCurrency(snapshot.costs.total)} />
          </View>
          {snapshot.scenarios.length > 1 && <>
            <HelpLabel title="Preço por pagamento" message="As taxas foram acrescentadas ao preço para manter o mesmo lucro líquido." className="text-lg font-bold text-gray-800" />
            <View className="bg-white border border-gray-200 rounded-xl px-4 mb-3">
              {snapshot.scenarios.slice(1).map((scenario, i) => <View key={scenario.key} className={'py-3 ' + (i ? 'border-t border-gray-100' : '')}>
                <View className="flex-row justify-between items-center gap-3"><Text className="font-semibold text-gray-800 flex-1">{scenario.name}</Text><Text className="font-bold text-indigo-700">{formatCurrency(scenario.salePriceCents)}</Text></View>
                <Text className="text-gray-500 text-sm mt-1">{scenario.feeBps === 0 ? 'Sem cobrança de taxa' : 'Taxa: ' + percent(scenario.feeBps / 100)}</Text>
              </View>)}
            </View>

          </>}
        </> : <>
        {snapshot.scenarios.map(scenario => <View key={scenario.key} className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
          <Text className="font-semibold text-gray-700">{scenario.name}</Text>
          <Text className="text-2xl font-bold text-indigo-700 mt-1 mb-2">{formatCurrency(scenario.salePriceCents)}</Text>
          <Detail label={'Taxa (' + percent(scenario.feeBps / 100) + ')'} value={formatCurrency(scenario.feeCents)} />
          <Detail label="Valor líquido" value={formatCurrency(scenario.netCents)} />
          <View className="border-t border-gray-100 mt-2 pt-2">
            <Text className={'font-bold ' + (scenario.profitCents < 0 ? 'text-red-700' : scenario.profitCents > 0 ? 'text-green-700' : 'text-gray-800')}>{scenario.profitCents < 0 ? 'Prejuízo estimado' : scenario.profitCents === 0 ? 'Ponto de equilíbrio' : 'Lucro estimado'}: {formatCurrency(scenario.profitCents)}</Text>
            <Detail label={snapshot.version === 1 ? "Margem sobre o bruto" : "Margem sobre o líquido"} value={percent(scenario.marginPercent)} />
            <Detail label="Preço mínimo" value={scenario.minimumPriceCents === null ? '—' : formatCurrency(scenario.minimumPriceCents)} />
          </View>
        </View>)}
        </>}
        {snapshot.unavailablePayments.length > 0 && <View className="bg-amber-50 rounded-xl p-4 mb-4">
          <Text className="font-semibold text-amber-900">Formas não calculadas na época</Text>
          {snapshot.unavailablePayments.map(payment => <Text key={payment.key} className="text-amber-900 text-sm mt-2">{payment.name}: {payment.reason === 'missingFee' ? 'Taxa não configurada' : payment.reason === 'incompatible' ? 'Taxa e margem incompatíveis' : payment.reason === 'outOfRange' ? 'Preço inválido ou acima do limite' : 'Cálculo incompleto'}</Text>)}
        </View>}
        <View className="bg-white border border-gray-200 rounded-xl mb-4">
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)} className="flex-row justify-between items-center p-4 gap-2">
            <Text className="font-semibold text-gray-800 flex-1">Dados utilizados no cálculo</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" />
          </Pressable>
          {expanded && <View className="px-4 pb-4">
            <Text className="font-bold text-gray-700 mb-2">Custos de produção</Text>
            <Detail label="Materiais" value={formatCurrency(snapshot.costs.materials)} />
            <Detail label="Despesas adicionais" value={formatCurrency(snapshot.costs.additional)} />
            <Detail label="Mão de obra" value={formatCurrency(snapshot.costs.labor)} />
            <Detail label="Despesas fixas (rateio)" value={formatCurrency(snapshot.costs.fixed)} />
            <Detail label="Tempo de produção" value={Math.floor(snapshot.productionMinutes / 60) + 'h ' + snapshot.productionMinutes % 60 + 'min'} />
            <Text className="font-bold text-gray-700 mt-4 mb-2">Materiais</Text>
            {snapshot.materials.map(material => <View key={material.materialId} className="border-b border-gray-100 py-2">
              <Text className="font-semibold text-gray-800">{material.name}</Text>
              <Text className="text-gray-600 text-sm">Utilizado: {material.quantityUsed.toLocaleString('pt-BR')} {material.usageUnit ?? material.unit}</Text>
              <Text className="text-gray-600 text-sm">Referência: {formatCurrency(material.costCents)} por {material.referenceQuantity.toLocaleString('pt-BR')} {material.unit}</Text>
            </View>)}
            <Text className="font-bold text-gray-700 mt-4 mb-2">Despesas adicionais</Text>
            {snapshot.additionalExpenses.length ? snapshot.additionalExpenses.map(expense => <Detail key={expense.expenseId} label={expense.name + ' × ' + expense.quantity} value={formatCurrency(expense.costCents * expense.quantity)} />) : <Text className="text-gray-500 text-sm">Nenhuma vinculada à peça.</Text>}
            <Text className="font-bold text-gray-700 mt-4 mb-2">Configurações financeiras</Text>
            <Detail label="Horas produtivas mensais" value={String(snapshot.financial.productiveHours ?? '—')} />
            {snapshot.financial.laborMode === 'hourly' && snapshot.financial.hourlyCostCents !== null && <Detail label="Remuneração por hora" value={formatCurrency(snapshot.financial.hourlyCostCents)} />}
            {snapshot.financial.laborMode === 'monthly' && snapshot.financial.monthlyIncomeCents !== null && <Detail label="Remuneração mensal" value={formatCurrency(snapshot.financial.monthlyIncomeCents)} />}
            <Detail label="Total fixo mensal" value={formatCurrency(snapshot.financial.monthlyFixedCents)} />
            {snapshot.financial.noFixedExpenses && <Text className="text-gray-500 text-sm">Ausência de despesas fixas confirmada.</Text>}
            {snapshot.financial.fixedExpenses.map(expense => <Detail key={expense.id} label={expense.name} value={formatCurrency(expense.monthlyCostCents)} />)}
          </View>}
        </View>
      </ScrollView>}
  </SafeAreaView>;
}
