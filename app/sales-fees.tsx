import { FormScrollView } from '../src/components/FormScrollView';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { TipsCarousel, type Tip } from '../src/components/TipsCarousel';
import { usePricingForm } from '../src/hooks/usePricingForm';

const TIPS: readonly Tip[] = [
  { title: 'O que são taxas sobre vendas?', description: 'São os percentuais descontados do valor recebido quando você vende por uma maquininha ou outro meio de pagamento.', icon: 'card-outline' },
  { title: 'Consulte sua operadora', description: 'Débito, crédito à vista e Pix podem ter taxas diferentes. Confira os percentuais contratados antes de preenchê-los.', icon: 'receipt-outline' },
  { title: 'Receba o valor planejado', description: 'A taxa incide sobre o preço de venda. Ela será considerada na precificação para não reduzir o valor que você pretende receber.', icon: 'bulb-outline', iconColor: '#d97706' },
];

export default function SalesFeesScreen() {
  const router = useRouter();
  const form = usePricingForm('fees');
  const fields = [
    { label: 'Débito', value: form.debit, change: form.setDebit },
    { label: 'Crédito à vista', value: form.credit, change: form.setCredit },
    { label: 'Pix', value: form.pix, change: form.setPix },
  ];
  async function handleSave() { if (await form.save()) router.back(); }
  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.loadError ? (
        <View className="p-4"><Text className="text-red-600">{form.loadError}</Text><TouchableOpacity onPress={() => void form.loadSettings()} className="p-3"><Text className="text-indigo-600">Tentar novamente</Text></TouchableOpacity></View>
      ) : (
        <FormScrollView contentContainerStyle={{ padding: 16 }}>
          <TipsCarousel title="Dicas de taxas" tips={TIPS} />
          <Text className="text-gray-600 mb-4">Informe a taxa percentual de cada forma de pagamento. Deixe em branco se não utiliza ou ainda não conhece a taxa. Use 0 se não houver cobrança.</Text>
          {fields.map(field => (
            <View key={field.label} className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2">{field.label} (%)</Text>
              <TextInput className="bg-white border border-gray-300 rounded-xl p-3 text-gray-800" value={field.value} onChangeText={field.change} keyboardType="decimal-pad" placeholder="Ex.: 2,99" editable={!form.saving} />
            </View>
          ))}
          {!!form.error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{form.error}</Text>}
          <TouchableOpacity disabled={form.saving} onPress={() => void handleSave()} className="bg-indigo-600 rounded-xl p-4">
            <Text className="text-white font-bold text-center">{form.saving ? 'Salvando...' : 'Salvar taxas'}</Text>
          </TouchableOpacity>
        </FormScrollView>
      )}
    </SafeAreaView>
  );
}
