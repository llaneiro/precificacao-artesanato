import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderAddButton } from '../../src/components/HeaderAddButton';
import { MainScreen } from '../../src/components/MainScreen';
import { useMaterials } from '../../src/hooks/useMaterials';
import { Material } from '../../src/types/material';
import { EmptyState } from '../../src/components/EmptyState';
import { MaterialItem } from '../../src/components/MaterialItem';

export default function MaterialsScreen() {
  const router = useRouter();
  const { materials, loading, error, loadMaterials, removeMaterial } = useMaterials();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete(material: Material) {
    Alert.alert('Excluir material', 'Deseja excluir "' + material.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await removeMaterial(material.id);
          } catch (error) {
            const linked = String(error).includes('MATERIAL_IN_USE') || String(error).includes('FOREIGN KEY constraint failed');
            Alert.alert('Não foi possível excluir', linked
              ? 'Este material está vinculado a um produto. Remova a associação antes de excluí-lo.'
              : 'Não foi possível excluir o material.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <MainScreen>
      <Tabs.Screen options={{
        headerRight: () => (
          <HeaderAddButton label="Novo material" disabled={deleting} onPress={() => router.push('/material-form')} />
        ),
      }} />
      <View className="flex-1 p-4">
        {error ? (
          <View className="items-center py-8">
            <Text className="text-red-600 text-center">{error}</Text>
            <TouchableOpacity onPress={() => void loadMaterials()} className="p-4">
              <Text className="text-indigo-600 font-semibold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : loading && materials.length === 0 ? (
          <ActivityIndicator className="mt-8" color="#4f46e5" />
        ) : (
          <FlatList
            data={materials}
            keyExtractor={item => String(item.id)}
            refreshing={loading}
            onRefresh={() => void loadMaterials()}
            contentContainerStyle={{ flexGrow: 1 }}
            ListHeaderComponent={
              <View className="flex-row items-start gap-2 bg-indigo-50 border border-indigo-100 rounded-xl p-3 mb-4">
                <Ionicons name="information-circle-outline" size={21} color="#4f46e5" />
                <Text className="flex-1 text-gray-700 text-sm leading-5">Cadastre os insumos usados nas peças, incluindo <Text className="font-semibold text-indigo-800">embalagens e etiquetas</Text>.</Text>
              </View>
            }
            ListEmptyComponent={<EmptyState title="Nenhum material cadastrado" subtitle="Cadastre seu primeiro material." />}
            renderItem={({ item }) => (
              <MaterialItem material={item} disabled={deleting}
                onEdit={id => router.push({ pathname: '/material-form', params: { id: String(id) } })}
                onUpdatePrice={id => router.push({ pathname: '/material-price-form', params: { id: String(id) } })}
                onHistory={id => router.push({ pathname: '/material-cost-history', params: { id: String(id) } })}
                onDelete={confirmDelete} />
            )}
          />
        )}
      </View>
    </MainScreen>
  );
}
