import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProductSummary } from '../types/product';
import { getProductPhotoUri } from '../services/productPhoto';
import { formatProductionDuration } from '../utils/productCatalog';

interface ProductItemProps {
  product: ProductSummary;
  layout: 'list' | 'grid';
  onPress: () => void;
  onPricing: () => void;
  onHistory: () => void;
}

function ProductThumbnail({ filename, grid }: { filename: string | null; grid: boolean }) {
  const uri = getProductPhotoUri(filename);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  return (
    <View className={grid ? 'w-full aspect-[4/3] bg-indigo-50 items-center justify-center overflow-hidden' : 'w-[76px] h-[76px] rounded-xl bg-indigo-50 items-center justify-center overflow-hidden'}>
      {uri && failedUri !== uri ? (
        <Image source={{ uri }} onError={() => setFailedUri(uri)} resizeMode="cover" className="w-full h-full" />
      ) : <Ionicons name="cube-outline" size={grid ? 40 : 28} color="#a5a0cf" />}
    </View>
  );
}

function ProductMetadata({ product }: { product: ProductSummary }) {
  return (
    <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
      <View className="flex-row items-center gap-1">
        <Ionicons name="time-outline" size={13} color="#9ca3af" />
        <Text className="text-gray-600 text-xs">{formatProductionDuration(product.productionMinutes)}</Text>
      </View>
      <Text className="text-gray-400 text-xs">·</Text>
      <Text className="text-gray-600 text-xs">{product.materialCount} {product.materialCount === 1 ? 'material' : 'materiais'}</Text>
    </View>
  );
}

export function ProductItem({ product, layout, onPress, onPricing, onHistory }: ProductItemProps) {
  const grid = layout === 'grid';
  return (
    <View className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden">
      <Pressable accessibilityRole="button" accessibilityLabel={'Detalhes de ' + product.name} onPress={onPress}
        className={grid ? 'flex-1 active:bg-gray-50' : 'flex-row items-center gap-3 p-3 active:bg-gray-50'}>
        <ProductThumbnail filename={product.photoFilename} grid={grid} />
        <View className={grid ? 'flex-1 px-3 pt-3 pb-2 gap-1.5' : 'flex-1 gap-1.5'}>
          <Text className="text-gray-900 font-semibold text-base" numberOfLines={2}>{product.name}</Text>
          <ProductMetadata product={product} />
        </View>
        {!grid && <Ionicons name="chevron-forward" size={16} color="#9ca3af" />}
      </Pressable>
      <View className={grid ? 'flex-row gap-1.5 px-2 pb-2 pt-1' : 'flex-row gap-2 px-3 pb-3'}>
        <Pressable accessibilityRole="button" accessibilityLabel={'Precificar ' + product.name} onPress={onPricing}
          className="flex-1 min-h-11 bg-indigo-50 rounded-lg flex-row items-center justify-center gap-1 px-1.5 active:bg-indigo-100">
          {!grid && <Ionicons name="calculator-outline" size={18} color="#4f46e5" />}
          <Text className={'text-indigo-700 font-semibold text-center flex-shrink ' + (grid ? 'text-xs' : 'text-sm')}>Precificar</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={'Histórico de ' + product.name} onPress={onHistory}
          className={'min-h-11 border border-gray-200 rounded-lg flex-row items-center justify-center gap-1 active:bg-gray-100 ' + (grid ? 'w-11' : 'px-3')}>
          <Ionicons name="time-outline" size={18} color="#6b7280" />
          {!grid && <Text className="text-gray-600 text-sm">Histórico</Text>}
        </Pressable>
      </View>
    </View>
  );
}
