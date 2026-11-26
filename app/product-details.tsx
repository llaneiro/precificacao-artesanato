import { useSyncStatus } from '../src/contexts/SyncContext';
import { OptionsMenu } from '../src/components/OptionsMenu';
import { useCallback, useState, useRef, type ReactNode } from 'react';
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useProducts } from '../src/hooks/useProducts';
import { ProductDetails } from '../src/types/product';
import { getProductPhotoUri } from '../src/services/productPhoto';
import { formatProductionDuration } from '../src/utils/productCatalog';

function CompositionSection({ title, summary, icon, expanded, onToggle, children }: {
  title: string;
  summary: string;
  icon: 'layers-outline' | 'receipt-outline';
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <View className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <Pressable accessibilityRole="button" accessibilityLabel={title + ', ' + summary}
        accessibilityState={{ expanded }} onPress={onToggle}
        className="min-h-14 px-4 py-3 flex-row items-center gap-3 active:bg-gray-50">
        <Ionicons name={icon} size={23} color="#4f46e5" />
        <View className="flex-1 gap-0.5">
          <Text className="font-semibold text-gray-800">{title}</Text>
          <Text className="text-gray-500 text-xs">{summary}</Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color="#6b7280" />
      </Pressable>
      {expanded && children}
    </View>
  );
}

function CompositionRow({ name, quantity }: { name: string; quantity: string }) {
  return (
    <View className="flex-row items-center gap-3 px-4 py-3 border-t border-gray-100">
      <Text className="flex-1 text-gray-700 text-sm">{name}</Text>
      <Text className="font-semibold text-gray-800 text-sm text-right max-w-[45%]">{quantity}</Text>
    </View>
  );
}

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
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const [materialsExpanded, setMaterialsExpanded] = useState(true);
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  const deleteBusy = useRef(false);
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    setError('');
    getProductById(Number(id)).then(value => {
      if (active) setProduct(value);
    }).catch(() => { if (active) setError('Não foi possível carregar o produto.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, getProductById, remoteVersion, reload]));
  function confirmDelete() {
    if (!product || deleting || deleteBusy.current) return;
    Alert.alert('Excluir produto', 'Deseja excluir "' + product.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (deleteBusy.current) return;
        deleteBusy.current = true;
        setDeleting(true);
        try { await removeProduct(product.id); router.back(); }
        catch { Alert.alert('Erro', 'Não foi possível excluir o produto.'); setDeleting(false); deleteBusy.current = false; }
      }},
    ]);
  }
  const uri = getProductPhotoUri(product?.photoFilename ?? null);
  const showPhoto = !!uri && failedUri !== uri;
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <View style={{ marginRight: 16 }}><OptionsMenu label="Opções do produto" color="#fff"
        disabled={loading || deleting || !product || !!error} actions={[
          { label: 'Editar produto', icon: 'create-outline', onPress: () => { if (product) router.push({ pathname: '/product-form', params: { id: String(product.id) } }); } },
          { label: 'Excluir produto', icon: 'trash-outline', destructive: true, onPress: confirmDelete },
        ]} /></View> }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : error || !product ? (
        <View className="p-4">
          <Text className="text-gray-600">{error || 'Produto não encontrado.'}</Text>
          {!!error && <Pressable accessibilityRole="button" onPress={() => setReload(value => value + 1)} className="min-h-12 justify-center">
            <Text className="text-indigo-700 font-semibold">Tentar novamente</Text>
          </Pressable>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-4">
            {showPhoto && uri && (
              <Pressable accessibilityRole="button" accessibilityLabel="Ampliar foto do produto" onPress={() => setPhotoExpanded(true)} className="relative w-full aspect-video bg-gray-100">
                <Image source={{ uri }} onError={() => { setFailedUri(uri); setPhotoExpanded(false); }} className="w-full h-full" resizeMode="cover" />
                <View className="absolute bottom-3 right-3 bg-black/60 rounded-full w-11 h-11 items-center justify-center">
                  <Ionicons name="expand-outline" size={20} color="#fff" />
                </View>
              </Pressable>
            )}
            <View className="p-4">
              <Text accessibilityRole="header" className="text-2xl font-bold text-gray-900">{product.name}</Text>
              {!!product.description && <Text className="text-gray-600 text-sm leading-5 mt-2">{product.description}</Text>}
              <View className="flex-row flex-wrap gap-x-4 gap-y-3 border-t border-gray-100 pt-4 mt-4">
                <View className="flex-1 min-w-[120px] flex-row items-center gap-2">
                  <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name="time-outline" size={22} color="#4f46e5" /></View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">Confecção</Text>
                    <Text className="text-gray-800 font-semibold">{formatProductionDuration(product.productionMinutes)}</Text>
                  </View>
                </View>
                <View className="flex-1 min-w-[105px] flex-row items-center gap-2">
                  <View className="w-10 h-10 bg-indigo-50 rounded-xl items-center justify-center"><Ionicons name="layers-outline" size={22} color="#4f46e5" /></View>
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs">Materiais</Text>
                    <Text className="text-gray-800 font-semibold">{product.materials.length} {product.materials.length === 1 ? 'item' : 'itens'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          <View className="gap-2 mb-5">
            <Pressable accessibilityRole="button" disabled={deleting} onPress={() => router.push({ pathname: '/product-pricing', params: { id: String(product.id) } })} className="bg-indigo-600 active:bg-indigo-700 rounded-xl min-h-14 px-4 py-3 flex-row items-center justify-center gap-2">
              <Ionicons name="calculator-outline" size={21} color="#fff" />
              <Text className="text-white font-bold text-center flex-shrink">Calcular preço de venda</Text>
            </Pressable>
            <Pressable accessibilityRole="button" disabled={deleting} onPress={() => router.push({ pathname: '/pricing-history', params: { productId: String(product.id), productName: product.name } })} className="bg-white border border-indigo-300 active:bg-indigo-50 rounded-xl min-h-12 px-3 py-3 flex-row items-center justify-center gap-2">
              <Ionicons name="time-outline" size={20} color="#4f46e5" />
              <Text className="font-semibold text-indigo-700 text-center flex-shrink">Histórico de precificações</Text>
            </Pressable>
          </View>

          <Text accessibilityRole="header" className="text-lg font-bold text-gray-800 mb-3">Composição do produto</Text>
          <View className="gap-3">
            <CompositionSection title="Materiais utilizados" icon="layers-outline"
              summary={product.materials.length + (product.materials.length === 1 ? ' material' : ' materiais')}
              expanded={materialsExpanded} onToggle={() => setMaterialsExpanded(value => !value)}>
              {!product.materials.length && <Text className="text-gray-500 text-sm px-4 py-3 border-t border-gray-100">Nenhum material cadastrado.</Text>}
              {product.materials.map(material => (
                <CompositionRow key={material.materialId} name={material.name}
                  quantity={material.quantityUsed.toLocaleString('pt-BR', { maximumFractionDigits: 20 }) + ' ' + (material.usageUnit ?? material.unit)} />
              ))}
            </CompositionSection>
            {!!product.additionalExpenses.length && (
              <CompositionSection title="Despesas adicionais" icon="receipt-outline"
                summary={product.additionalExpenses.length + (product.additionalExpenses.length === 1 ? ' despesa' : ' despesas')}
                expanded={expensesExpanded} onToggle={() => setExpensesExpanded(value => !value)}>
                {product.additionalExpenses.map(expense => (
                  <CompositionRow key={expense.expenseId} name={expense.name} quantity={expense.quantity.toLocaleString('pt-BR') + ' un'} />
                ))}
              </CompositionSection>
            )}
          </View>
        </ScrollView>
      )}
      <Modal visible={photoExpanded && showPhoto && !loading && !error} animationType="fade" transparent={false} onRequestClose={() => setPhotoExpanded(false)}>
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
