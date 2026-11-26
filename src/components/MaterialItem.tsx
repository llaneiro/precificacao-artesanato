import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Material, MEASURE_CATEGORIES, measureCategory } from '../types/material';
import { formatCurrency } from '../utils/currency';
import { formatReferenceQuantity } from '../utils/materialCostHistory';

interface MaterialItemProps {
  material: Material;
  onPress: () => void;
  onUpdatePrice: () => void;
  onHistory: () => void;
}

export function MaterialItem({ material, onPress, onUpdatePrice, onHistory }: MaterialItemProps) {
  const category = MEASURE_CATEGORIES.find(c => c.id === measureCategory(material.unit));
  return (
    <View className="bg-white border border-gray-200 rounded-xl mb-3 overflow-hidden">
      <Pressable accessibilityRole="button" accessibilityLabel={'Detalhes de ' + material.name} onPress={onPress} className="flex-row items-center gap-3 p-3 active:bg-gray-50">
        <View className="w-11 h-11 rounded-xl bg-indigo-50 items-center justify-center">
          <Ionicons name={category?.icon ?? 'layers-outline'} size={24} color="#6366f1" />
        </View>
        <View className="flex-1 gap-1">
          <Text className="font-semibold text-gray-900 text-base" numberOfLines={2}>{material.name}</Text>
          <View className="flex-row flex-wrap items-baseline gap-x-1.5">
            <Text className="font-bold text-indigo-700">{formatCurrency(material.costCents)}</Text>
            <Text className="text-gray-600 text-sm">/ {formatReferenceQuantity(material.quantity, material.unit)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </Pressable>
      <View className="flex-row gap-2 px-3 pb-3">
        <Pressable accessibilityRole="button" accessibilityLabel={'Atualizar preço de ' + material.name} onPress={onUpdatePrice} className="flex-1 min-h-11 px-2 py-2 rounded-lg bg-indigo-50 flex-row items-center justify-center gap-1.5 active:bg-indigo-100">
          <Ionicons name="refresh-outline" size={18} color="#4f46e5" />
          <Text className="text-indigo-700 text-sm font-semibold text-center flex-shrink">Atualizar preço</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Histórico de ' + material.name} onPress={onHistory} className="min-h-11 px-3 py-2 border border-gray-200 rounded-lg flex-row items-center justify-center gap-1 active:bg-gray-100">
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          <Text className="text-gray-600 text-sm">Histórico</Text>
        </Pressable>
      </View>
    </View>
  );
}
