import { HelpLabel, HelpTip } from '../src/components/HelpTip';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { ManualPricingPanel } from '../src/components/ManualPricingPanel';
import { useProductPricing } from '../src/hooks/useProductPricing';
import { formatCurrency } from '../src/utils/currency';

const money = (value: number | null) => value === null ? '—' : formatCurrency(value);
function CostRow({ label, value }: { label: string; value: number | null }) {
  return <View className="flex-row justify-between items-center py-2 gap-2"><Text className="text-gray-600 flex-1">{label}</Text><Text className="font-semibold text-gray-800">{money(value)}</Text></View>;
}
export default function ProductPricingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const form = useProductPricing(id);
  const [expanded, setExpanded] = useState(false);
  const r = form.result;
  const manual = form.mode === 'manual';
  const issues = manual ? r?.costIssues ?? [] : r?.issues ?? [];
  async function save() {
    try {
      const recordId = await form.saveHistory();
      if (recordId !== null) router.push({ pathname: '/pricing-history-details', params: { id: String(recordId) } });
    } catch (e) { Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.'); }
  }
  return <SafeAreaView edges={['bottom','left','right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={!form.canSave} saving={form.saving} onPress={() => void save()} /> }} />
    {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.error || !form.product || !r ? <Text className="p-4 text-gray-600">{form.error || 'Não foi possível calcular este produto.'}</Text> :
      <FormScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xl font-bold text-gray-800 mb-4">{form.product.name}</Text>
        <View className="flex-row bg-gray-200 rounded-xl p-1 mb-4">
          {([{ mode: 'suggested', label: 'Preço sugerido' }, { mode: 'manual', label: 'Preço manual' }] as const).map(option => (
            <Pressable key={option.mode} accessibilityRole="tab" accessibilityState={{ selected: form.mode === option.mode }} onPress={() => form.setMode(option.mode)}
              className={'flex-1 rounded-lg py-3 px-2 items-center ' + (form.mode === option.mode ? 'bg-white' : '')}>
              <Text className={'text-sm font-semibold ' + (form.mode === option.mode ? 'text-indigo-700' : 'text-gray-600')}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        {!manual && <View className="bg-indigo-50 rounded-xl p-5 items-center mb-4">
          <View className="flex-row items-center"><Text className="text-gray-600">{r.issues.length ? 'Precificação incompleta' : 'Preço base (valor líquido)'}</Text><HelpTip title="Preço base" message="É o valor que você recebe após as taxas. Revise todos os custos da peça antes de vender." /></View>
          <Text className="text-3xl font-bold text-indigo-700 my-2">{r.base === null ? '—' : formatCurrency(r.base)}</Text>

          {r.profit !== null && r.total !== null && r.base !== null && <View className="w-full border-t border-indigo-100 mt-4 pt-2">
            <CostRow label="Custo total" value={r.total} />
            <CostRow label="Lucro estimado" value={r.profit} />
            <View className="flex-row justify-between py-2"><Text className="text-gray-600">Margem sobre o líquido</Text><Text className="font-semibold text-gray-800">{r.base > 0 ? ((r.profit / r.base) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%' : '—'}</Text></View>
            <CostRow label="Preço mínimo sem taxa" value={r.total} />
          </View>}
        </View>}
        {!!issues.length && <View className="bg-amber-50 rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={22} color="#92400e" />
            <Text className="font-semibold text-amber-900 flex-1">Complete suas informações</Text>
          </View>
          <Text className="text-amber-900 mt-2">Resolva as pendências para calcular o lucro.</Text>
          {issues.map(issue => <View key={issue.code} className="mt-3">
            <Text className="text-amber-900">{issue.message}</Text>
            {issue.code !== 'range' && <Pressable accessibilityRole="button" className="py-2" onPress={() => {
              if (issue.code === 'labor') router.push('/labor-settings');
              else if (issue.code === 'fixed') router.push('/fixed-expenses');
              else if (issue.code === 'margin') router.push('/profit-margin');
              else router.push({ pathname: '/product-form', params: { id: String(form.product!.id) } });
            }}>
              <Text className="font-semibold text-indigo-700">{issue.code === 'labor' ? 'Configurar mão de obra' : issue.code === 'fixed' ? 'Revisar despesas fixas' : issue.code === 'margin' ? 'Definir margem padrão' : 'Revisar produto'}</Text>
            </Pressable>}
          </View>)}
        </View>}
        {(manual || r.base === null) && <CostRow label={r.costIssues.length ? 'Subtotal dos custos conhecidos' : 'Custo total'} value={r.costIssues.length ? r.knownTotal : r.total} />}
        {r.costIssues.length > 0 && <Text className="text-gray-500 text-sm mb-2">Ainda faltam custos.</Text>}
        {manual ? <View className="mt-4"><ManualPricingPanel form={form} onConfigurePayments={() => router.push('/sales-fees')} /></View> : <View className="bg-white border border-gray-200 rounded-xl p-4 my-4">
          <View className="flex-row justify-between items-center mb-2">
            <HelpLabel title="Margem desejada" message="Percentual do valor líquido que sobra como lucro. Este ajuste vale apenas para a simulação." className="font-semibold text-gray-800" />
            <Text className="text-xl font-bold text-indigo-700">{form.margin === null ? 'Não definida' : (form.margin / 100).toLocaleString('pt-BR') + '%'}</Text>
          </View>
          <Slider style={{ width: '100%', height: 44 }} minimumValue={0} maximumValue={99.99} step={0.01}
            value={(form.margin ?? 0) / 100} onValueChange={value => form.setOverride(String(Math.round(value * 100) / 100))}
            minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#d1d5db" thumbTintColor="#4f46e5" accessibilityLabel="Margem de lucro" />
          <View className="flex-row justify-between"><Text className="text-gray-500 text-xs">0%</Text><Text className="text-gray-500 text-xs">99,99%</Text></View>
          {form.margin === null && <Pressable onPress={() => form.setOverride('20')}><Text className="text-indigo-700 mt-2">Usar 20% para simular</Text></Pressable>}

          {form.override !== null && <Pressable onPress={() => form.setOverride(null)}><Text className="text-indigo-700 mt-2">Usar margem padrão</Text></Pressable>}
        </View>}
        <View className="bg-white border border-gray-200 rounded-xl mb-4">
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)}>
            <View className="flex-row justify-between items-center p-4"><Text className="font-semibold text-gray-800">Entenda seu preço</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" /></View>
          </Pressable>
          {expanded && <View className="px-4 pb-3"><CostRow label="Materiais" value={r.materials}/><CostRow label="Despesas adicionais" value={r.additional}/><CostRow label="Mão de obra" value={r.labor}/><Text className="text-gray-500 text-sm mb-2">Tempo de confecção: {Math.floor(form.product.productionMinutes / 60)}h {form.product.productionMinutes % 60}min</Text><CostRow label="Despesas fixas (rateio)" value={r.fixed}/></View>}
        </View>
        {!manual && <>
        <HelpLabel title="Preço por pagamento" message="A taxa é acrescentada ao preço para manter o mesmo lucro em todos os meios." className="text-lg font-bold text-gray-800" />
        {!r.payments.length && <View className="bg-white border border-gray-200 rounded-xl p-4 mb-2">
          <Text className="text-gray-600">Nenhuma forma de pagamento ativa.</Text>
          <Pressable accessibilityRole="button" className="py-2" onPress={() => router.push('/sales-fees')}><Text className="text-indigo-700 font-semibold">Configurar formas de pagamento</Text></Pressable>
        </View>}
        {!!r.payments.length && <View className="bg-white border border-gray-200 rounded-xl px-4 mb-3">
          {r.payments.map((p, i) => <View key={p.key} className={'py-3 ' + (i ? 'border-t border-gray-100' : '')}>
            <View className="flex-row justify-between items-center gap-3"><Text className="font-semibold text-gray-800 flex-1">{p.name}</Text><Text className="font-bold text-indigo-700">{p.price === null ? '—' : formatCurrency(p.price)}</Text></View>
            <Text className="text-gray-500 text-sm mt-1">{p.status === 'missingFee' ? 'Forma de pagamento não configurada.' : p.status === 'incomplete' ? 'Complete os custos e a margem desejada.' : p.status === 'outOfRange' ? 'Preço acima do limite suportado.' : p.fee === 0 ? 'Sem cobrança de taxa' : 'Taxa: ' + (p.fee! / 100).toLocaleString('pt-BR') + '%'}</Text>
            {p.status === 'missingFee' && <Pressable accessibilityRole="button" className="py-2" onPress={() => router.push('/sales-fees')}><Text className="text-indigo-700 font-semibold">Configurar pagamento</Text></Pressable>}
          </View>)}
        </View>}

        </>}

        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !form.canSave || form.saving }} disabled={!form.canSave || form.saving} onPress={() => void save()} className={'rounded-xl p-4 items-center flex-row justify-center gap-2 ' + (!form.canSave || form.saving ? 'bg-gray-300' : 'bg-indigo-600')}>
          {form.saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={20} color="#fff" />}
          <Text className="text-white font-bold">{form.saving ? 'Salvando...' : 'Salvar precificação'}</Text>
        </Pressable>
        {!form.canSave && <Text className="text-gray-500 text-xs mt-2 text-center">Complete o cálculo para salvar.</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pricing-history', params: { productId: String(form.product!.id), productName: form.product!.name } })} className="items-center py-4">
          <Text className="text-indigo-700 font-semibold">Ver histórico deste produto</Text>
        </Pressable>
      </FormScrollView>}
  </SafeAreaView>;
}
