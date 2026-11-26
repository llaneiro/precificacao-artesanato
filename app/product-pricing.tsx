import { HelpLabel } from '../src/components/HelpTip';
import { useState } from 'react';
import Slider from '@react-native-community/slider';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { HeaderSaveButton } from '../src/components/HeaderSaveButton';
import { FormScrollView } from '../src/components/FormScrollView';
import { ManualPricingPanel } from '../src/components/ManualPricingPanel';
import { useProductPricing } from '../src/hooks/useProductPricing';
import { getProductPhotoUri } from '../src/services/productPhoto';
import { formatProductionDuration } from '../src/utils/productCatalog';
import { money, percent, PricingRow, PricingSection, SuggestedResult, PaymentPriceRow } from '../src/components/PricingDisplay';

export default function ProductPricingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const form = useProductPricing(id);
  const [expanded, setExpanded] = useState(false);
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const uri = getProductPhotoUri(form.product?.photoFilename ?? null);
  const r = form.result;
  const manual = form.mode === 'manual';
  const issues = manual ? r?.costIssues ?? [] : r?.issues ?? [];
  async function save() {
    try {
      const recordId = await form.saveHistory();
      if (recordId !== null) router.push({ pathname: '/pricing-history-details', params: { id: String(recordId) } });
    } catch (e) { Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.'); }
  }
  return <SafeAreaView edges={['bottom','left','right']} className="flex-1 bg-gray-50">
    <Stack.Screen options={{ headerRight: () => <HeaderSaveButton disabled={!form.canSave} saving={form.saving} onPress={() => void save()} /> }} />
    {form.loading ? <ActivityIndicator className="mt-8" color="#4f46e5" /> : form.error || !form.product || !r ? <Text className="p-4 text-gray-600">{form.error || 'Não foi possível calcular este produto.'}</Text> :
      <FormScrollView contentContainerStyle={{ padding: 16 }}>
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-14 h-14 rounded-xl bg-indigo-50 overflow-hidden items-center justify-center">
            {uri && failedUri !== uri ? <Image source={{ uri }} onError={() => setFailedUri(uri)} className="w-full h-full" resizeMode="cover" /> : <Ionicons name="cube-outline" size={28} color="#818cf8" />}
          </View>
          <View className="flex-1"><Text className="text-xl font-bold text-gray-900">{form.product.name}</Text><Text className="text-gray-500 text-xs mt-1">{formatProductionDuration(form.product.productionMinutes)} de confecção</Text></View>
        </View>
        <View className="flex-row bg-gray-200 rounded-xl p-1 mb-4">
          {([{ mode: 'suggested', label: 'Preço sugerido' }, { mode: 'manual', label: 'Preço manual' }] as const).map(option => (
            <Pressable key={option.mode} accessibilityRole="tab" accessibilityState={{ selected: form.mode === option.mode }} onPress={() => form.setMode(option.mode)}
              className={'flex-1 rounded-lg py-3 px-2 items-center ' + (form.mode === option.mode ? 'bg-white' : '')}>
              <Text className={'text-sm font-semibold ' + (form.mode === option.mode ? 'text-indigo-700' : 'text-gray-600')}>{option.label}</Text>
            </Pressable>
          ))}
        </View>
        <PricingSection title={r.costIssues.length ? 'Subtotal conhecido' : 'Custo de produção'} value={money(r.costIssues.length ? r.knownTotal : r.total)} expanded={expanded} onToggle={() => setExpanded(v => !v)}>
          <PricingRow label="Materiais" value={money(r.materials)} />
          <PricingRow label="Mão de obra" value={money(r.labor)} />
          <PricingRow label="Despesas fixas (rateio)" value={money(r.fixed)} />
          <PricingRow label="Despesas adicionais" value={money(r.additional)} />
        </PricingSection>
        {!!issues.length && <View className="bg-amber-50 rounded-xl p-4 mb-4">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle-outline" size={22} color="#92400e" />
            <Text className="font-semibold text-amber-900 flex-1">Complete suas informações</Text>
          </View>
          <Text className="text-amber-900 mt-2">Resolva as pendências para calcular o lucro.</Text>
          {issues.map(issue => <View key={issue.code} className="mt-3">
            <Text className="text-amber-900">{issue.message}</Text>
            {issue.code !== 'range' && <Pressable accessibilityRole="button" className="py-2" onPress={() => {
              if (issue.code === 'labor') router.push('/labor-settings');
              else if (issue.code === 'fixed') router.push('/fixed-expenses');
              else if (issue.code === 'margin') router.push('/profit-margin');
              else router.push({ pathname: '/product-form', params: { id: String(form.product!.id) } });
            }}>
              <Text className="font-semibold text-indigo-700">{issue.code === 'labor' ? 'Configurar mão de obra' : issue.code === 'fixed' ? 'Revisar despesas fixas' : issue.code === 'margin' ? 'Definir margem padrão' : 'Revisar produto'}</Text>
            </Pressable>}
          </View>)}
        </View>}
        {manual ? <ManualPricingPanel form={form} onConfigurePayments={() => router.push('/sales-fees')} /> : <>
          <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <View className="flex-1"><HelpLabel title="Margem desejada" message="Percentual do valor líquido que sobra como lucro. Este ajuste vale apenas para a simulação." className="font-semibold text-gray-800" /></View>
              <View className="flex-row items-center gap-1">
                <TextInput accessibilityLabel="Margem desejada em porcentagem" className="w-24 min-h-12 border border-gray-300 rounded-xl px-2 py-2 text-xl font-bold text-indigo-700 text-center"
                  value={form.marginText} placeholder="—" keyboardType="decimal-pad" editable={!form.saving} onChangeText={form.setOverride} />
                <Text className="text-indigo-700 font-semibold">%</Text>
              </View>
            </View>
            <Slider style={{ width: '100%', height: 44 }} minimumValue={0} maximumValue={99} step={1}
              value={Math.min(99, (form.margin ?? 0) / 100)} onValueChange={value => form.setOverride(String(Math.round(value)))}
              disabled={form.saving} minimumTrackTintColor="#4f46e5" maximumTrackTintColor="#d1d5db" thumbTintColor="#4f46e5" accessibilityLabel="Margem de lucro" />
            <View className="flex-row justify-between"><Text className="text-gray-500 text-xs">0%</Text><Text className="text-gray-500 text-xs">99%</Text></View>
            <View className="flex-row flex-wrap items-center justify-between gap-2 mt-2">
              <Text className="text-gray-500 text-xs flex-1">Margem padrão: {form.defaultMargin === null ? 'não definida' : percent(form.defaultMargin / 100)}</Text>
              {form.override !== null && <Pressable accessibilityRole="button" disabled={form.saving} onPress={() => form.setOverride(null)} className="min-h-11 justify-center"><Text className="text-indigo-700 text-sm font-semibold">Restaurar</Text></Pressable>}
            </View>
            {form.margin === null && <Pressable accessibilityRole="button" disabled={form.saving} onPress={() => form.setOverride('20')} className="min-h-11 justify-center"><Text className="text-indigo-700 font-semibold">Usar 20% para simular</Text></Pressable>}
          </View>
          <SuggestedResult base={r.base} total={r.total} labor={r.labor} profit={r.profit} />
          <HelpLabel title="Quanto cobrar do cliente?" message="As taxas são incluídas no preço para preservar o mesmo lucro líquido. A margem é calculada sobre o valor recebido depois da taxa." className="text-lg font-bold text-gray-800" />
          {!r.payments.length ? <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
            <Text className="text-gray-600">Nenhuma forma de pagamento ativa.</Text>
            <Pressable accessibilityRole="button" className="min-h-11 justify-center" onPress={() => router.push('/sales-fees')}><Text className="text-indigo-700 font-semibold">Configurar formas de pagamento</Text></Pressable>
          </View> : <>
            <View className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              {r.payments.map((p, i) => <PaymentPriceRow key={p.key} first={i === 0} name={p.name} method={p.key} price={p.price}
                subtitle={p.status === 'missingFee' ? 'Taxa não configurada' : p.status === 'incomplete' ? 'Cálculo incompleto' : p.status === 'outOfRange' ? 'Preço acima do limite suportado' : p.fee === 0 ? 'Sem taxa' : 'Taxa de ' + percent(p.fee! / 100)}
                action={p.status === 'missingFee' ? () => router.push('/sales-fees') : undefined} />)}
            </View>
            <Text className="text-gray-500 text-xs mt-2 mb-4">Os preços consideram as taxas para preservar o mesmo lucro.</Text>
          </>}
        </>}

        <Pressable accessibilityRole="button" accessibilityState={{ disabled: !form.canSave || form.saving }} disabled={!form.canSave || form.saving} onPress={() => void save()} className={'rounded-xl p-4 items-center flex-row justify-center gap-2 ' + (!form.canSave || form.saving ? 'bg-gray-300' : 'bg-indigo-600')}>
          {form.saving ? <ActivityIndicator color="#fff" /> : <Ionicons name="save-outline" size={20} color="#fff" />}
          <Text className="text-white font-bold">{form.saving ? 'Salvando...' : 'Salvar precificação'}</Text>
        </Pressable>
        {!form.canSave && <Text className="text-gray-500 text-xs mt-2 text-center">Complete o cálculo para salvar.</Text>}
        <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/pricing-history', params: { productId: String(form.product!.id), productName: form.product!.name } })} className="items-center py-4">
          <Text className="text-indigo-700 font-semibold">Ver histórico deste produto</Text>
        </Pressable>
      </FormScrollView>}
  </SafeAreaView>;
}
