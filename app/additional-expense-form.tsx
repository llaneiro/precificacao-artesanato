import { FormScrollView } from '../src/components/FormScrollView';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdditionalExpenseForm } from '../src/hooks/useAdditionalExpenseForm';

export default function AdditionalExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { fields, setField, isEditing, loading, loadError, saving, error, save } = useAdditionalExpenseForm(id);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';

  async function handleSave() {
    if (await save()) router.back();
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: isEditing ? 'Editar despesa' : 'Nova despesa' }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : loadError ? (
        <View className="p-4"><Text className="text-red-600">{loadError}</Text></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-gray-700 font-semibold mb-2">Nome da despesa</Text>
          <TextInput className={inputClass} value={fields.name} onChangeText={v => setField('name', v)} placeholder="Ex.: Bordado terceirizado" editable={!saving} />
          <Text className="text-gray-700 font-semibold mb-2">Valor por utilização (R$)</Text>
          <Text className="text-gray-500 text-sm mb-2">Informe quanto custa uma utilização desse serviço ou gasto.</Text>
          <TextInput className={inputClass} value={fields.cost} onChangeText={v => setField('cost', v)} placeholder="Ex.: 15,00" keyboardType="decimal-pad" editable={!saving} />
          <Text className="text-gray-700 font-semibold mb-2">Descrição (opcional)</Text>
          <TextInput className={inputClass + ' min-h-24'} multiline textAlignVertical="top" value={fields.description} onChangeText={v => setField('description', v)} placeholder="Ex.: Valor por peça" editable={!saving} />
          {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
          <TouchableOpacity disabled={saving} onPress={handleSave} className={'rounded-xl p-4 ' + (saving ? 'bg-indigo-400' : 'bg-indigo-600')}>
            <Text className="text-white font-bold text-center">{saving ? 'Salvando...' : 'Salvar despesa'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
