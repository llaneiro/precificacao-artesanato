import { HelpLabel } from '../src/components/HelpTip';
import { useEffect } from 'react';
import { Alert, ActivityIndicator, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { usePricingForm } from '../src/hooks/usePricingForm';
import { PAYMENT_METHODS } from '../src/types/pricingSettings';

const OPTIONS = [
  { value: 'free', label: 'Sem taxa' },
  { value: 'charged', label: 'Com taxa' },
  { value: 'unused', label: 'Não utilizo' },
] as const;

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
          <HelpLabel title="Como seus clientes pagam?" message="Consulte as taxas da sua maquininha ou instituição financeira. O aplicativo ajusta o preço de venda para compensar essas cobranças. Se ainda não souber uma taxa, deixe o meio de pagamento sem configurar. Para desfazer uma escolha, toque novamente na opção selecionada." className="text-xl font-bold text-gray-900" />
          <Text className="text-gray-600 text-sm leading-5 mb-4">Configure os meios de pagamento e suas taxas.</Text>
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            {PAYMENT_METHODS.map((method, index) => {
              const draft = form.payments[method.key];
              return (
                <View key={method.key} className={index > 0 ? 'border-t border-gray-200 pt-4 mt-4' : ''}>
                  <View className="flex-row items-center gap-3 mb-3">
                    <View className="bg-indigo-50 w-10 h-10 rounded-xl items-center justify-center">
                      <Ionicons name={method.icon} size={23} color="#4f46e5" />
                    </View>
                    <Text className="flex-1 font-semibold text-gray-800 text-base">{method.name}</Text>
                  </View>
                  <View accessibilityRole="radiogroup" accessibilityLabel={'Opções para ' + method.name} className="flex-row gap-2">
                    {OPTIONS.map(option => {
                      const selected = draft.choice === option.value;
                      return (
                        <Pressable key={option.value} accessibilityRole="radio"
                          accessibilityLabel={method.name + ': ' + option.label}
                          accessibilityHint={selected ? 'Toque novamente para deixar sem configurar.' : undefined}
                          accessibilityState={{ checked: selected, disabled: form.saving }} disabled={form.saving}
                          onPress={() => form.setPaymentChoice(method.key, selected ? 'pending' : option.value)}
                          className={'flex-1 min-h-12 rounded-lg border px-1 py-2 items-center justify-center ' + (selected ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200')}>
                          <Text className={'text-sm text-center ' + (selected ? 'text-indigo-700 font-semibold' : 'text-gray-600')}>{option.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {draft.choice === 'charged' && (
                    <View className="flex-row flex-wrap items-center gap-2 mt-3">
                      <Text className="flex-1 text-gray-700 text-sm font-medium">Taxa por venda</Text>
                      <TextInput accessibilityLabel={'Taxa de ' + method.name + ' em porcentagem'} className="w-28 min-h-12 bg-white border border-gray-300 rounded-xl px-3 py-2 text-gray-800 text-center" value={draft.fee} onChangeText={value => form.setPaymentFee(method.key, value)} keyboardType="decimal-pad" placeholder="Ex.: 2,99" editable={!form.saving} />
                      <Text className="text-gray-600 font-medium">%</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {!!form.error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{form.error}</Text>}
          <TouchableOpacity disabled={form.saving} onPress={() => void handleSave()} className="bg-indigo-600 rounded-xl p-4">
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar configurações'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
