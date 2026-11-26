import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderAddButton } from '../../src/components/HeaderAddButton';
import { MainScreen } from '../../src/components/MainScreen';
import { useMaterials } from '../../src/hooks/useMaterials';
import { MaterialItem } from '../../src/components/MaterialItem';
import { filterCatalog, type CatalogSort } from '../../src/utils/catalogSearch';

export default function MaterialsScreen() {
  const router = useRouter();
  const { materials, loading, error, loadMaterials } = useMaterials();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<CatalogSort>('recent');
  const filtered = useMemo(() => filterCatalog(materials, search, sort), [materials, search, sort]);
  const searching = search.trim().length > 0;
  const create = () => router.push('/material-form');

  return (
    <MainScreen>
      <Tabs.Screen options={{ headerRight: () => <HeaderAddButton label="Novo material" onPress={create} /> }} />
      <View className="flex-1 px-4 pt-4 pb-2">
        <View className="flex-row items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-3">
          <Ionicons name="information-circle-outline" size={21} color="#4f46e5" />
          <Text className="flex-1 text-gray-700 text-sm leading-5">Cadastre os insumos usados nas peças, incluindo <Text className="font-semibold text-indigo-800">embalagens e etiquetas</Text>.</Text>
        </View>
        <View className="flex-row items-center gap-2 mb-3">
          <View className="flex-1 min-h-12 bg-white border border-gray-200 rounded-xl flex-row items-center px-3 gap-2">
            <Ionicons name="search-outline" size={21} color="#9ca3af" />
            <TextInput accessibilityLabel="Buscar material pelo nome" placeholder="Buscar material" placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} autoCorrect={false} returnKeyType="search" className="flex-1 min-h-12 text-gray-800 py-2" />
            {!!search && <Pressable accessibilityRole="button" accessibilityLabel="Limpar busca" onPress={() => setSearch('')} className="w-11 h-11 -mr-2 items-center justify-center"><Ionicons name="close-circle" size={19} color="#9ca3af" /></Pressable>}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel={'Ordenação: ' + (sort === 'recent' ? 'mais recentes. Alterar para ordem alfabética' : 'ordem alfabética. Alterar para mais recentes')} onPress={() => setSort(s => s === 'recent' ? 'name' : 'recent')} className="w-12 h-12 bg-white border border-gray-200 rounded-xl items-center justify-center active:bg-indigo-50">
            <Ionicons name="swap-vertical-outline" size={23} color="#4f46e5" />
          </Pressable>
        </View>
        {!error && !(loading && !materials.length) && <Text className="text-gray-500 text-xs mb-3">{filtered.length} {filtered.length === 1 ? 'material' : 'materiais'} · {sort === 'recent' ? 'Mais recentes' : 'A–Z'}</Text>}
        {error ? <View className="items-center py-8"><Text className="text-red-600 text-center">{error}</Text><Pressable onPress={() => void loadMaterials()} className="p-4"><Text className="text-indigo-700 font-semibold">Tentar novamente</Text></Pressable></View>
          : loading && !materials.length ? <ActivityIndicator color="#4f46e5" className="mt-4" /> :
          <FlatList data={filtered} keyExtractor={item => String(item.id)} refreshing={loading} onRefresh={() => void loadMaterials()} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
            ListEmptyComponent={<View className="flex-1 items-center justify-center px-5 py-8 gap-3">
              <View className="w-16 h-16 rounded-2xl bg-indigo-50 items-center justify-center"><Ionicons name={searching ? 'search-outline' : 'layers-outline'} size={30} color="#818cf8" /></View>
              <Text className="text-lg font-bold text-gray-800 text-center">{searching ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}</Text>
              <Text className="text-gray-500 text-sm text-center">{searching ? 'Tente buscar por outro nome.' : 'Cadastre os materiais que utiliza nas suas peças.'}</Text>
              <Pressable accessibilityRole="button" onPress={searching ? () => setSearch('') : create} className="min-h-12 px-5 py-3 bg-indigo-600 rounded-xl justify-center"><Text className="text-white font-semibold">{searching ? 'Limpar busca' : 'Novo material'}</Text></Pressable>
            </View>}
            renderItem={({ item }) => <MaterialItem material={item}
              onPress={() => router.push({ pathname: '/material-details', params: { id: String(item.id) } })}
              onUpdatePrice={() => router.push({ pathname: '/material-price-form', params: { id: String(item.id) } })}
              onHistory={() => router.push({ pathname: '/material-details', params: { id: String(item.id), section: 'history' } })} />}
          />}
      </View>
    </MainScreen>
  );
}
