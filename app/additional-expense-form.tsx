import { ExpenseFormFields } from '../src/components/ExpenseFormFields';
import { useEffect } from 'react';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { Alert, ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdditionalExpenseForm } from '../src/hooks/useAdditionalExpenseForm';

export default function AdditionalExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { fields, setField, isEditing, loading, loadError, saving, error, save } = useAdditionalExpenseForm(id);
  async function handleSave() {
    if (await save()) router.back();
  }

  useEffect(() => { if (error) Alert.alert('Não foi possível salvar', error); }, [error]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: isEditing ? 'Editar despesa' : 'Nova despesa', headerRight: () => <HeaderSaveButton disabled={loading || !!loadError} saving={saving} onPress={() => void handleSave()} /> }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : loadError ? (
        <View className="p-4"><Text className="text-red-600">{loadError}</Text></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <ExpenseFormFields key={id ?? 'new'} name={fields.name} cost={fields.cost} description={fields.description}
            onNameChange={value => setField('name', value)} onCostChange={value => setField('cost', value)} onDescriptionChange={value => setField('description', value)}
            namePlaceholder="Ex.: Bordado terceirizado" costLabel="Valor por serviço ou unidade (R$)" costHelp="Se você paga R$ 15 por um bordado terceirizado, informe 15,00. Ao adicionar essa despesa ao produto, você pode indicar quantas vezes ela será utilizada."
            costPlaceholder="Ex.: 15,00" descriptionPlaceholder="Ex.: Valor por peça" saving={saving} />
          {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
          <TouchableOpacity disabled={saving} onPress={handleSave} className={'rounded-xl p-4 ' + (saving ? 'bg-indigo-400' : 'bg-indigo-600')}>
            <Text className="text-white font-bold text-center">{saving ? 'Salvando...' : 'Salvar despesa'}</Text>
          </TouchableOpacity>
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => router.back()} className="min-h-12 items-center justify-center mt-2">
            <Text className="text-indigo-700 font-semibold">Cancelar</Text>
          </Pressable>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
