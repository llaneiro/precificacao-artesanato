import { View, Text } from 'react-native';
import { OptionsMenu } from './OptionsMenu';
import { Ionicons } from '@expo/vector-icons';
import { Material } from '../types/material';
import { formatCurrency } from '../utils/currency';

interface MaterialItemProps {
  material: Material;
  onEdit: (id: number) => void;
  onDelete: (material: Material) => void;
  disabled?: boolean;
}

export function MaterialItem({ material, onEdit, onDelete, disabled }: MaterialItemProps) {
  const reference = material.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 10 }) + ' ' + material.unit;
  return (
    <View className="bg-white border border-gray-200 rounded-2xl mb-3 overflow-hidden">
      <View className="flex-row items-center gap-1 p-4">
        <View className="w-12 h-12 mr-2 rounded-xl bg-indigo-50 items-center justify-center">
          <Ionicons name="layers-outline" size={25} color="#6366f1" />
        </View>
        <Text className="flex-1 text-lg font-bold text-gray-900" numberOfLines={2}>{material.name}</Text>
        <OptionsMenu label={'Opções de ' + material.name} disabled={disabled} actions={[
          { label: 'Editar', icon: 'create-outline', onPress: () => onEdit(material.id) },
          { label: 'Excluir', icon: 'trash-outline', destructive: true, onPress: () => onDelete(material) },
        ]} />
      </View>
      <View className="mx-4 mb-4 bg-gray-50 rounded-xl p-3">
        <Text className="text-gray-500 text-xs mb-1">Preço de referência</Text>
        <View className="flex-row flex-wrap items-baseline gap-2">
          <Text className="text-xl font-bold text-indigo-700">{formatCurrency(material.costCents)}</Text>
          <Text className="text-gray-600 text-sm">/ {reference}</Text>
        </View>
      </View>
    </View>
  );
}
