import { formatNumber } from '../utils/numberDisplay';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../utils/currency';
import { formatReferenceQuantity, formatUnitCost, materialCostVariation } from '../utils/materialCostHistory';
import { comparisonUnit, equivalentPrice, formatEquivalentPrice } from '../utils/materialPriceTrend';
import type { MaterialCostHistoryRecord } from '../types/materialCostHistory';

export function MaterialHistoryRow({ item, expanded, onToggle }: {
  item: MaterialCostHistoryRecord;
  expanded: boolean;
  onToggle: () => void;
}) {
  const variation = materialCostVariation(item);
  const changed = item.kind === 'changed';
  const confirmed = changed && item.costCents === item.previousCostCents && item.quantity === item.previousQuantity && item.unit === item.previousUnit;
  const neutral = variation === null || variation === 0;
  const color = neutral ? '#6b7280' : variation > 0 ? '#b91c1c' : '#15803d';
  const background = neutral ? '#f3f4f6' : variation > 0 ? '#fef2f2' : '#f0fdf4';
  const variationLabel = !changed ? 'Inicial' : variation === null ? 'Sem comparação' : variation === 0 ? '0%' :
    Math.abs(variation) < 0.01 ? (variation > 0 ? '+< 0,01%' : '−< 0,01%') : (variation > 0 ? '+' : '') + formatNumber(variation) + '%';
  const reference = formatCurrency(item.costCents) + ' / ' + formatReferenceQuantity(item.quantity, item.unit);
  const target = comparisonUnit(item.unit);
  const equivalent = target ? equivalentPrice(item.costCents, item.quantity, item.unit, target) : null;
  const title = changed ? confirmed ? 'Preço confirmado' : 'Atualização de referência' : item.kind === 'baseline' ? 'Referência inicial do histórico' : 'Cadastro do material';
  return <View className="bg-white border-x border-b border-gray-200 overflow-hidden">
    <Pressable accessibilityRole="button" accessibilityLabel={reference + ', ' + title + ', ' + new Date(item.recordedAt).toLocaleString('pt-BR') + ', ' + variationLabel}
      accessibilityState={{ expanded }} onPress={onToggle} className="flex-row items-center gap-2 px-3 py-3 min-h-14 active:bg-gray-50">
      <View style={{ backgroundColor: background }} className="w-10 h-10 rounded-lg items-center justify-center">
        <Ionicons name={neutral ? changed ? 'remove-outline' : 'time-outline' : variation > 0 ? 'trending-up-outline' : 'trending-down-outline'} size={21} color={color} />
      </View>
      <View className="flex-1">
        <Text className="font-semibold text-gray-800 text-sm">{reference}</Text>
        <Text className="text-gray-500 text-xs mt-1">{new Date(item.recordedAt).toLocaleDateString('pt-BR')}</Text>
      </View>
      <Text style={{ color, fontWeight: '600', fontSize: 12, flexShrink: 1, textAlign: 'right' }}>{variationLabel}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={17} color="#9ca3af" />
    </Pressable>
    {expanded && <View className="bg-gray-50 px-4 py-3 gap-3 border-t border-gray-100">
      <View>
        <Text className="font-semibold text-gray-800 text-sm">{title}</Text>
        <Text className="text-gray-500 text-xs mt-1">{new Date(item.recordedAt).toLocaleString('pt-BR')}</Text>
        {item.kind === 'baseline' && <Text className="text-gray-500 text-xs mt-1">Valor existente quando o histórico foi ativado, não necessariamente uma compra.</Text>}
      </View>
      <View className="flex-row items-center gap-3">
        <Text className="text-gray-600 text-sm flex-1">Custo equivalente{target ? ' por ' + target : ''}</Text>
        <Text className="text-gray-800 font-semibold text-sm text-right flex-shrink">{formatEquivalentPrice(equivalent)}</Text>
      </View>
      <Text className="text-gray-500 text-xs">{formatUnitCost(item.costCents, item.quantity, item.unit)}</Text>
      {changed && item.previousCostCents !== null && item.previousQuantity !== null && item.previousUnit !== null && <View className="border-t border-gray-200 pt-2">
        <Text className="text-gray-500 text-xs">Referência anterior</Text>
        <Text className="text-gray-800 font-semibold text-sm mt-1">{formatCurrency(item.previousCostCents)} / {formatReferenceQuantity(item.previousQuantity, item.previousUnit)}</Text>
        <Text className="text-gray-500 text-xs mt-1">{formatUnitCost(item.previousCostCents, item.previousQuantity, item.previousUnit)}</Text>
      </View>}
    </View>}
  </View>;
}
