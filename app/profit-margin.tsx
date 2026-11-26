import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { FormScrollView } from '../src/components/FormScrollView';
import { HelpTip } from '../src/components/HelpTip';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { centsToInput, formatCurrency } from '../src/utils/currency';
import { parseMargin } from '../src/utils/pricingInputs';
import { basePriceForMargin } from '../src/utils/pricing';

const PRESETS = [10, 20, 30, 40, 50];
const EXAMPLE_COST = 10000;
const SLIDER_MAX = 90;

export default function ProfitMarginScreen() {
  const router = useRouter();
  const { settings, loading, error: loadError, loadSettings, saveMargin } = usePricingSettings(false);
  const [value, setValue] = useState('30');
  const [defined, setDefined] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  useEffect(() => { void loadSettings(); }, [loadSettings]);
  useEffect(() => {
    if (!loading && !loadError) {
      const saved = settings?.marginBps;
      setDefined(saved != null);
      setValue(saved == null ? '30' : centsToInput(saved));
    }
  }, [settings, loading, loadError]);

  let draftBps: number | null = null;
  try { draftBps = parseMargin(value); } catch {}
  const marginBps = defined ? draftBps : null;
  const sale = basePriceForMargin(EXAMPLE_COST, marginBps);
  const profit = sale === null ? null : sale - EXAMPLE_COST;
  const costShare = sale === null ? 100 : EXAMPLE_COST / sale * 100;

  function changeValue(next: string) {
    setValue(next);
    setDefined(true);
    setError('');
  }

  async function save() {
    if (busy.current || loading || loadError) return;
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      if (defined && !value.trim()) throw new Error('Informe uma margem ou marque “Prefiro definir depois”.');
      await saveMargin(defined ? value : '');
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar a margem.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }
  useEffect(() => { if (error) Alert.alert('Não foi possível salvar', error); }, [error]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={loading || !!loadError} saving={saving} onPress={() => void save()} /> }} />
      {loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : loadError ? (
        <View className="p-4"><Text className="text-red-600">{loadError}</Text><TouchableOpacity onPress={() => void loadSettings()}><Text className="text-indigo-600 p-3">Tentar novamente</Text></TouchableOpacity></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View className="flex-row items-center justify-between">
            <Text accessibilityRole="header" className="flex-1 text-xl font-bold text-gray-900">Quanto deseja lucrar?</Text>
            <HelpTip title="Margem de lucro" message="É a porcentagem do valor líquido da venda que sobra depois dos custos, inclusive sua mão de obra. Você pode definir qualquer margem de 0% a 99,99% pelo campo numérico." />
          </View>
          <Text className="text-gray-600 text-sm leading-5 mb-4">Defina uma margem inicial para suas precificações. Você poderá ajustá-la em cada produto.</Text>
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="flex-1 text-gray-700 font-semibold">Margem desejada</Text>
              <View className="flex-row items-center gap-1">
                <TextInput accessibilityLabel="Margem de lucro desejada em porcentagem" className={'w-28 min-h-12 rounded-xl border px-2 py-2 text-xl font-bold text-center ' + (defined ? 'bg-white border-gray-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-400')}
                  value={defined ? value : ''} placeholder={defined ? 'Ex.: 30' : '—'} keyboardType="decimal-pad" onChangeText={changeValue} editable={defined && !saving} />
                <Text className="text-indigo-700 font-bold text-lg">%</Text>
              </View>
            </View>
            <Slider accessibilityLabel="Ajustar margem de lucro" style={{ width: '100%', height: 44 }}
              minimumValue={0} maximumValue={SLIDER_MAX} step={1}
              value={Math.min(SLIDER_MAX, (draftBps ?? 0) / 100)}
              disabled={!defined || saving}
              onValueChange={next => changeValue(String(Math.round(next)))}
              minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#d1d5db" thumbTintColor={defined ? '#4f46e5' : '#9ca3af'} />
            <View className="flex-row justify-between mb-3">
              <Text className="text-gray-500 text-xs">0%</Text>
              <Text className="text-gray-500 text-xs">{SLIDER_MAX}%</Text>
            </View>
            <View className="flex-row gap-2 mb-3">
              {PRESETS.map(preset => {
                const selected = marginBps === preset * 100;
                return (
                  <Pressable key={preset} accessibilityRole="button" accessibilityLabel={'Usar margem de ' + preset + ' por cento'} accessibilityState={{ selected, disabled: saving }} disabled={saving}
                    onPress={() => changeValue(String(preset))} className={'flex-1 min-h-11 items-center justify-center border rounded-lg px-1 ' + (selected ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200')}>
                    <Text className={'text-sm font-medium ' + (selected ? 'text-indigo-700' : 'text-gray-600')}>{preset}%</Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: !defined, disabled: saving }} disabled={saving}
              onPress={() => { setDefined(current => !current); setError(''); }} className="flex-row items-center gap-3 border-t border-gray-100 pt-3 min-h-12">
              <Ionicons name={defined ? 'square-outline' : 'checkbox'} size={24} color={defined ? '#9ca3af' : '#4f46e5'} />
              <Text className="flex-1 text-gray-700">Prefiro definir depois</Text>
            </Pressable>
          </View>

          {sale !== null && profit !== null && (
            <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="bulb-outline" size={21} color="#4f46e5" />
                <Text className="font-semibold text-gray-800">Veja como funciona</Text>
              </View>
              <Text className="text-gray-600 text-sm leading-5 mb-3">Imagine um produto que custa R$ 100,00 para produzir.</Text>
              <View className="bg-indigo-50 rounded-xl p-3 mb-4">
                <Text className="text-indigo-800 text-sm">Preço sugerido de venda</Text>
                <Text className="text-2xl font-bold text-indigo-700 mt-1">{formatCurrency(sale)}</Text>
              </View>
              <View accessible accessibilityLabel={'Custo de produção: ' + formatCurrency(EXAMPLE_COST) + '; lucro: ' + formatCurrency(profit)} className="flex-row h-3.5 rounded-full overflow-hidden mb-3">
                <View style={{ flex: costShare, backgroundColor: '#9ca3af' }} />
                {profit > 0 && <View style={{ flex: 100 - costShare, backgroundColor: '#22c55e' }} />}
              </View>
              <View className="flex-row items-center gap-2 mb-2">
                <View className="w-2.5 h-2.5 rounded-sm bg-gray-400" />
                <Text className="flex-1 text-gray-600 text-sm">Custo de produção</Text>
                <Text className="text-gray-800 font-medium">{formatCurrency(EXAMPLE_COST)}</Text>
              </View>
              <View className="flex-row items-center gap-2">
                <View className="w-2.5 h-2.5 rounded-sm bg-green-500" />
                <Text className="flex-1 text-gray-600 text-sm">Seu lucro</Text>
                <Text className="text-green-700 font-semibold">{formatCurrency(profit)}</Text>
              </View>
              <Text className="text-gray-500 text-xs mt-3">Exemplo sem taxas de pagamento.</Text>
            </View>
          )}
          {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
          <TouchableOpacity disabled={saving} onPress={() => void save()} className="bg-indigo-600 rounded-xl p-4">
            <Text className="text-white font-bold text-center">{saving ? 'Salvando...' : 'Salvar margem'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
