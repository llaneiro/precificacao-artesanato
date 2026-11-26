import { ExpenseFormFields } from '../src/components/ExpenseFormFields';
import { useEffect } from 'react';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { Alert, ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useExpenseForm } from '../src/hooks/useExpenseForm';

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { fields, setField, isEditing, loading, loadError, saving, error, save } = useExpenseForm(id);
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
          <ExpenseFormFields key={id ?? 'new'} name={fields.name} cost={fields.monthlyCost} description={fields.description}
            onNameChange={value => setField('name', value)} onCostChange={value => setField('monthlyCost', value)} onDescriptionChange={value => setField('description', value)}
            namePlaceholder="Ex.: Energia elétrica" costLabel="Valor mensal (R$)" costHelp="Informe apenas a parte do gasto mensal referente ao negócio."
            costPlaceholder="Ex.: 150,00" descriptionPlaceholder="Ex.: Parcela referente ao ateliê" saving={saving} />
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
