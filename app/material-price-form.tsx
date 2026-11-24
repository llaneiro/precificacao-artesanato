import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, Pressable, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { HelpLabel } from '../src/components/HelpTip';
import { CompactUnitSelect } from '../src/components/MeasureCategorySelect';
import { useMaterials } from '../src/hooks/useMaterials';
import { parseQuantity } from '../src/hooks/useMaterialForm';
import { centsToInput, formatCurrency, parseCostCents } from '../src/utils/currency';
import { formatReferenceQuantity } from '../src/utils/materialCostHistory';
import { compatibleUnits, isMaterialUnit, type Material } from '../src/types/material';

export default function MaterialPriceForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getMaterialById, updatePrice } = useMaterials(false);
  const [material, setMaterial] = useState<Material | null>(null);
  const [cost, setCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true); setMaterial(null); setError('');
    const materialId = Number(id);
    async function load() {
      try {
        if (!Number.isSafeInteger(materialId) || materialId <= 0) throw new Error('Material inválido.');
        const current = await getMaterialById(materialId);
        if (!current) throw new Error('Material não encontrado.');
        if (active) {
          setMaterial(current); setCost(centsToInput(current.costCents));
          setQuantity(String(current.quantity).replace('.', ',')); setUnit(current.unit);
        }
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Não foi possível carregar o material.');
      } finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [id, getMaterialById]);

  async function save() {
    if (!material || loading || busy.current) return;
    busy.current = true; setSaving(true); setError('');
    try {
      if (!isMaterialUnit(unit)) throw new Error('Selecione uma unidade de medida.');
      await updatePrice({ id: material.id, costCents: parseCostCents(cost), quantity: parseQuantity(quantity), unit });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível atualizar o preço.');
    } finally { busy.current = false; setSaving(false); }
  }

  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';
  return <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ title: 'Atualizar preço', headerRight: () => <HeaderSaveButton disabled={loading || !material} saving={saving} onPress={() => void save()} /> }} />
    {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : !material ?
      <Text className="text-red-600 p-4">{error}</Text> :
      <FormScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-xl font-bold text-gray-900 mb-3">{material.name}</Text>
        <View className="bg-indigo-50 rounded-xl p-4 mb-4">
          <Text className="text-indigo-700 text-xs">Preço atual</Text>
          <Text className="text-xl font-bold text-indigo-700">{formatCurrency(material.costCents)}</Text>
          <Text className="text-indigo-700">/ {formatReferenceQuantity(material.quantity, material.unit)}</Text>
        </View>
        <HelpLabel title="Novo preço (R$)" message="Informe o valor da nova referência. Se o preço continuar igual, salve para registrar a conferência." />
        <TextInput className={inputClass} value={cost} onChangeText={v => { setCost(v); setError(''); }} keyboardType="decimal-pad" editable={!saving} />
        <Text className="text-gray-700 font-semibold mb-2">Quantidade comprada</Text>
        <View className="flex-row items-center gap-2">
          <TextInput className={inputClass + ' flex-1'} value={quantity} onChangeText={v => { setQuantity(v); setError(''); }} keyboardType="decimal-pad" editable={!saving} />
          <CompactUnitSelect value={unit} units={compatibleUnits(material.unit)} onChange={v => { setUnit(v); setError(''); }} disabled={saving} />
        </View>
        {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
        <Pressable disabled={saving} onPress={() => void save()} className={'rounded-xl p-4 ' + (saving ? 'bg-indigo-400' : 'bg-indigo-600')}>
          <Text className="text-white font-bold text-center">{saving ? 'Salvando...' : 'Registrar atualização'}</Text>
        </Pressable>
      </FormScrollView>}
  </SafeAreaView>;
}
