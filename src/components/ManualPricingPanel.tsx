import { useState } from 'react';
import { HelpLabel } from './HelpTip';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProductPricing } from '../hooks/useProductPricing';
import { money, percent, outcomeLabel, outcomeColor, PricingRow, CostProfitBar } from './PricingDisplay';

type PricingForm = ReturnType<typeof useProductPricing>;

export function ManualPricingPanel({ form, onConfigurePayments }: {
  form: PricingForm; onConfigurePayments: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const options = [
    ...(form.result?.payments.map(p => ({ key: p.key, name: p.name, fee: p.fee })) ?? []),
    { key: 'noFee' as const, name: 'Venda sem taxa (dinheiro)', fee: 0 },
  ];
  const result = form.manual.result;
  return <>
    <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <Text className="font-semibold text-gray-800 text-base mb-2">Por quanto deseja vender?</Text>
      <View className="flex-row items-center rounded-xl border border-gray-300 px-3 bg-white">
        <Text className="text-gray-500 font-semibold mr-2">R$</Text>
        <TextInput accessibilityLabel="Preço de venda manual em reais" className="flex-1 text-xl font-bold text-gray-800 py-3" value={form.manualPrice}
          onChangeText={form.setManualPrice} placeholder="0,00" placeholderTextColor="#9ca3af" keyboardType="decimal-pad" editable={!form.saving} />
      </View>
      {!!form.manualPriceError && <Text accessibilityRole="alert" className="text-red-600 text-sm mt-2">{form.manualPriceError}</Text>}
      <View className="border-t border-gray-100 mt-4 pt-1">
        <HelpLabel title="Forma de pagamento" message="Escolha como o cliente vai pagar. Use Venda sem taxa apenas quando não houver cobrança, como no dinheiro." className="font-semibold text-gray-800" />
        {options.map(option => {
          const selected = form.selectedPayment === option.key;
          return <Pressable key={option.key} accessibilityRole="radio" accessibilityLabel={option.name} accessibilityState={{ checked: selected, disabled: form.saving }} disabled={form.saving}
            onPress={() => form.setManualPayment(option.key)} className={'flex-row items-center gap-2 min-h-12 rounded-lg px-2 py-2 ' + (selected ? 'bg-indigo-50' : 'bg-white')}>
            <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={21} color={selected ? '#4f46e5' : '#9ca3af'} />
            <Text className={'flex-1 text-sm ' + (selected ? 'font-semibold text-indigo-700' : 'font-medium text-gray-800')}>{option.name}</Text>
            <Text className="text-gray-500 text-xs text-right flex-shrink">{option.fee === null ? 'Não configurado' : option.fee === 0 ? 'Sem taxa' : percent(option.fee / 100)}</Text>
          </Pressable>;
        })}
      </View>
      {form.selectedPayment !== null && form.manualFee === null && <View className="bg-amber-50 rounded-xl p-3 mt-2">
        <Text className="text-amber-900 text-sm">Configure a taxa para calcular o lucro.</Text>
        <Pressable accessibilityRole="button" onPress={onConfigurePayments} className="min-h-11 justify-center"><Text className="text-indigo-700 font-semibold">Configurar pagamento</Text></Pressable>
      </View>}
    </View>
    <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      {result ? <>
        <View className="flex-row items-center gap-2">
          <Ionicons name={result.profitCents < 0 ? 'alert-circle-outline' : result.profitCents > 0 ? 'trending-up-outline' : 'remove-circle-outline'} size={22} color={result.profitCents < 0 ? '#b91c1c' : result.profitCents > 0 ? '#15803d' : '#4b5563'} />
          <Text className="font-semibold text-gray-800">{outcomeLabel(result.profitCents)}</Text>
        </View>
        <Text className={'text-3xl font-bold mt-2 ' + outcomeColor(result.profitCents)}>{money(Math.abs(result.profitCents))}</Text>
        <Text className="text-gray-600 text-sm mt-2">Margem efetiva sobre o líquido: {percent(result.marginPercent)}</Text>
        {result.profitCents < 0 && <Text className="text-red-700 text-sm mt-1">O preço não cobre os custos.</Text>}
        {result.marginPercent === null && <Text className="text-gray-500 text-sm mt-1">Margem indefinida: o valor líquido é zero.</Text>}
        {form.margin !== null && result.marginPercent !== null && <Text className="text-gray-500 text-xs mt-2">Margem desejada: {percent(form.margin / 100)} · {result.marginPercent < form.margin / 100 ? 'Abaixo da meta' : 'Meta atingida'}</Text>}
      </> : <>
        <Text className="font-semibold text-gray-800">Resultado da venda</Text>
        <Text className="text-gray-500 text-sm mt-2">{form.result?.total === null ? 'Complete os custos para obter um resultado confiável.' : form.selectedPayment === null ? 'Escolha uma forma de pagamento.' : form.manualFee === null ? 'Configure a taxa da forma de pagamento.' : 'Informe um preço de venda válido.'}</Text>
      </>}
      {result && form.result?.total != null && form.result.labor != null && <CostProfitBar cost={form.result.total} labor={form.result.labor} profit={result.profitCents} />}
      <View className="border-t border-gray-100 mt-3 pt-2">
        <PricingRow label="Preço mínimo para não ter prejuízo" value={money(form.manual.minimumPrice)} />
      </View>
      {result && <>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setExpanded(v => !v)} className="flex-row items-center justify-between min-h-11 border-t border-gray-100 mt-2">
          <Text className="text-indigo-700 font-semibold text-sm">Detalhes do cálculo</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" />
        </Pressable>
        {expanded && <>
          <PricingRow label="Preço informado" value={money(result.salePrice)} />
          <PricingRow label="Taxa descontada" value={money(result.feeCents)} />
          <PricingRow label="Valor líquido recebido" value={money(result.netCents)} />
          <PricingRow label="Custo de produção" value={money(form.result?.total ?? null)} />
        </>}
      </>}
    </View>
  </>;
}
