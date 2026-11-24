import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useProductPricing } from '../hooks/useProductPricing';
import { formatCurrency } from '../utils/currency';

type PricingForm = ReturnType<typeof useProductPricing>;

function Detail({ label, value }: { label: string; value: string }) {
  return <View className="flex-row items-center justify-between gap-3 py-2">
    <Text className="text-gray-600 flex-1">{label}</Text>
    <Text className="font-semibold text-gray-800">{value}</Text>
  </View>;
}

function formatMargin(value: number) {
  if (value !== 0 && Math.abs(value) < 0.01) return (value < 0 ? '−' : '') + 'menos de 0,01%';
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

export function ManualPricingPanel({ form, onConfigurePayments }: {
  form: PricingForm;
  onConfigurePayments: () => void;
}) {
  const options = [
    ...(form.result?.payments.map(p => ({ key: p.key, name: p.name, fee: p.fee })) ?? []),
    { key: 'noFee' as const, name: 'Venda sem taxa', fee: 0 },
  ];
  const result = form.manual.result;
  const outcome = result?.status;
  return <>
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <Text className="font-semibold text-gray-800 text-base mb-2">Por quanto deseja vender?</Text>
      <Text className="text-gray-500 text-sm mb-3">Informe um preço de mercado ou o valor que pretende cobrar pela peça.</Text>
      <View className="flex-row items-center rounded-xl border border-gray-300 px-3 bg-white">
        <Text className="text-gray-500 font-semibold mr-2">R$</Text>
        <TextInput
          accessibilityLabel="Preço de venda manual em reais"
          className="flex-1 text-xl font-bold text-gray-800 py-3"
          value={form.manualPrice}
          onChangeText={form.setManualPrice}
          placeholder="0,00"
          placeholderTextColor="#9ca3af"
          keyboardType="decimal-pad"
        />
      </View>
      {!!form.manualPriceError && <Text accessibilityRole="alert" className="text-red-600 text-sm mt-2">{form.manualPriceError}</Text>}
    </View>

    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <Text className="font-semibold text-gray-800 text-base mb-2">Forma de pagamento</Text>
      <Text className="text-gray-500 text-sm mb-3">Escolha como o cliente vai pagar para calcular o valor líquido.</Text>
      {options.map(option => {
        const selected = form.selectedPayment === option.key;
        return <Pressable key={option.key} accessibilityRole="radio" accessibilityLabel={option.name} accessibilityState={{ checked: selected }}
          onPress={() => form.setManualPayment(option.key)}
          className={'flex-row items-center gap-3 rounded-lg p-3 mb-1 ' + (selected ? 'bg-indigo-50' : 'bg-white')}>
          <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={21} color={selected ? '#4f46e5' : '#9ca3af'} />
          <View className="flex-1">
            <Text className={selected ? 'font-semibold text-indigo-700' : 'font-medium text-gray-800'}>{option.name}</Text>
            <Text className="text-gray-500 text-xs mt-1">{option.key === 'noFee' ? 'Ex.: dinheiro, sem cobrança sobre a venda.' : option.fee === null ? 'Não configurado' : option.fee === 0 ? 'Sem cobrança de taxa' : 'Taxa: ' + (option.fee / 100).toLocaleString('pt-BR') + '%'}</Text>
          </View>
        </Pressable>;
      })}
      {form.selectedPayment === null && <Text className="text-gray-500 text-sm mt-2">Selecione uma forma de pagamento.</Text>}
      {form.selectedPayment === 'noFee' && <Text className="text-gray-600 text-sm mt-2">Use esta opção apenas quando não houver nenhuma taxa sobre a venda.</Text>}
      {form.selectedPayment !== null && form.manualFee === null && <View className="bg-amber-50 rounded-lg p-3 mt-2">
        <Text className="text-amber-900 text-sm">Não é possível calcular o lucro sem conhecer a taxa desta forma de pagamento.</Text>
        <Pressable accessibilityRole="button" onPress={onConfigurePayments} className="py-2">
          <Text className="text-indigo-700 font-semibold">Configurar pagamento</Text>
        </Pressable>
      </View>}
    </View>

    {result ? <View className={'rounded-xl p-5 mb-4 border ' + (outcome === 'loss' ? 'bg-red-50 border-red-100' : outcome === 'profit' ? 'bg-green-50 border-green-100' : 'bg-gray-100 border-gray-200')}>
      <View className="flex-row items-center gap-2">
        <Ionicons name={outcome === 'loss' ? 'alert-circle-outline' : outcome === 'profit' ? 'trending-up-outline' : 'remove-circle-outline'} size={23}
          color={outcome === 'loss' ? '#b91c1c' : outcome === 'profit' ? '#15803d' : '#4b5563'} />
        <Text className={'font-semibold ' + (outcome === 'loss' ? 'text-red-700' : outcome === 'profit' ? 'text-green-700' : 'text-gray-700')}>
          {outcome === 'loss' ? 'Prejuízo estimado' : outcome === 'profit' ? 'Lucro estimado' : 'Ponto de equilíbrio'}
        </Text>
      </View>
      <Text className={'text-3xl font-bold mt-2 ' + (outcome === 'loss' ? 'text-red-700' : outcome === 'profit' ? 'text-green-700' : 'text-gray-800')}>{formatCurrency(Math.abs(result.profitCents))}</Text>
      <Text className="text-gray-700 mt-2">{outcome === 'loss' ? 'O valor líquido não cobre todos os custos cadastrados.' : outcome === 'profit' ? 'O valor líquido cobre os custos e deixa lucro para o negócio.' : 'O valor líquido cobre os custos, sem lucro nem prejuízo.'}</Text>
      <View className="border-t border-gray-200 mt-4 pt-3">
        <Text className="text-gray-600 text-sm">Margem real sobre o preço de venda</Text>
        <Text className={'font-bold text-2xl mt-1 ' + (outcome === 'loss' ? 'text-red-700' : outcome === 'profit' ? 'text-green-700' : 'text-gray-800')}>{formatMargin(result.marginPercent)}</Text>
        {form.margin !== null && <Text className="text-gray-600 text-sm mt-2">Margem desejada: {(form.margin / 100).toLocaleString('pt-BR')}%{result.marginPercent < form.margin / 100 ? ' · Abaixo da meta' : ' · Meta atingida'}</Text>}
      </View>
    </View> : <View className="bg-indigo-50 rounded-xl p-4 mb-4">
      <Text className="font-semibold text-gray-800">Resultado da venda</Text>
      <Text className="text-2xl font-bold text-indigo-700 my-2">—</Text>
      <Text className="text-gray-600 text-sm">{form.result?.total === null ? 'Complete os custos para obter um resultado confiável.' : form.selectedPayment === null ? 'Escolha uma forma de pagamento.' : form.manualFee === null ? 'Configure a taxa da forma de pagamento.' : 'Informe um preço de venda válido.'}</Text>
    </View>}

    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <Text className="font-semibold text-gray-800 mb-2">Entenda o resultado</Text>
      <Detail label="Preço de venda" value={result ? formatCurrency(result.salePrice) : '—'} />
      <Detail label="Taxa descontada" value={result ? formatCurrency(result.feeCents) : '—'} />
      <Detail label="Valor líquido recebido" value={result ? formatCurrency(result.netCents) : '—'} />
      <Detail label="Custo total" value={form.result?.total == null ? '—' : formatCurrency(form.result.total)} />
      <View className="border-t border-gray-100 mt-2 pt-2">
        <Text className="text-gray-600 text-sm">Preço mínimo para não ter prejuízo</Text>
        <Text className="text-xl text-indigo-700 font-bold mt-1">{form.manual.minimumPrice === null ? '—' : formatCurrency(form.manual.minimumPrice)}</Text>
        <Text className="text-gray-500 text-xs mt-1">Considera os custos cadastrados e a taxa selecionada, sem lucro adicional.</Text>
      </View>
    </View>
  </>;
}
