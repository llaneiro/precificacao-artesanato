import { HelpLabel } from '../src/components/HelpTip';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePricingHistory } from '../src/hooks/usePricingHistory';
import type { PricingHistoryRecord } from '../src/types/pricingHistory';
import { formatCurrency } from '../src/utils/currency';
import { formatProductionDuration } from '../src/utils/productCatalog';
import { money, percent, PricingRow as Detail, PricingSection, SuggestedResult, PaymentPriceRow, outcomeLabel, outcomeColor, CostProfitBar } from '../src/components/PricingDisplay';

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
  const [costExpanded, setCostExpanded] = useState(false);
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
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text className="text-2xl font-bold text-gray-800">{record.productName}</Text>
        <Text className="text-gray-500 text-sm mt-1">{new Date(record.createdAt).toLocaleString('pt-BR')} · {record.mode === 'suggested' ? 'Preço sugerido' : 'Preço manual'}</Text>
        <View className="flex-row items-center gap-1 mb-3">
          <HelpLabel title="Valores da data do cálculo" message="O registro não muda quando você altera materiais ou configurações. É uma simulação, não uma venda." className="text-gray-500 text-xs" />
        </View>
        <PricingSection title="Custo de produção" value={money(snapshot.costs.total)} expanded={costExpanded} onToggle={() => setCostExpanded(v => !v)}>
          <Detail label="Materiais" value={money(snapshot.costs.materials)} />
          <Detail label="Mão de obra" value={money(snapshot.costs.labor)} />
          <Detail label="Despesas fixas (rateio)" value={money(snapshot.costs.fixed)} />
          <Detail label="Despesas adicionais" value={money(snapshot.costs.additional)} />
          <Detail label="Tempo de produção" value={formatProductionDuration(snapshot.productionMinutes)} />
        </PricingSection>
        {snapshot.targetMarginBps !== null && <Text className="text-gray-600 text-sm mb-3">Margem desejada: {percent(snapshot.targetMarginBps / 100)}</Text>}
        {snapshot.version === 1 && <View className="bg-amber-50 rounded-xl p-3 mb-3">
          <Text className="text-amber-900 text-sm">Fórmula anterior: margem sobre o bruto. Refaça o cálculo para usar a fórmula atual.</Text>
        </View>}
        {snapshot.mode === 'suggested' && snapshot.version === 2 ? <>
          <SuggestedResult base={snapshot.scenarios[0].salePriceCents} total={snapshot.costs.total} labor={snapshot.costs.labor} profit={snapshot.scenarios[0].profitCents} />
          <Text className="text-gray-600 text-sm mb-3">Margem efetiva sobre o líquido: {percent(snapshot.scenarios[0].marginPercent)}</Text>
          {snapshot.scenarios.length > 1 && <>
            <HelpLabel title="Preços por pagamento" message="As taxas foram acrescentadas ao preço para manter o mesmo lucro líquido." className="text-lg font-bold text-gray-800" />
            <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
              {snapshot.scenarios.slice(1).map((scenario, i) => <PaymentPriceRow key={scenario.key} first={i === 0} name={scenario.name} method={scenario.key} price={scenario.salePriceCents}
                subtitle={scenario.feeBps === 0 ? 'Sem taxa' : 'Taxa de ' + percent(scenario.feeBps / 100)} />)}
            </View>
          </>}
        </> : <>
          <Text className="text-lg font-bold text-gray-800 mb-3">{snapshot.mode === 'manual' ? 'Resultado da simulação' : 'Preços registrados'}</Text>
          {snapshot.scenarios.map(scenario => <View key={scenario.key} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3">
            <Text className="font-semibold text-gray-800">{scenario.name}</Text>
            <Text className="text-gray-500 text-xs mt-2">{snapshot.mode === 'manual' ? 'Preço informado' : 'Preço registrado'}</Text>
            <Text className="text-2xl font-bold text-indigo-700 mt-1">{money(scenario.salePriceCents)}</Text>
            <View className="border-t border-gray-100 mt-3 pt-2">
              <Text className="text-gray-500 text-sm">{outcomeLabel(scenario.profitCents)}</Text>
              <Text className={'text-2xl font-bold mt-1 mb-2 ' + outcomeColor(scenario.profitCents)}>{money(Math.abs(scenario.profitCents))}</Text>
              <CostProfitBar cost={snapshot.costs.total} labor={snapshot.costs.labor} profit={scenario.profitCents} />
              <Detail label={snapshot.version === 1 ? 'Margem sobre o bruto' : 'Margem sobre o líquido'} value={percent(scenario.marginPercent)} />
              <Detail label={'Taxa (' + percent(scenario.feeBps / 100) + ')'} value={money(scenario.feeCents)} />
              <Detail label="Valor líquido recebido" value={money(scenario.netCents)} />
              <Detail label="Preço mínimo" value={money(scenario.minimumPriceCents)} />
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
