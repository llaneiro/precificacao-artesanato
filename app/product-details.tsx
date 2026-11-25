import { useSyncStatus } from '../src/contexts/SyncContext';
import { OptionsMenu } from '../src/components/OptionsMenu';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '../src/hooks/useProducts';
import { ProductDetails } from '../src/types/product';
import { getProductPhotoUri } from '../src/services/productPhoto';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const remoteVersion = useSyncStatus().remoteVersion;
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProductById, removeProduct } = useProducts(false);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [photoExpanded, setPhotoExpanded] = useState(false);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    getProductById(Number(id)).then(value => {
      if (active) setProduct(value);
    }).catch(() => { if (active) setError('Não foi possível carregar o produto.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getProductById, remoteVersion]));
  function confirmDelete() {
    if (!product || deleting) return;
    Alert.alert('Excluir produto', 'Deseja excluir "' + product.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try { await removeProduct(product.id); router.back(); }
        catch { Alert.alert('Erro', 'Não foi possível excluir o produto.'); setDeleting(false); }
      }},
    ]);
  }
  const uri = getProductPhotoUri(product?.photoFilename ?? null);
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <View style={{ marginRight: 16 }}><OptionsMenu label="Opções do produto" color="#fff"
        disabled={loading || deleting || !product || !!error} actions={[
          { label: 'Editar produto', icon: 'create-outline', onPress: () => { if (product) router.push({ pathname: '/product-form', params: { id: String(product.id) } }); } },
          { label: 'Excluir produto', icon: 'trash-outline', destructive: true, onPress: confirmDelete },
        ]} /></View> }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : error || !product ?
        <Text className="p-4 text-gray-600">{error || 'Produto não encontrado.'}</Text> :
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {uri && <Pressable accessibilityRole="button" accessibilityLabel="Ampliar foto do produto" onPress={() => setPhotoExpanded(true)} className="relative mb-4">
            <Image source={{ uri }} className="w-full h-56 rounded-xl bg-gray-100" resizeMode="cover" />
            <View className="absolute bottom-3 right-3 bg-black/60 rounded-full p-2"><Ionicons name="expand-outline" size={20} color="#fff" /></View>
          </Pressable>}
          <Text className="text-2xl font-bold text-gray-800">{product.name}</Text>
          {!!product.description && <Text className="text-gray-600 mt-2">{product.description}</Text>}
          <View className="flex-row items-center gap-3 mt-4">
            <Ionicons name="time-outline" size={24} color="#6b7280" />
            <View><Text className="text-gray-500 text-sm">Tempo de confecção</Text><Text className="text-gray-800 font-semibold">{Math.floor(product.productionMinutes / 60)}h {product.productionMinutes % 60}min</Text></View>
          </View>
          <TouchableOpacity className="bg-indigo-600 rounded-xl p-4 mt-4 mb-5" onPress={() => router.push({ pathname: '/product-pricing', params: { id: String(product.id) } })}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Ionicons name="calculator-outline" size={20} color="#fff" /><Text className="text-white font-bold">Calcular preço de venda</Text></View>
          </TouchableOpacity>
          <TouchableOpacity accessibilityRole="button" className="bg-white border border-gray-200 rounded-xl p-3 mb-5 flex-row items-center justify-center gap-2" onPress={() => router.push({ pathname: '/pricing-history', params: { productId: String(product.id), productName: product.name } })}>
            <Ionicons name="time-outline" size={20} color="#4f46e5" />
            <Text className="font-semibold text-indigo-700">Histórico de precificações</Text>
          </TouchableOpacity>
          <View className="border-t border-gray-200 pt-4">
            <View className="flex-row items-center justify-between mb-3"><Text className="text-lg font-bold text-gray-800">Materiais utilizados</Text><Text className="text-gray-500 text-sm">{product.materials.length} {product.materials.length === 1 ? 'material' : 'materiais'}</Text></View>
            <View className="bg-white border border-gray-200 rounded-xl px-3">
              {!product.materials.length && <Text className="text-gray-500 py-4">Nenhum material cadastrado.</Text>}
              {product.materials.map((m, i) => <View key={m.materialId} className={'flex-row items-center gap-3 py-3 ' + (i ? 'border-t border-gray-100' : '')}>
                <View className="bg-gray-100 rounded-lg p-2"><Ionicons name="layers-outline" size={22} color="#6b7280" /></View>
                <View className="flex-1"><Text className="font-semibold text-gray-800">{m.name}</Text></View>
                <Text className="font-semibold text-gray-800">{m.quantityUsed.toLocaleString('pt-BR')} {m.usageUnit ?? m.unit}</Text>
              </View>)}
            </View>
          </View>
          {!!product.additionalExpenses.length && <View className="mt-5">
            <Text className="text-lg font-bold text-gray-800 mb-3">Serviços e despesas adicionais</Text>
            <View className="bg-white border border-gray-200 rounded-xl px-3">
              {product.additionalExpenses.map((e, i) => <View key={e.expenseId} className={'flex-row items-center gap-3 py-3 ' + (i ? 'border-t border-gray-100' : '')}>
                <View className="bg-gray-100 rounded-lg p-2"><Ionicons name="receipt-outline" size={22} color="#6b7280" /></View>
                <View className="flex-1"><Text className="font-semibold text-gray-800">{e.name}</Text></View>
                <Text className="font-semibold text-gray-800">{e.quantity.toLocaleString('pt-BR')} un</Text>
              </View>)}
            </View>
          </View>}
        </ScrollView>}
      <Modal visible={photoExpanded && !!uri} animationType="fade" transparent={false} onRequestClose={() => setPhotoExpanded(false)}>
        <SafeAreaView className="flex-1 bg-black">
          <View className="flex-row justify-end p-3">
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar foto ampliada" onPress={() => setPhotoExpanded(false)} className="p-3">
              <Ionicons name="close" size={30} color="#fff" />
            </Pressable>
          </View>
          <Pressable className="flex-1" onPress={() => setPhotoExpanded(false)} accessibilityLabel="Fechar visualização da foto">
            {uri && <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" />}
          </Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
