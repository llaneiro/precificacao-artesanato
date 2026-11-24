import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { HeaderAddButton } from '../../src/components/HeaderAddButton';
import { EmptyState } from '../../src/components/EmptyState';
import { MainScreen } from '../../src/components/MainScreen';
import { ProductItem } from '../../src/components/ProductItem';
import { useProducts } from '../../src/hooks/useProducts';

export default function ProductsScreen() {
  const router = useRouter();
  const { products, loading, error, loadProducts } = useProducts();

  return (
    <MainScreen>
      <Tabs.Screen options={{
        headerRight: () => (
          <HeaderAddButton label="Novo produto" onPress={() => router.push('/product-form')} />
        ),
      }} />
      <View className="flex-1 p-4">
        {error ? (
          <View className="items-center py-8">
            <Text className="text-red-600">{error}</Text>
            <TouchableOpacity className="p-4" onPress={() => void loadProducts()}><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity>
          </View>
        ) : loading && !products.length ? <ActivityIndicator color="#4f46e5" /> : (
          <FlatList data={products} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void loadProducts()} contentContainerStyle={{ flexGrow: 1 }}
            ListEmptyComponent={<EmptyState title="Nenhum produto cadastrado" subtitle="Toque em + Novo no cabeçalho para criar uma ficha técnica." />}
            renderItem={({ item }) => <ProductItem product={item}
              onPress={() => router.push({ pathname: '/product-details', params: { id: String(item.id) } })} />}
          />
        )}
      </View>
    </MainScreen>
  );
}
