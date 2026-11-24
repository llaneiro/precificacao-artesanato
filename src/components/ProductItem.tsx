import { Image, Text, TouchableOpacity, View } from 'react-native';
import { ProductSummary } from '../types/product';
import { getProductPhotoUri } from '../services/productPhoto';

export function ProductItem({ product, onEdit, onDelete, disabled }: {
  product: ProductSummary;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
}) {
  const uri = getProductPhotoUri(product.photoFilename);
  const hours = Math.floor(product.productionMinutes / 60);
  const minutes = product.productionMinutes % 60;
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <View className="flex-row gap-3">
        {uri && <Image source={{ uri }} className="w-20 h-20 rounded-lg bg-gray-100" resizeMode="cover" />}
        <View className="flex-1">
          <Text className="text-lg font-bold text-gray-800">{product.name}</Text>
          {!!product.description && <Text className="text-gray-500 mt-1" numberOfLines={2}>{product.description}</Text>}
          <Text className="text-gray-600 mt-1">{hours}h {minutes}min · {product.materialCount} {product.materialCount === 1 ? 'material' : 'materiais'}</Text>
          <Text className="text-indigo-600 font-semibold mt-2">Materiais: {(product.materialCostCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
        </View>
      </View>
      <View className="flex-row justify-end mt-4 gap-4">
        <TouchableOpacity disabled={disabled} onPress={onEdit}><Text className="text-indigo-600 font-semibold">Editar</Text></TouchableOpacity>
        <TouchableOpacity disabled={disabled} onPress={onDelete}><Text className="text-red-600 font-semibold">Excluir</Text></TouchableOpacity>
      </View>
    </View>
  );
}
