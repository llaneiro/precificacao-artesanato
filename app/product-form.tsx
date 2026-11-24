import { ActivityIndicator, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { useProductForm } from '../src/hooks/useProductForm';

export default function ProductFormScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const form = useProductForm(id);
  const [showMaterials, setShowMaterials] = useState(false);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';
  const labelClass = 'text-gray-700 font-semibold mb-2';

  async function handleSave() {
    if (await form.save()) router.back();
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: form.isEditing ? 'Editar produto' : 'Novo produto' }} />
      {form.loading || form.materialsLoading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.loadError || form.materialsError ? (
        <View className="p-4">
          <Text className="text-red-600">{form.loadError ?? form.materialsError}</Text>
          {form.materialsError && <TouchableOpacity onPress={() => void form.loadMaterials()} className="p-3"><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity>}
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
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
            const cost = material && Number.isFinite(qty) && qty > 0 ? material.costCents / material.quantity * qty / 100 : null;
            return (
              <View key={selection.materialId} className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
                <View className="flex-row justify-between items-center mb-2 gap-2">
                  <Text className="flex-1 font-bold text-gray-800">{material?.name ?? 'Material indisponível'}</Text>
                  <TouchableOpacity disabled={form.saving} onPress={() => form.removeMaterial(selection.materialId)}><Text className="text-red-600">Remover</Text></TouchableOpacity>
                </View>
                <Text className="text-gray-500 mb-1">Quantidade utilizada ({material?.unit ?? '—'})</Text>
                <TextInput className={inputClass} value={selection.quantity} onChangeText={v => form.changeQuantity(selection.materialId, v)} keyboardType="decimal-pad" placeholder="Ex.: 250" editable={!form.saving} />
                {cost !== null && <Text className="text-gray-600">Custo estimado: {cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>}
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
          <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-600">Custo estimado dos materiais</Text>
            <Text className="text-xl text-indigo-700 font-bold">{form.totalCostCents === null ? '—' : (form.totalCostCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</Text>
            <Text className="text-gray-500 text-sm mt-1">Não inclui mão de obra, despesas ou lucro.</Text>
          </View>
          {!!form.error && <Text className="text-red-600 mb-4" accessibilityRole="alert">{form.error}</Text>}
          <TouchableOpacity disabled={form.saving} onPress={() => void handleSave()} className={'rounded-xl p-4 ' + (form.saving ? 'bg-indigo-400' : 'bg-indigo-600')}>
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar produto'}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
