import { HelpLabel } from '../src/components/HelpTip';
import { useEffect } from 'react';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { Alert, ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { usePricingForm } from '../src/hooks/usePricingForm';
import { formatCurrency } from '../src/utils/currency';

export default function LaborSettingsScreen() {
  const router = useRouter();
  const form = usePricingForm('labor');
  const inputClass = 'bg-white border border-gray-300 rounded-xl p-3 text-gray-800 mb-4';
  async function handleSave() { if (await form.save()) router.back(); }
  useEffect(() => { if (form.error) Alert.alert('Não foi possível salvar', form.error); }, [form.error]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={form.loading || !!form.loadError} saving={form.saving} onPress={() => void handleSave()} /> }} />
      {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.loadError ? (
        <View className="p-4"><Text className="text-red-600">{form.loadError}</Text><TouchableOpacity onPress={() => void form.loadSettings()} className="p-3"><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>

          <HelpLabel title="Remuneração" message="Escolha quanto quer receber por hora ou por mês. O lucro do negócio é separado." className="text-gray-700 font-semibold" />
          {([{ mode: 'hourly', label: 'Por hora' }, { mode: 'monthly', label: 'Por mês' }] as const).map(option => (
            <Pressable key={option.mode} disabled={form.saving} accessibilityRole="radio" accessibilityState={{ checked: form.mode === option.mode }}
              onPress={() => form.setMode(option.mode)}
              className={'rounded-xl border p-3 mb-2 ' + (form.mode === option.mode ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300')}>
              <Text className={form.mode === option.mode ? 'text-indigo-700 font-semibold' : 'text-gray-700'}>{option.label}</Text>
            </Pressable>
          ))}
          <Text className="text-gray-700 font-semibold mt-3 mb-2">{form.mode === 'hourly' ? 'Valor da hora (R$)' : 'Remuneração mensal desejada (R$)'}</Text>
          <TextInput className={inputClass} value={form.mode === 'hourly' ? form.hourly : form.monthly} onChangeText={form.mode === 'hourly' ? form.setHourly : form.setMonthly} keyboardType="decimal-pad" placeholder={form.mode === 'hourly' ? 'Ex.: 20,00' : 'Ex.: 2400,00'} editable={!form.saving} />
          <HelpLabel title="Horas produtivas por mês" message="Conte só o tempo de produção. Ex.: 6 h × 20 dias = 120 h. Essas horas distribuem as despesas fixas." className="text-gray-700 font-semibold" />
          <TextInput className={inputClass} value={form.hours} onChangeText={form.setHours} keyboardType="number-pad" placeholder="Ex.: 120" editable={!form.saving} />
          <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-600">Remuneração por hora</Text>
            <Text className="text-2xl text-indigo-700 font-bold mt-1">{form.preview === null ? '—' : formatCurrency(Math.round(form.preview))}</Text>

          </View>
          {!!form.error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{form.error}</Text>}
          <TouchableOpacity disabled={form.saving} onPress={() => void handleSave()} className="bg-indigo-600 rounded-xl p-4">
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar mão de obra'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
