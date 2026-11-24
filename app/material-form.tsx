import { FormScrollView } from '../src/components/FormScrollView';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMaterialForm } from '../src/hooks/useMaterialForm';
import { MaterialUnitSelect } from '../src/components/MaterialUnitSelect';

export default function MaterialFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { fields, setField, isEditing, loading, loadError, saving, error, save } = useMaterialForm(id);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';

  async function handleSave() {
    if (await save()) router.back();
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: isEditing ? 'Editar material' : 'Novo material' }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : loadError ? (
        <View className="p-4"><Text className="text-red-600">{loadError}</Text></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-gray-700 font-semibold mb-2">Nome do material</Text>
          <TextInput className={inputClass} value={fields.name} onChangeText={v => setField('name', v)} placeholder="Ex.: Fio de algodão" editable={!saving} />
          <Text className="text-gray-700 font-semibold mb-2">Preço de referência (R$)</Text>
          <Text className="text-gray-500 text-sm mb-2">Preço correspondente à quantidade informada abaixo.</Text>
          <TextInput className={inputClass} value={fields.cost} onChangeText={v => setField('cost', v)} placeholder="Ex.: 30,00" keyboardType="decimal-pad" editable={!saving} />
          <Text className="text-gray-700 font-semibold mb-2">Unidade de medida</Text>
          <MaterialUnitSelect value={fields.unit} onChange={v => setField('unit', v)} disabled={saving} />
          <Text className="text-gray-700 font-semibold mb-2">Quantidade de material</Text>
          <TextInput className={inputClass} value={fields.quantity} onChangeText={v => setField('quantity', v)} placeholder="Ex.: 600" keyboardType="decimal-pad" editable={!saving} />
          {error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
          <TouchableOpacity disabled={saving} onPress={handleSave} className={'rounded-xl p-4 ' + (saving ? 'bg-indigo-400' : 'bg-indigo-600')}>
            <Text className="text-white font-bold text-center">{saving ? 'Salvando...' : 'Salvar material'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
