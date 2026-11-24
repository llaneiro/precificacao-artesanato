import { useEffect } from 'react';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { Alert, ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { TipsCarousel, type Tip } from '../src/components/TipsCarousel';
import { usePricingForm } from '../src/hooks/usePricingForm';
import { formatCurrency } from '../src/utils/currency';

const TIPS: readonly Tip[] = [
  { title: 'Seu tempo tem valor', description: 'A mão de obra remunera seu trabalho. Ela não é o lucro do negócio, que será calculado separadamente.', icon: 'time-outline' },
  { title: 'Quanto você quer receber?', description: 'Se não souber quanto cobrar por hora, informe a remuneração mensal desejada e divida pelas horas produtivas do mês.', icon: 'wallet-outline' },
  { title: 'Considere apenas horas produtivas', description: 'Estime quanto tempo realmente dedica à produção das peças. Reserve tempo para atendimento, compras, organização e descanso.', icon: 'calendar-outline' },
  { title: 'Divida os custos mensais', description: 'As horas produtivas também ajudarão a distribuir as despesas fixas entre as peças, de acordo com o tempo de produção.', icon: 'bulb-outline', iconColor: '#d97706' },
];

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
          <TipsCarousel title="Dicas de mão de obra" tips={TIPS} />
          <Text className="text-gray-700 font-semibold mb-2">Como deseja definir sua remuneração?</Text>
          {([{ mode: 'hourly', label: 'Já sei quanto cobrar por hora' }, { mode: 'monthly', label: 'Quero calcular pela renda mensal desejada' }] as const).map(option => (
            <Pressable key={option.mode} disabled={form.saving} accessibilityRole="radio" accessibilityState={{ checked: form.mode === option.mode }}
              onPress={() => form.setMode(option.mode)}
              className={'rounded-xl border p-3 mb-2 ' + (form.mode === option.mode ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300')}>
              <Text className={form.mode === option.mode ? 'text-indigo-700 font-semibold' : 'text-gray-700'}>{option.label}</Text>
            </Pressable>
          ))}
          <Text className="text-gray-700 font-semibold mt-3 mb-2">{form.mode === 'hourly' ? 'Valor da hora (R$)' : 'Remuneração mensal desejada (R$)'}</Text>
          <TextInput className={inputClass} value={form.mode === 'hourly' ? form.hourly : form.monthly} onChangeText={form.mode === 'hourly' ? form.setHourly : form.setMonthly} keyboardType="decimal-pad" placeholder={form.mode === 'hourly' ? 'Ex.: 20,00' : 'Ex.: 2400,00'} editable={!form.saving} />
          <Text className="text-gray-700 font-semibold mb-2">Horas produtivas por mês</Text>
          <Text className="text-gray-500 text-sm mb-2">Ex.: 6 horas de produção por dia × 20 dias = 120 horas.</Text>
          <TextInput className={inputClass} value={form.hours} onChangeText={form.setHours} keyboardType="number-pad" placeholder="Ex.: 120" editable={!form.saving} />
          <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <Text className="text-gray-600">Remuneração por hora</Text>
            <Text className="text-2xl text-indigo-700 font-bold mt-1">{form.preview === null ? '—' : formatCurrency(Math.round(form.preview))}</Text>
            <Text className="text-gray-500 text-sm mt-1">Valor referente ao seu trabalho, sem materiais, despesas ou lucro.</Text>
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
