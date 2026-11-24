import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '../types/product';
import { getProductPhotoUri } from '../services/productPhoto';

interface ProductItemProps {
  product: ProductSummary;
  onPress: () => void;
  onPricing: () => void;
  onHistory: () => void;
}

function duration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? hours + 'h' : '', remainder ? remainder + 'min' : ''].filter(Boolean).join(' ') || '0min';
}

export function ProductItem({ product, onPress, onPricing, onHistory }: ProductItemProps) {
  const uri = getProductPhotoUri(product.photoFilename);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return (
    <View className="bg-white border border-gray-200 rounded-2xl mb-3 overflow-hidden">
      <Pressable accessibilityRole="button" accessibilityLabel={'Detalhes de ' + product.name} onPress={onPress}
        className="flex-row items-center gap-3 p-4 active:bg-gray-50">
        {uri && failedUri !== uri ? (
          <Image source={{ uri }} onError={() => setFailedUri(uri)} resizeMode="cover" className="w-24 h-24 rounded-xl bg-gray-100" />
        ) : (
          <View className="w-24 h-24 rounded-xl bg-indigo-50 items-center justify-center">
            <Ionicons name="cube-outline" size={32} color="#818cf8" />
          </View>
        )}
        <View className="flex-1 gap-2">
          <Text className="text-lg font-bold text-gray-900" numberOfLines={2}>{product.name}</Text>
          <View className="flex-row items-center gap-2">
            <Ionicons name="time-outline" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm">{duration(product.productionMinutes)}</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Ionicons name="layers-outline" size={16} color="#6b7280" />
            <Text className="text-gray-600 text-sm">{product.materialCount} {product.materialCount === 1 ? 'material' : 'materiais'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </Pressable>
      <View className="flex-row gap-2 px-4 pb-4">
        <Pressable accessibilityRole="button" accessibilityLabel={'Precificar ' + product.name} onPress={onPricing}
          className="flex-1 min-h-12 bg-indigo-600 rounded-xl flex-row items-center justify-center gap-2 px-2 py-3 active:bg-indigo-700">
          <Ionicons name="calculator-outline" size={19} color="#fff" />
          <Text className="text-white font-semibold text-sm flex-shrink">Precificar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Histórico de ' + product.name} onPress={onHistory}
          className="flex-1 min-h-12 bg-indigo-50 rounded-xl flex-row items-center justify-center gap-2 px-2 py-3 active:bg-indigo-100">
          <Ionicons name="time-outline" size={19} color="#4f46e5" />
          <Text className="text-indigo-700 font-semibold text-sm flex-shrink">Histórico</Text>
        </Pressable>
      </View>
    </View>
  );
}
