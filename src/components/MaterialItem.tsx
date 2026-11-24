import { View, Text, TouchableOpacity } from 'react-native';
import { Material } from '../types/material';

interface MaterialItemProps {
  material: Material;
  onEdit: (id: number) => void;
  onDelete: (material: Material) => void;
  disabled?: boolean;
}

export function MaterialItem({ material, onEdit, onDelete, disabled }: MaterialItemProps) {
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <Text className="text-lg font-bold text-gray-800">{material.name}</Text>
      <Text className="text-gray-600 mt-1">
        {material.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 10 })} {material.unit}
      </Text>
      <Text className="text-indigo-600 text-lg font-semibold mt-1">
        {(material.costCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </Text>
      <View className="flex-row justify-end mt-4 gap-4">
        <TouchableOpacity disabled={disabled} onPress={() => onEdit(material.id)}>
          <Text className="text-indigo-600 font-semibold">Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={disabled} onPress={() => onDelete(material)}>
          <Text className="text-red-600 font-semibold">Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
