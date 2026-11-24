import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
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
  return <SafeAreaView edges={['bottom','left','right']} className="flex-1 bg-gray-50">
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
          <Text className="text-gray-600">{r.issues.length ? 'Precificação incompleta' : 'Preço de venda sugerido'}</Text>
          <Text className="text-3xl font-bold text-indigo-700 my-2">{r.base === null ? '—' : formatCurrency(r.base)}</Text>
          <Text className="text-gray-500 text-sm">{r.issues.length ? 'Resolva as pendências abaixo para calcular o preço.' : 'Sem taxas de pagamento'}</Text>
        </View>}
        {!!issues.length && <View className="bg-amber-50 rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={22} color="#92400e" />
            <Text className="font-semibold text-amber-900 flex-1">Complete suas informações</Text>
          </View>
          <Text className="text-amber-900 mt-2">Ainda não é possível apresentar um preço e lucro confiáveis. Confira as pendências:</Text>
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
        <CostRow label={r.costIssues.length ? 'Subtotal dos custos conhecidos' : 'Custo total'} value={r.costIssues.length ? r.knownTotal : r.total} />
        {r.costIssues.length > 0 && <Text className="text-gray-500 text-sm mb-2">Subtotal parcial: não representa o custo real da peça.</Text>}
        {!manual && r.profit !== null && <CostRow label="Lucro estimado (sem taxa)" value={r.profit} />}
        {manual ? <View className="mt-4"><ManualPricingPanel form={form} onConfigurePayments={() => router.push('/sales-fees')} /></View> : <View className="bg-white border border-gray-200 rounded-xl p-4 my-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-semibold text-gray-800">Margem de lucro desejada</Text>
            <Text className="text-xl font-bold text-indigo-700">{form.margin === null ? 'Não definida' : (form.margin / 100).toLocaleString('pt-BR') + '%'}</Text>
          </View>
          <Slider style={{ width: '100%', height: 44 }} minimumValue={0} maximumValue={99.99} step={0.01}
            value={(form.margin ?? 0) / 100} onValueChange={value => form.setOverride(String(Math.round(value * 100) / 100))}
            minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#d1d5db" thumbTintColor="#4f46e5" accessibilityLabel="Margem de lucro" />
          <View className="flex-row justify-between"><Text className="text-gray-500 text-xs">0%</Text><Text className="text-gray-500 text-xs">99,99%</Text></View>
          {form.margin === null && <Pressable onPress={() => form.setOverride('20')}><Text className="text-indigo-700 mt-2">Usar 20% para simular</Text></Pressable>}
          <Text className="text-gray-500 text-sm mt-2">Meta de lucro para esta simulação, não o lucro efetivamente obtido.</Text>
          {form.override !== null && <Pressable onPress={() => form.setOverride(null)}><Text className="text-indigo-700 mt-2">Usar margem padrão</Text></Pressable>}
        </View>}
        <View className="bg-white border border-gray-200 rounded-xl mb-4">
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)}>
            <View className="flex-row justify-between items-center p-4"><Text className="font-semibold text-gray-800">Entenda seu preço</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" /></View>
          </Pressable>
          {expanded && <View className="px-4 pb-3"><CostRow label="Materiais" value={r.materials}/><CostRow label="Despesas adicionais" value={r.additional}/><CostRow label="Mão de obra" value={r.labor}/><Text className="text-gray-500 text-sm mb-2">Tempo de confecção: {Math.floor(form.product.productionMinutes / 60)}h {form.product.productionMinutes % 60}min</Text><CostRow label="Despesas fixas (rateio)" value={r.fixed}/></View>}
        </View>
        {!manual && <>
        <Text className="text-lg font-bold text-gray-800 mb-2">Preço por forma de pagamento</Text>
        {!r.payments.length && <View className="bg-white border border-gray-200 rounded-xl p-4 mb-2">
          <Text className="text-gray-600">Nenhuma das formas de pagamento foi marcada como utilizada.</Text>
          <Pressable accessibilityRole="button" className="py-2" onPress={() => router.push('/sales-fees')}><Text className="text-indigo-700 font-semibold">Configurar formas de pagamento</Text></Pressable>
        </View>}
        {r.payments.map(p => <View key={p.name} className="bg-white border border-gray-200 rounded-xl p-3 mb-2">
          <View className="flex-row justify-between items-center"><Text className="font-semibold text-gray-800">{p.name}</Text><Text className="font-bold text-indigo-700">{p.price === null ? '—' : formatCurrency(p.price)}</Text></View>
          <Text className="text-gray-500 text-sm">{p.status === 'missingFee' ? 'Forma de pagamento não configurada. Informe se você a utiliza e se paga taxa.' : p.status === 'incomplete' ? 'Complete os custos e a margem desejada.' : p.status === 'incompatible' ? 'A soma da taxa e da margem deve ser menor que 100%.' : p.status === 'outOfRange' ? 'Preço acima do limite suportado.' : p.fee === 0 ? 'Sem cobrança de taxa' : 'Taxa: ' + (p.fee! / 100).toLocaleString('pt-BR') + '%'}</Text>
          {p.status === 'missingFee' && <Pressable accessibilityRole="button" className="py-2" onPress={() => router.push('/sales-fees')}><Text className="text-indigo-700 font-semibold">Configurar pagamento</Text></Pressable>}
        </View>)}
        </>}
        <Text className="text-gray-500 text-sm mt-3">Os resultados consideram somente os custos cadastrados. Revise os materiais, serviços e despesas da peça antes de vender. O histórico será disponibilizado em uma próxima etapa.</Text>
      </FormScrollView>}
  </SafeAreaView>;
}
