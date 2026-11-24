import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MainScreen } from '../src/components/MainScreen';
import { useMaterials } from '../src/hooks/useMaterials';
import { Material } from '../src/types/material';
import { EmptyState } from '../src/components/EmptyState';
import { MaterialItem } from '../src/components/MaterialItem';

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
    <MainScreen route="/materials">
      <View className="flex-1 p-4">
        <TouchableOpacity className="bg-indigo-600 rounded-xl p-4 mb-4" onPress={() => router.push('/material-form')}>
          <Text className="text-white text-center font-bold">+ Novo material</Text>
        </TouchableOpacity>
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
            ListEmptyComponent={<EmptyState title="Nenhum material cadastrado" subtitle="Toque em Novo material para começar." />}
            renderItem={({ item }) => (
              <MaterialItem material={item} disabled={deleting}
                onEdit={id => router.push({ pathname: '/material-form', params: { id: String(id) } })}
                onDelete={confirmDelete} />
            )}
          />
        )}
      </View>
    </MainScreen>
  );
}
