import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { FormScrollView } from '../src/components/FormScrollView';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { centsToInput, formatCurrency } from '../src/utils/currency';

export default function ProfitMarginScreen() {
  const router = useRouter();
  const { settings, loading, error: loadError, loadSettings, saveMargin } = usePricingSettings(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);
  useEffect(() => { void loadSettings(); }, [loadSettings]);
  useEffect(() => {
    if (!loading && !loadError) setValue(settings?.marginBps == null ? '' : centsToInput(settings.marginBps));
  }, [settings, loading, loadError]);
  async function save() {
    if (busy.current || loading || loadError) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try { await saveMargin(value); router.back(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar a margem.'); }
    finally { busy.current = false; setSaving(false); }
  }
  const margin = Number(value.replace(',', '.'));
  const valid = /^\d+(?:[,.]\d{1,2})?$/.test(value.trim()) && margin >= 0 && margin < 100;
  useEffect(() => { if (error) Alert.alert('Não foi possível salvar', error); }, [error]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={loading || !!loadError} saving={saving} onPress={() => void save()} /> }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : loadError ?
        <View className="p-4"><Text className="text-red-600">{loadError}</Text><TouchableOpacity onPress={() => void loadSettings()}><Text className="text-indigo-600 p-3">Tentar novamente</Text></TouchableOpacity></View> :
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-gray-600 mb-4">A margem é a parcela do preço de venda que representa lucro, após os custos. Ela é diferente da remuneração pelo seu trabalho.</Text>
          <Text className="font-semibold text-gray-700 mb-2">Margem de lucro padrão (%)</Text>
          <TextInput className="bg-white border border-gray-300 rounded-xl p-3 text-gray-800" keyboardType="decimal-pad" placeholder="Ex.: 30" value={value} onChangeText={setValue} editable={!saving} />
          <Text className="text-gray-500 text-sm mt-2 mb-4">Será usada como ponto de partida na precificação e poderá ser personalizada. Deixe em branco para não definir um padrão.</Text>
          {valid && <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <Text className="font-semibold text-gray-700">Exemplo com custo de R$ 100,00</Text>
            <Text className="text-2xl font-bold text-indigo-700 mt-2">{formatCurrency(Math.ceil(10000 / (1 - margin / 100)))}</Text>
            <Text className="text-gray-500 text-sm">Preço de venda ilustrativo, sem taxas sobre vendas.</Text>
          </View>}
          {!!error && <Text className="text-red-600 mb-4">{error}</Text>}
          <TouchableOpacity disabled={saving} onPress={() => void save()} className="bg-indigo-600 rounded-xl p-4"><Text className="text-white font-bold text-center">{saving ? 'Salvando...' : 'Salvar margem'}</Text></TouchableOpacity>
        </FormScrollView>}
    </SafeAreaView>
  );
}
