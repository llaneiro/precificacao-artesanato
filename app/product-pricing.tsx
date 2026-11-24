import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FormScrollView } from '../src/components/FormScrollView';
import { useProductPricing } from '../src/hooks/useProductPricing';
import { formatCurrency } from '../src/utils/currency';

const money = (value: number | null) => value === null ? 'Não configurado' : formatCurrency(value);
function CostRow({ label, value }: { label: string; value: number | null }) {
  return <View className="flex-row justify-between items-center py-2 gap-2"><Text className="text-gray-600 flex-1">{label}</Text><Text className="font-semibold text-gray-800">{money(value)}</Text></View>;
}
export default function ProductPricingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const form = useProductPricing(id);
  const [expanded, setExpanded] = useState(false);
  const r = form.result;
  return <SafeAreaView edges={['bottom','left','right']} className="flex-1 bg-gray-50">
    {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.error || !form.product || !r ? <Text className="p-4 text-gray-600">{form.error || 'Não foi possível calcular este produto.'}</Text> :
      <FormScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xl font-bold text-gray-800 mb-4">{form.product.name}</Text>
        <View className="bg-indigo-50 rounded-xl p-5 items-center mb-4">
          <Text className="text-gray-600">{r.missing.length ? 'Simulação de preço' : 'Preço de venda sugerido'}</Text>
          <Text className="text-3xl font-bold text-indigo-700 my-2">{r.base === null ? '—' : formatCurrency(r.base)}</Text>
          <Text className="text-gray-500 text-sm">Sem taxas de pagamento</Text>
        </View>
        {!!r.missing.length && <View className="bg-amber-50 rounded-xl p-4 mb-4">
          <Text className="font-semibold text-amber-900">Complete suas configurações</Text>
          <Text className="text-amber-900 mt-1">O cálculo ainda está incompleto: {r.missing.join('; ')}.</Text>
          <Pressable onPress={() => router.push('/expenses')} className="mt-2"><Text className="font-semibold text-indigo-700">Abrir Central financeira</Text></Pressable>
        </View>}
        <CostRow label={r.missing.length ? 'Custos considerados' : 'Custo total'} value={r.total} />
        <CostRow label={r.missing.length ? 'Lucro parcial estimado' : 'Lucro estimado'} value={r.profit} />
        <View className="bg-white border border-gray-200 rounded-xl p-4 my-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-semibold text-gray-800">Margem de lucro</Text>
            <Text className="text-xl font-bold text-indigo-700">{form.margin === null ? 'Não definida' : (form.margin / 100).toLocaleString('pt-BR') + '%'}</Text>
          </View>
          <Slider style={{ width: '100%', height: 44 }} minimumValue={0} maximumValue={99.99} step={0.01}
            value={(form.margin ?? 0) / 100} onValueChange={value => form.setOverride(String(Math.round(value * 100) / 100))}
            minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#d1d5db" thumbTintColor="#4f46e5" accessibilityLabel="Margem de lucro" />
          <View className="flex-row justify-between"><Text className="text-gray-500 text-xs">0%</Text><Text className="text-gray-500 text-xs">99,99%</Text></View>
          {form.margin === null && <Pressable onPress={() => form.setOverride('20')}><Text className="text-indigo-700 mt-2">Usar 20% para simular</Text></Pressable>}
          <Text className="text-gray-500 text-sm mt-2">Este ajuste vale apenas para esta simulação.</Text>
          {form.override !== null && <Pressable onPress={() => form.setOverride(null)}><Text className="text-indigo-700 mt-2">Usar margem padrão</Text></Pressable>}
        </View>
        <View className="bg-white border border-gray-200 rounded-xl mb-4">
          <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)}>
            <View className="flex-row justify-between items-center p-4"><Text className="font-semibold text-gray-800">Entenda seu preço</Text><Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" /></View>
          </Pressable>
          {expanded && <View className="px-4 pb-3"><CostRow label="Materiais" value={r.materials}/><CostRow label="Despesas adicionais" value={r.additional}/><CostRow label="Mão de obra" value={r.labor}/><Text className="text-gray-500 text-sm mb-2">Tempo de confecção: {Math.floor(form.product.productionMinutes / 60)}h {form.product.productionMinutes % 60}min</Text><CostRow label="Despesas fixas (rateio)" value={r.fixed}/></View>}
        </View>
        <Text className="text-lg font-bold text-gray-800 mb-2">Preço por forma de pagamento</Text>
        {r.payments.map(p => <View key={p.name} className="bg-white border border-gray-200 rounded-xl p-3 mb-2">
          <View className="flex-row justify-between items-center"><Text className="font-semibold text-gray-800">{p.name}</Text><Text className="font-bold text-indigo-700">{p.price === null ? '—' : formatCurrency(p.price)}</Text></View>
          <Text className="text-gray-500 text-sm">{p.fee === null ? 'Taxa não configurada' : form.margin !== null && p.fee + form.margin >= 10000 ? 'A soma da taxa e da margem deve ser menor que 100%.' : 'Taxa: ' + (p.fee / 100).toLocaleString('pt-BR') + '%'}</Text>
        </View>)}
        <Text className="text-gray-500 text-sm mt-3">Simulação atualizada automaticamente. O histórico será disponibilizado em uma próxima etapa.</Text>
      </FormScrollView>}
  </SafeAreaView>;
}
