import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '../types/product';
import { getProductPhotoUri } from '../services/productPhoto';
import { formatCurrency } from '../utils/currency';

export function ProductItem({ product, onPress }: { product: ProductSummary; onPress: () => void }) {
  const uri = getProductPhotoUri(product.photoFilename);
  return (
    <TouchableOpacity accessibilityRole="button" onPress={onPress} className="bg-white border border-gray-200 rounded-xl p-3 mb-3 flex-row items-center gap-3">
      {uri ? <Image source={{ uri }} className="w-20 h-20 rounded-lg bg-gray-100" /> :
        <View className="w-20 h-20 rounded-lg bg-indigo-50 items-center justify-center"><Ionicons name="cube-outline" size={28} color="#6366f1" /></View>}
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-800" numberOfLines={2}>{product.name}</Text>
        <Text className="text-gray-500 text-sm mt-1">{Math.floor(product.productionMinutes / 60)}h {product.productionMinutes % 60}min · {product.materialCount} materiais</Text>
        <Text className="text-indigo-600 font-semibold mt-1">{formatCurrency(product.materialCostCents + product.additionalCostCents)}</Text>
        <Text className="text-gray-500 text-xs">Custos diretos</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}
