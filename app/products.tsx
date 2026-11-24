import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { EmptyState } from '../src/components/EmptyState';
import { MainScreen } from '../src/components/MainScreen';
import { ProductItem } from '../src/components/ProductItem';
import { useProducts } from '../src/hooks/useProducts';
import { ProductSummary } from '../src/types/product';

export default function ProductsScreen() {
  const router = useRouter();
  const { products, loading, error, loadProducts, removeProduct } = useProducts();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete(product: ProductSummary) {
    Alert.alert('Excluir produto', 'Deseja excluir "' + product.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try { await removeProduct(product.id); }
        catch { Alert.alert('Erro', 'Não foi possível excluir o produto.'); }
        finally { setDeleting(false); }
      }},
    ]);
  }

  return (
    <MainScreen route="/products">
      <View className="flex-1 p-4">
        <TouchableOpacity disabled={deleting} onPress={() => router.push('/product-form')} className="bg-indigo-600 rounded-xl p-4 mb-4">
          <Text className="text-white font-bold text-center">+ Novo produto</Text>
        </TouchableOpacity>
        {error ? (
          <View className="items-center py-8">
            <Text className="text-red-600">{error}</Text>
            <TouchableOpacity className="p-4" onPress={() => void loadProducts()}><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity>
          </View>
        ) : loading && !products.length ? <ActivityIndicator color="#4f46e5" /> : (
          <FlatList data={products} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void loadProducts()} contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={<EmptyState title="Nenhum produto cadastrado" subtitle="Toque em Novo produto para criar uma ficha técnica." />}
            renderItem={({ item }) => <ProductItem product={item} disabled={deleting}
              onEdit={() => router.push({ pathname: '/product-form', params: { id: String(item.id) } })}
              onDelete={() => confirmDelete(item)} />}
          />
        )}
      </View>
    </MainScreen>
  );
}
