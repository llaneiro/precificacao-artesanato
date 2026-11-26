import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderAddButton } from '../../src/components/HeaderAddButton';
import { MainScreen } from '../../src/components/MainScreen';
import { ProductItem } from '../../src/components/ProductItem';
import { useProducts } from '../../src/hooks/useProducts';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { useProductCatalogPreference } from '../../src/hooks/useProductCatalogPreference';
import { filterProducts, type CatalogSort } from '../../src/utils/productCatalog';

const GAP = 12;

export default function ProductsScreen() {
  const userId = useAuthContext().user?.uid;
  // Uma troca de conta reinicia todos os estados visuais, inclusive a busca.
  return userId ? <ProductCatalog key={userId} userId={userId} /> : <MainScreen><ActivityIndicator color="#4f46e5" /></MainScreen>;
}

function ProductCatalog({ userId }: { userId: string }) {
  const router = useRouter();
  const { products, loading, error, loadProducts } = useProducts();
  const preference = useProductCatalogPreference(userId);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CatalogSort>('recent');
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const gridAvailable = width >= 268 && fontScale <= 1.4;
  const grid = preference.layout === 'grid' && gridAvailable;
  const filtered = useMemo(() => filterProducts(products, search, sort), [products, search, sort]);
  const searching = search.trim().length > 0;
  const newProduct = () => router.push('/product-form');

  return (
    <MainScreen>
      <Tabs.Screen options={{
        headerRight: () => <HeaderAddButton label="Novo produto" onPress={newProduct} />,
      }} />
      <View className="flex-1 px-4 pt-4 pb-2">
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-1 min-h-12 bg-white border border-gray-200 rounded-xl flex-row items-center px-3 gap-2">
            <Ionicons name="search-outline" size={21} color="#9ca3af" />
            <TextInput accessibilityLabel="Buscar produto pelo nome" placeholder="Buscar produto" placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch}
              autoCorrect={false} returnKeyType="search" className="flex-1 min-h-12 text-gray-800 py-2" />
            {!!search && (
              <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setSearch('')} className="w-11 h-11 -mr-2 items-center justify-center">
                <Ionicons name="close-circle" size={19} color="#9ca3af" />
              </Pressable>
            )}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={'Ordenação: ' + (sort === 'recent' ? 'mais recentes. Alterar para ordem alfabética' : 'ordem alfabética. Alterar para mais recentes')} onPress={() => setSort(current => current === 'recent' ? 'name' : 'recent')}
            className="w-12 h-12 bg-white border border-gray-200 rounded-xl items-center justify-center active:bg-indigo-50">
            <Ionicons name="swap-vertical-outline" size={23} color="#4f46e5" />
          </Pressable>
        </View>
        <View className="flex-row items-center justify-between gap-2 mb-3">
          <Text className="flex-1 text-gray-500 text-xs">{loading && !products.length ? 'Carregando...' : error ? 'Produtos indisponíveis' : filtered.length + (filtered.length === 1 ? ' produto' : ' produtos') + ' · ' + (sort === 'recent' ? 'Mais recentes' : 'A–Z')}</Text>
          <View className="bg-gray-200 rounded-xl p-1 flex-row gap-1">
            {(['list', 'grid'] as const).map(mode => {
              const selected = mode === (grid ? 'grid' : 'list');
              const disabled = !preference.ready || (mode === 'grid' && !gridAvailable);
              return (
                <Pressable key={mode} accessibilityRole="button" accessibilityLabel={mode === 'list' ? 'Visualização em lista' : 'Visualização em grade'} accessibilityState={{ selected, disabled }} disabled={disabled}
                  onPress={() => preference.choose(mode)} className={'w-11 h-11 items-center justify-center rounded-lg ' + (selected ? 'bg-white' : '')}>
                  <Ionicons name={mode === 'list' ? 'list-outline' : 'grid-outline'} size={21} color={selected ? '#4f46e5' : '#6b7280'} />
                </Pressable>
              );
            })}
          </View>
        </View>
        {preference.storageError && <Text className="text-gray-500 text-xs mb-2">Não foi possível salvar ou carregar a preferência de visualização.</Text>}
        <View className="flex-1" onLayout={event => setWidth(event.nativeEvent.layout.width)}>
          {error ? (
            <View className="items-center py-8">
              <Text className="text-red-600 text-center">{error}</Text>
              <TouchableOpacity className="p-4" onPress={() => void loadProducts()}><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity>
            </View>
          ) : (loading && !products.length) || !preference.ready || width === 0 ? <ActivityIndicator color="#4f46e5" className="mt-4" /> : (
            <FlatList key={grid ? 'grid' : 'list'} data={filtered} numColumns={grid ? 2 : 1}
              keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void loadProducts()}
              keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
              columnWrapperStyle={grid ? { gap: GAP, alignItems: 'stretch' } : undefined}
              ItemSeparatorComponent={() => <View style={{ height: GAP }} />}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center px-5 py-8 gap-3">
                  <View className="bg-indigo-50 w-16 h-16 rounded-2xl items-center justify-center">
                    <Ionicons name={searching ? 'search-outline' : 'cube-outline'} size={30} color="#818cf8" />
                  </View>
                  <Text className="text-lg font-bold text-gray-800 text-center">{searching ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</Text>
                  <Text className="text-sm text-gray-500 text-center">{searching ? 'Tente buscar por outro nome.' : 'Cadastre sua primeira peça para calcular o preço de venda.'}</Text>
                  <Pressable accessibilityRole="button" onPress={searching ? () => setSearch('') : newProduct} className="bg-indigo-600 rounded-xl min-h-12 px-5 py-3 flex-row items-center justify-center gap-2">
                    <Ionicons name={searching ? 'close' : 'add'} size={20} color="#fff" />
                    <Text className="text-white font-semibold">{searching ? 'Limpar busca' : 'Novo produto'}</Text>
                  </Pressable>
                </View>
              }
              renderItem={({ item }) => (
                <View style={grid ? { width: (width - GAP) / 2 } : undefined}>
                  <ProductItem product={item} layout={grid ? 'grid' : 'list'}
                    onPress={() => router.push({ pathname: '/product-details', params: { id: String(item.id) } })}
                    onPricing={() => router.push({ pathname: '/product-pricing', params: { id: String(item.id) } })}
                    onHistory={() => router.push({ pathname: '/pricing-history', params: { productId: String(item.id), productName: item.name } })} />
                </View>
              )}
            />
          )}
        </View>
      </View>
    </MainScreen>
  );
}
