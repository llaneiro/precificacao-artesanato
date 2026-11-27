import { CompactUnitSelect } from '../src/components/MeasureCategorySelect';
import { compatibleUnits, convertQuantity } from '../src/types/material';
import { HelpLabel } from '../src/components/HelpTip';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { Alert, ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { useProductForm } from '../src/hooks/useProductForm';
import { formatCurrency, formatReal } from '../src/utils/currency';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const form = useProductForm(id);
  const [showAdditional, setShowAdditional] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';
  const labelClass = 'text-gray-700 font-semibold mb-2';

  async function handleSave() {
    if (await form.save()) router.back();
  }

  useEffect(() => { if (form.error) Alert.alert('Não foi possível salvar', form.error); }, [form.error]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: form.isEditing ? 'Editar produto' : 'Novo produto', headerRight: () => <HeaderSaveButton disabled={form.loading || form.materialsLoading || form.additionalLoading || !!form.loadError || !!form.materialsError || !!form.additionalError} saving={form.saving} onPress={() => void handleSave()} /> }} />
      {form.loading || form.materialsLoading || form.additionalLoading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.loadError || form.materialsError || form.additionalError ? (
        <View className="p-4">
          <Text className="text-red-600">{form.loadError ?? form.materialsError ?? form.additionalError}</Text>
          {form.additionalError && <TouchableOpacity onPress={() => void form.loadAdditionalExpenses()} className="p-3"><Text className="text-indigo-600">Tentar carregar despesas novamente</Text></TouchableOpacity>}
          {form.materialsError && <TouchableOpacity onPress={() => void form.loadMaterials()} className="p-3"><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity>}
        </View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className={labelClass}>Foto (opcional)</Text>
          {form.photoUri && <Image source={{ uri: form.photoUri }} className="w-full h-48 rounded-xl bg-gray-100 mb-2" resizeMode="contain" />}
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity disabled={form.saving} onPress={() => void form.choosePhoto()} className="flex-1 border border-indigo-300 rounded-xl p-3">
              <Text className="text-indigo-600 font-semibold text-center">{form.photoUri ? 'Trocar foto' : 'Selecionar da galeria'}</Text>
            </TouchableOpacity>
            {!!form.photoUri && <TouchableOpacity disabled={form.saving} onPress={form.removePhoto} className="p-3"><Text className="text-red-600">Remover</Text></TouchableOpacity>}
          </View>
          <Text className={labelClass}>Nome do produto</Text>
          <TextInput className={inputClass} value={form.fields.name} onChangeText={v => form.setField('name', v)} placeholder="Ex.: Bolsa de crochê" editable={!form.saving} />
          <Text className={labelClass}>Descrição (opcional)</Text>
          <TextInput className={inputClass} value={form.fields.description} onChangeText={v => form.setField('description', v)} multiline placeholder="Detalhes da peça" editable={!form.saving} />
          <Text className={labelClass}>Tempo de produção</Text>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="text-gray-500 mb-1">Horas</Text>
              <TextInput className={inputClass} value={form.fields.hours} onChangeText={v => form.setField('hours', v)} keyboardType="number-pad" placeholder="0" editable={!form.saving} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-500 mb-1">Minutos</Text>
              <TextInput className={inputClass} value={form.fields.minutes} onChangeText={v => form.setField('minutes', v)} keyboardType="number-pad" placeholder="0" editable={!form.saving} />
            </View>
          </View>
          <Text className="text-lg font-bold text-gray-800 mb-3">Materiais utilizados</Text>
          {form.selected.map(selection => {
            const material = form.materials.find(m => m.id === selection.materialId);
            const qty = Number(selection.quantity.replace(',', '.'));
            const converted = material ? convertQuantity(qty, selection.usageUnit, material.unit) : NaN;
            const cost = material && Number.isFinite(converted) ? material.costCents / material.quantity * converted / 100 : null;
            return (
              <View key={selection.materialId} className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
                <View className="flex-row justify-between items-center mb-2 gap-2">
                  <Text className="flex-1 font-bold text-gray-800">{material?.name ?? 'Material indisponível'}</Text>
                  <TouchableOpacity disabled={form.saving} onPress={() => form.removeMaterial(selection.materialId)}><Text className="text-red-600">Remover</Text></TouchableOpacity>
                </View>
                <Text className="text-gray-500 mb-1">Quantidade utilizada</Text>
                <View className="flex-row items-center gap-2">
                  <TextInput className={inputClass + ' flex-1'} value={selection.quantity} onChangeText={v => form.changeQuantity(selection.materialId, v)} keyboardType="decimal-pad" placeholder="Ex.: 250" editable={!form.saving} />
                  <CompactUnitSelect value={selection.usageUnit} units={compatibleUnits(material?.unit ?? '')} onChange={v => form.changeUsageUnit(selection.materialId, v)} disabled={form.saving} />
                </View>
                {cost !== null && <Text className="text-gray-600">Custo estimado: {formatReal(cost)}</Text>}
              </View>
            );
          })}
          <TouchableOpacity disabled={form.saving} onPress={() => setShowMaterials(old => !old)} className="border border-indigo-300 rounded-xl p-3 mb-3">
            <Text className="text-indigo-600 font-semibold text-center">{showMaterials ? 'Fechar lista' : '+ Adicionar material'}</Text>
          </TouchableOpacity>
          {showMaterials && <View className="bg-white border border-gray-200 rounded-xl p-2 mb-4">
            {form.materials.filter(m => !form.selected.some(s => s.materialId === m.id)).map(material => (
              <TouchableOpacity key={material.id} disabled={form.saving} className="p-3 border-b border-gray-100" onPress={() => { form.addMaterial(material.id); setShowMaterials(false); }}>
                <Text className="text-gray-800 font-medium">{material.name} ({material.unit})</Text>
              </TouchableOpacity>
            ))}
            {!form.materials.some(m => !form.selected.some(s => s.materialId === m.id)) && <Text className="p-3 text-gray-500">{form.materials.length ? 'Todos os materiais já foram adicionados.' : 'Cadastre materiais na aba Materiais antes de criar um produto.'}</Text>}
          </View>}
          <HelpLabel title="Despesas adicionais (opcional)" message="Inclua serviços e gastos desta peça cadastrados na Central financeira." className="text-lg font-bold text-gray-800" />
          {form.selectedAdditional.map(selection => {
            const expense = form.additionalExpenses.find(e => e.id === selection.expenseId);
            return (
              <View key={selection.expenseId} className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
                <View className="flex-row items-center justify-between gap-2 mb-2">
                  <Text className="font-bold text-gray-800 flex-1">{expense?.name ?? 'Despesa indisponível'}</Text>
                  <TouchableOpacity disabled={form.saving} onPress={() => form.removeAdditional(selection.expenseId)}><Text className="text-red-600">Remover</Text></TouchableOpacity>
                </View>
                {!!expense && <Text className="text-gray-500 mb-2">{formatCurrency(expense.costCents)} / utilização</Text>}
                <Text className="text-gray-600 mb-1">Quantidade de utilizações</Text>
                <TextInput className={inputClass} value={selection.quantity} onChangeText={v => form.changeAdditionalQuantity(selection.expenseId, v)} keyboardType="number-pad" editable={!form.saving} />
              </View>
            );
          })}
          <TouchableOpacity disabled={form.saving} onPress={() => setShowAdditional(old => !old)} className="border border-indigo-300 rounded-xl p-3 mb-3">
            <Text className="text-indigo-600 font-semibold text-center">{showAdditional ? 'Fechar lista' : '+ Adicionar despesa'}</Text>
          </TouchableOpacity>
          {showAdditional && <View className="bg-white border border-gray-200 rounded-xl p-2 mb-4">
            {form.additionalExpenses.filter(e => !form.selectedAdditional.some(s => s.expenseId === e.id)).map(expense => (
              <TouchableOpacity key={expense.id} disabled={form.saving} className="p-3 border-b border-gray-100" onPress={() => { form.addAdditional(expense.id); setShowAdditional(false); }}>
                <Text className="text-gray-800 font-medium">{expense.name} · {formatCurrency(expense.costCents)}</Text>
              </TouchableOpacity>
            ))}
            {!form.additionalExpenses.some(e => !form.selectedAdditional.some(s => s.expenseId === e.id)) && <Text className="p-3 text-gray-500">{form.additionalExpenses.length ? 'Todas as despesas já foram adicionadas.' : 'Cadastre despesas adicionais na aba Despesas.'}</Text>}
          </View>}
          <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <HelpLabel title="Custo dos materiais" message="Mão de obra, despesas fixas, taxas e lucro entram na precificação." className="text-gray-600" />
            <Text className="text-xl text-indigo-700 font-bold">{form.totalCostCents === null ? '—' : formatCurrency(form.totalCostCents)}</Text>
            <Text className="text-gray-600 mt-3">Despesas adicionais</Text>
            <Text className="text-indigo-700 font-bold">{form.additionalCostCents === null ? '—' : formatCurrency(form.additionalCostCents)}</Text>

          </View>
          {!!form.error && <Text className="text-red-600 mb-4" accessibilityRole="alert">{form.error}</Text>}
          <TouchableOpacity disabled={form.saving} onPress={() => void handleSave()} className={'rounded-xl p-4 ' + (form.saving ? 'bg-indigo-400' : 'bg-indigo-600')}>
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar produto'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
