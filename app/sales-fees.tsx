import { useEffect } from 'react';
import { Alert, ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { usePricingForm } from '../src/hooks/usePricingForm';
import { PAYMENT_METHODS, PaymentChoice } from '../src/types/pricingSettings';

const OPTIONS = [
  { value: 'free', label: 'Não pago taxa' },
  { value: 'charged', label: 'Pago uma taxa' },
  { value: 'unused', label: 'Não utilizo' },
] as const;

const STATUS: Record<PaymentChoice, string> = {
  pending: 'Não configurado',
  free: 'Sem cobrança de taxa',
  charged: 'Possui taxa',
  unused: 'Não utilizado',
};

export default function SalesFeesScreen() {
  const router = useRouter();
  const form = usePricingForm('fees');
  async function handleSave() { if (await form.save()) router.back(); }
  useEffect(() => { if (form.error) Alert.alert('Não foi possível salvar', form.error); }, [form.error]);

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={form.loading || !!form.loadError} saving={form.saving} onPress={() => void handleSave()} /> }} />
      {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.loadError ? (
        <View className="p-4"><Text className="text-red-600">{form.loadError}</Text><TouchableOpacity onPress={() => void form.loadSettings()} className="p-3"><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-gray-600 mb-4 leading-6">Configure as formas de pagamento que você aceita no seu negócio. As taxas informadas serão consideradas no preço de venda.</Text>
          {PAYMENT_METHODS.map(method => {
            const draft = form.payments[method.key];
            return (
              <View key={method.key} className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="bg-indigo-50 w-11 h-11 rounded-xl items-center justify-center">
                    <Ionicons name={method.icon} size={24} color="#4f46e5" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-bold text-gray-800 text-base">{method.name}</Text>
                    <Text className={'text-sm mt-1 ' + (draft.choice === 'free' ? 'text-green-700' : draft.choice === 'charged' ? 'text-indigo-700' : 'text-gray-500')}>{STATUS[draft.choice]}</Text>
                  </View>
                </View>
                {OPTIONS.map(option => {
                  const selected = draft.choice === option.value;
                  return (
                    <Pressable key={option.value} accessibilityRole="radio" accessibilityLabel={method.name + ': ' + option.label} accessibilityState={{ checked: selected, disabled: form.saving }} disabled={form.saving}
                      onPress={() => form.setPaymentChoice(method.key, option.value)}
                      className={'flex-row items-center gap-3 py-3 px-3 rounded-lg mb-1 ' + (selected ? 'bg-indigo-50' : 'bg-white')}>
                      <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={21} color={selected ? '#4f46e5' : '#9ca3af'} />
                      <Text className={selected ? 'text-indigo-700 font-semibold' : 'text-gray-700'}>{option.label}</Text>
                    </Pressable>
                  );
                })}
                {draft.choice === 'charged' && <View className="border-t border-gray-100 pt-3 mt-2">
                  <Text className="text-gray-700 font-semibold mb-2">Taxa por venda (%)</Text>
                  <TextInput accessibilityLabel={'Taxa de ' + method.name} className="bg-white border border-gray-300 rounded-xl p-3 text-gray-800" value={draft.fee} onChangeText={value => form.setPaymentFee(method.key, value)} keyboardType="decimal-pad" placeholder="Ex.: 2,99" editable={!form.saving} />
                  <Text className="text-gray-500 text-sm mt-2">Informe o percentual cobrado pela sua instituição.</Text>
                </View>}
                {draft.choice !== 'pending' && <Pressable accessibilityRole="button" disabled={form.saving} onPress={() => form.setPaymentChoice(method.key, 'pending')} className="pt-3 pb-1">
                  <Text className="text-gray-500 text-sm">Limpar configuração</Text>
                </Pressable>}
              </View>
            );
          })}
          <Text className="text-gray-500 text-sm mb-4">Você pode configurar os demais pagamentos depois. Sem uma definição, o preço para aquele meio ficará pendente.</Text>
          {!!form.error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{form.error}</Text>}
          <TouchableOpacity disabled={form.saving} onPress={() => void handleSave()} className="bg-indigo-600 rounded-xl p-4">
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar configurações'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
