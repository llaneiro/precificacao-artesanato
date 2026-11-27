import { formatNumber } from '../utils/numberDisplay';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HelpTip } from './HelpTip';
import { formatCurrency } from '../utils/currency';
import { pricingBreakdown } from '../utils/pricingBreakdown';

export const money = (value: number | null) => value === null ? '—' : formatCurrency(value);
export function percent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return '—';
  if (value !== 0 && Math.abs(value) < 0.01) return (value < 0 ? '−' : '') + 'menos de 0,01%';
  return formatNumber(value) + '%';
}
export const outcomeLabel = (profit: number) => profit < 0 ? 'Prejuízo estimado' : profit === 0 ? 'Ponto de equilíbrio' : 'Lucro estimado';
export const outcomeColor = (profit: number) => profit < 0 ? 'text-red-700' : profit === 0 ? 'text-gray-800' : 'text-green-700';

export function PricingRow({ label, value }: { label: string; value: string }) {
  return <View className="flex-row justify-between items-center gap-3 py-2">
    <Text className="text-gray-600 text-sm flex-1">{label}</Text>
    <Text className="font-semibold text-gray-800 text-sm text-right flex-shrink">{value}</Text>
  </View>;
}

export function PricingSection({ title, value, expanded, onToggle, children }: {
  title: string; value?: string; expanded: boolean; onToggle: () => void; children: ReactNode;
}) {
  return <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-4">
    <Pressable accessibilityRole="button" accessibilityLabel={title + (value ? ', ' + value : '')} accessibilityState={{ expanded }} onPress={onToggle} className="flex-row items-center gap-2 px-4 py-3 min-h-14 active:bg-gray-50">
      <Ionicons name="layers-outline" size={21} color="#4f46e5" />
      <Text className="font-semibold text-gray-800 flex-1">{title}</Text>
      {!!value && <Text className="font-bold text-gray-800 text-right flex-shrink">{value}</Text>}
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={19} color="#6b7280" />
    </Pressable>
    {expanded && <View className="px-4 pt-2 pb-3 border-t border-gray-100">{children}</View>}
  </View>;
}

export function CostProfitBar({ cost, labor, profit }: { cost: number; labor: number; profit: number }) {
  const breakdown = pricingBreakdown(cost, labor, profit);
  if (!breakdown) return null;
  return <View className="mt-4">
    {breakdown.loss && <Text className="text-gray-600 text-xs mb-2">Composição dos custos de produção (não do valor recebido)</Text>}
    <View accessible accessibilityLabel={breakdown.segments.map(segment => segment.label + ': ' + money(segment.amount)).join(', ')} className="h-4 flex-row rounded-full overflow-hidden">
      {breakdown.segments.filter(segment => segment.amount > 0).map(segment => <View key={segment.key} style={{ flex: segment.share, backgroundColor: segment.color }} />)}
    </View>
    <View className="gap-3 mt-3">
      {breakdown.segments.map(segment => <View key={segment.key} className="flex-row items-center gap-2">
        <View className="w-3 h-3 rounded-sm" style={{ backgroundColor: segment.color }} />
        <View className="flex-1">
          <Text className="text-gray-700 text-sm font-medium">{segment.label}</Text>
          <Text className="text-gray-500 text-xs">{percent(segment.share)} {breakdown.loss ? 'dos custos' : 'do valor líquido'}</Text>
        </View>
        <Text className={'font-semibold text-right flex-shrink ' + (segment.key === 'profit' ? 'text-green-700' : segment.key === 'labor' ? 'text-indigo-700' : 'text-gray-800')}>{money(segment.amount)}</Text>
      </View>)}
    </View>
    {breakdown.loss && <Text className="text-red-700 text-sm mt-3">Faltam {money(breakdown.shortfall)} para cobrir todos os custos, incluindo a mão de obra.</Text>}
  </View>;
}

export function SuggestedResult({ base, total, labor, profit }: { base: number | null; total: number | null; labor: number | null; profit: number | null }) {
  return <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4">
    <View className="flex-row items-center justify-between">
      <Text className="flex-1 font-semibold text-gray-800">Resultado da precificação</Text>
      <HelpTip title="Preço base" message="É o valor recebido após as taxas. O lucro é o que sobra depois de todos os custos, inclusive sua mão de obra." />
    </View>
    <View className="flex-row flex-wrap gap-x-4 gap-y-3">
      <View className="flex-1 min-w-[110px]">
        <Text className="text-xs text-gray-500">Preço base</Text>
        <Text className="text-xl font-bold text-indigo-700 mt-1">{money(base)}</Text>
      </View>
      <View className="flex-1 min-w-[110px]">
        <Text className="text-xs text-gray-500">{profit === null ? 'Lucro estimado' : outcomeLabel(profit)}</Text>
        <Text className={'text-xl font-bold mt-1 ' + (profit === null ? 'text-gray-400' : outcomeColor(profit))}>{money(profit)}</Text>
      </View>
    </View>
    {total !== null && labor !== null && profit !== null && <CostProfitBar cost={total} labor={labor} profit={profit} />}
  </View>;
}

export function PaymentPriceRow({ name, method, price, subtitle, action, first = false }: {
  name: string; method: string; price: number | null; subtitle: string; action?: () => void; first?: boolean;
}) {
  return <View className={'px-3 py-3 ' + (first ? '' : 'border-t border-gray-100')}>
    <View className="flex-row items-center gap-3">
      <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name={method === 'pix' ? 'qr-code-outline' : method === 'noFee' ? 'cash-outline' : 'card-outline'} size={21} color="#4f46e5" /></View>
      <View className="flex-1 gap-1"><Text className="font-semibold text-gray-800">{name}</Text><Text className="text-gray-500 text-xs">{subtitle}</Text></View>
      <Text className="font-bold text-indigo-700 text-right flex-shrink">{money(price)}</Text>
    </View>
    {action && <Pressable accessibilityRole="button" onPress={action} className="min-h-11 justify-center"><Text className="text-indigo-700 font-semibold text-sm">Configurar pagamento</Text></Pressable>}
  </View>;
}
