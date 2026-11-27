import { formatNumber } from '../src/utils/numberDisplay';
import { MoneyInput } from '../src/components/MoneyInput';
import { HelpTip } from '../src/components/HelpTip';
import { useEffect, useState } from 'react';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { Alert, ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { usePricingForm } from '../src/hooks/usePricingForm';
import { formatCurrency } from '../src/utils/currency';
import { estimateProductiveHours, REFERENCE_DAYS, REFERENCE_DAILY_HOURS } from '../src/utils/workingHours';

const DAYS = [1, 2, 3, 4, 5, 6, 7];
const formatHours = formatNumber;

export default function LaborSettingsScreen() {
  const router = useRouter();
  const form = usePricingForm('labor');
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800';
  const [calculatorExpanded, setCalculatorExpanded] = useState(false);
  const [daysPerWeek, setDaysPerWeek] = useState(REFERENCE_DAYS);
  const [hoursPerDay, setHoursPerDay] = useState(REFERENCE_DAILY_HOURS);
  const estimate = estimateProductiveHours(daysPerWeek, hoursPerDay);

  function applyEstimate() {
    form.setHours(String(estimate.monthly));
    setCalculatorExpanded(false);
  }
  async function handleSave() { if (await form.save()) router.back(); }
  useEffect(() => { if (form.error) Alert.alert('Não foi possível salvar', form.error); }, [form.error]);

  function changeDailyHours(value: number) {
    setHoursPerDay(Math.min(12, Math.max(1, Math.round(value * 2) / 2)));
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={form.loading || !!form.loadError} saving={form.saving} onPress={() => void handleSave()} /> }} />
      {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.loadError ? (
        <View className="p-4"><Text className="text-red-600">{form.loadError}</Text><TouchableOpacity onPress={() => void form.loadSettings()} className="p-3"><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
          <View className="flex-row items-center justify-between mb-2">
            <Text accessibilityRole="header" className="flex-1 text-xl font-bold text-gray-900">Quanto deseja receber?</Text>
            <HelpTip title="Remuneração" message="É o valor pago pelo seu trabalho, separado do lucro. Você pode informar quanto quer receber por hora ou por mês. O valor mensal é dividido pelas horas produtivas." />
          </View>
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <View accessibilityRole="radiogroup" className="flex-row gap-2 mb-4">
              {([{ mode: 'monthly', label: 'Por mês' }, { mode: 'hourly', label: 'Por hora' }] as const).map(option => (
                <Pressable key={option.mode} disabled={form.saving} accessibilityRole="radio" accessibilityState={{ checked: form.mode === option.mode, disabled: form.saving }}
                  onPress={() => form.setMode(option.mode)}
                  className={'flex-1 min-h-12 rounded-xl border p-3 items-center justify-center ' + (form.mode === option.mode ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300')}>
                  <Text className={form.mode === option.mode ? 'text-indigo-700 font-semibold' : 'text-gray-700'}>{option.label}</Text>
                </Pressable>
              ))}
            </View>
            <Text className="text-gray-700 font-semibold mb-2">{form.mode === 'hourly' ? 'Valor da hora (R$)' : 'Valor mensal (R$)'}</Text>
            <MoneyInput accessibilityLabel={form.mode === 'hourly' ? 'Valor da hora em reais' : 'Remuneração mensal em reais'} className={inputClass} value={form.mode === 'hourly' ? form.hourly : form.monthly} onChangeText={form.mode === 'hourly' ? form.setHourly : form.setMonthly} placeholder={form.mode === 'hourly' ? 'Ex.: 20,00' : 'Ex.: 2400,00'} editable={!form.saving} />
          </View>
          <View className="flex-row items-center justify-between mb-2">
            <Text accessibilityRole="header" className="flex-1 text-xl font-bold text-gray-900">Tempo de produção</Text>
            <HelpTip title="Horas produtivas" message="Conte apenas o tempo dedicado à produção das peças, sem pausas ou outras atividades. Essas horas distribuem as despesas fixas e, se você escolheu receber por mês, ajudam a calcular o valor da sua hora." />
          </View>

          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <Text className="text-gray-600 text-sm leading-5 mb-3">Quantas horas você dedica ao artesanato por mês?</Text>
            <TextInput accessibilityLabel="Horas produtivas por mês" className={inputClass} value={form.hours} onChangeText={form.setHours} keyboardType="number-pad" placeholder="Horas mensais" editable={!form.saving} />

            <Pressable accessibilityRole="button" accessibilityState={{ expanded: calculatorExpanded, disabled: form.saving }} disabled={form.saving}
              onPress={() => setCalculatorExpanded(value => !value)}
              className="flex-row items-center gap-2 min-h-12 px-1 pt-3">
              <Ionicons name="calculator-outline" size={21} color="#4f46e5" />
              <Text className="flex-1 text-indigo-700 font-semibold text-sm">Não sei calcular minhas horas</Text>
              <Ionicons name={calculatorExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" />
            </Pressable>

            {calculatorExpanded && (
              <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 mt-3">
                <Text className="text-gray-800 font-semibold mb-3">Dias por semana</Text>
                <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2 mb-4">
                  {DAYS.map(day => (
                    <Pressable key={day} accessibilityRole="radio" accessibilityLabel={day + (day === 1 ? ' dia por semana' : ' dias por semana')} accessibilityState={{ checked: daysPerWeek === day, disabled: form.saving }} disabled={form.saving}
                      onPress={() => setDaysPerWeek(day)}
                      className={'min-w-11 min-h-12 rounded-xl items-center justify-center border px-2 ' + (daysPerWeek === day ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-indigo-100')}>
                      <Text className={'font-semibold text-base ' + (daysPerWeek === day ? 'text-white' : 'text-gray-700')}>{day}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="text-gray-800 font-semibold mb-2">Horas produtivas por dia</Text>
                <View className="flex-row items-center justify-between gap-3">
                  <Pressable accessibilityRole="button" accessibilityLabel="Diminuir meia hora" disabled={form.saving || hoursPerDay <= 1} onPress={() => changeDailyHours(hoursPerDay - 0.5)} className="w-12 h-12 rounded-xl bg-white items-center justify-center disabled:opacity-40">
                    <Ionicons name="remove" size={24} color="#4f46e5" />
                  </Pressable>
                  <Text className="text-2xl font-bold text-indigo-700">{formatHours(hoursPerDay)} h</Text>
                  <Pressable accessibilityRole="button" accessibilityLabel="Aumentar meia hora" disabled={form.saving || hoursPerDay >= 12} onPress={() => changeDailyHours(hoursPerDay + 0.5)} className="w-12 h-12 rounded-xl bg-white items-center justify-center disabled:opacity-40">
                    <Ionicons name="add" size={24} color="#4f46e5" />
                  </Pressable>
                </View>
                <Slider accessibilityLabel="Horas produtivas por dia" style={{ width: '100%', height: 44 }} minimumValue={1} maximumValue={12} step={0.5} value={hoursPerDay} disabled={form.saving} onValueChange={changeDailyHours} minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#c7d2fe" thumbTintColor="#4f46e5" />
                <View className="border-t border-indigo-100 pt-3 mt-2">
                  <Text className="text-indigo-800 text-sm font-medium">Horas mensais estimadas</Text>
                  <Text className="text-3xl font-bold text-indigo-700 mt-1">≈ {estimate.monthly} h</Text>
                  <Pressable accessibilityRole="button" disabled={form.saving} onPress={applyEstimate} className="bg-indigo-600 rounded-xl min-h-12 px-3 py-3 mt-3 items-center justify-center active:bg-indigo-700">
                    <Text className="text-white font-semibold">Usar essas horas</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>
          {form.mode === 'monthly' && <View className="bg-indigo-50 rounded-xl p-4 mb-4">
            <Text className="text-indigo-800 text-sm font-medium">Remuneração por hora</Text>
            <Text className="text-2xl text-indigo-700 font-bold mt-1">{form.preview === null ? '—' : formatCurrency(Math.round(form.preview))}</Text>
          </View>}
          {!!form.error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{form.error}</Text>}
          <TouchableOpacity accessibilityRole="button" disabled={form.saving} onPress={() => void handleSave()} className="bg-indigo-600 rounded-xl p-4">
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar mão de obra'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
