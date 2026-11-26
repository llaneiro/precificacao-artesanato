import { HelpLabel } from '../src/components/HelpTip';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseItem } from '../src/components/ExpenseItem';
import { useExpenses } from '../src/hooks/useExpenses';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { Expense } from '../src/types/expense';
import { formatCurrency } from '../src/utils/currency';

export default function FixedExpensesScreen() {
  const router = useRouter();
  const { expenses, loading, error, totalMonthlyCostCents, loadExpenses, removeExpense } = useExpenses();
  const pricing = usePricingSettings(true, true);
  const [busy, setBusy] = useState(false);
  const operation = useRef(false);
  const noExpenses = pricing.settings?.noFixedExpenses === 1;
  const ready = !loading && !error && !pricing.loading && !pricing.error;
  const absent = ready && expenses.length === 0 && noExpenses;
  const pending = ready && expenses.length === 0 && !noExpenses;

  async function refresh() {
    await Promise.all([loadExpenses(), pricing.loadSettings()]);
  }

  async function confirmAbsence(confirmed: boolean) {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      await pricing.saveNoFixedExpenses(confirmed);
      await loadExpenses();
    } catch (e) {
      Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }

  function confirmDelete(expense: Expense) {
    Alert.alert('Excluir despesa', 'Deseja excluir "' + expense.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: async () => {
        if (operation.current) return;
        operation.current = true;
        setBusy(true);
        try {
          await removeExpense(expense.id);
          await pricing.loadSettings();
        } catch {
          Alert.alert('Erro', 'Não foi possível excluir a despesa.');
        } finally {
          operation.current = false;
          setBusy(false);
        }
      }},
    ]);
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <FlatList
        data={error ? [] : expenses}
        keyExtractor={item => String(item.id)}
        refreshing={loading || pricing.loading}
        onRefresh={() => void refresh()}
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 pb-4 pt-1 mb-5">
              <HelpLabel title="Total mensal" message="Inclua gastos recorrentes como energia, água, internet e aluguel. Se trabalha em casa, informe apenas a parte referente ao artesanato. Não inclua materiais nem mão de obra." className="text-indigo-900 font-medium" />
              <Text className="text-3xl text-indigo-700 font-bold">
                {!ready ? '—' : pending ? 'Não informado' : totalMonthlyCostCents === null ? 'Total acima do limite' : formatCurrency(totalMonthlyCostCents)}
              </Text>
              {ready && expenses.length > 0 && <Text className="text-indigo-800 text-sm mt-1">{expenses.length === 1 ? '1 despesa cadastrada' : expenses.length + ' despesas cadastradas'}</Text>}
            </View>
            {pricing.error && <Pressable accessibilityRole="button" onPress={() => void refresh()} className="bg-white border border-gray-200 rounded-xl p-3 mb-3">
              <Text className="text-gray-700 text-sm">Não foi possível verificar a configuração.</Text>
              <Text className="text-indigo-700 font-semibold mt-1">Tentar novamente</Text>
            </Pressable>}
            <View className="flex-row flex-wrap items-center justify-between gap-2 mb-3">
              <Text accessibilityRole="header" className="text-lg font-bold text-gray-800">Suas despesas</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => router.push('/expense-form')} className="bg-indigo-600 rounded-xl min-h-11 px-3 py-2 flex-row items-center justify-center gap-1 active:bg-indigo-700 disabled:opacity-50">
                <Ionicons name="add" size={21} color="#fff" />
                <Text className="text-white font-semibold text-sm">Nova despesa</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={error ? (
          <View className="bg-white rounded-2xl border border-gray-200 p-5 items-center">
            <Text className="text-gray-700 text-center">{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void refresh()} className="min-h-12 justify-center mt-1">
              <Text className="text-indigo-700 font-semibold">Tentar novamente</Text>
            </Pressable>
          </View>
        ) : loading || pricing.loading ? (
          <ActivityIndicator className="mt-8" color="#4f46e5" />
        ) : !pricing.error ? (
          <View className="bg-white rounded-2xl border border-gray-200 p-5 items-center">
            <View className={'w-14 h-14 rounded-2xl items-center justify-center mb-3 ' + (absent ? 'bg-green-50' : 'bg-indigo-50')}>
              <Ionicons name={absent ? 'checkmark-circle-outline' : 'receipt-outline'} size={29} color={absent ? '#15803d' : '#4f46e5'} />
            </View>
            <Text className="text-gray-800 font-bold text-base text-center">{absent ? 'Sem despesas fixas' : 'Nenhuma despesa cadastrada'}</Text>
            <Text className="text-gray-600 text-sm text-center mt-2 leading-5">{absent ? 'Você pode cadastrar uma despesa quando precisar.' : 'Adicione seus gastos mensais ou informe que não possui despesas fixas.'}</Text>
            <Pressable accessibilityRole="button" disabled={busy} className="min-h-12 justify-center px-3 mt-2 disabled:opacity-50" onPress={() => {
              if (absent) void confirmAbsence(false);
              else Alert.alert('Confirmar ausência de despesas?', 'Confirme apenas se não existem gastos mensais relacionados à sua atividade artesanal.', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Confirmar', onPress: () => void confirmAbsence(true) },
              ]);
            }}>
              <Text className="text-indigo-700 font-semibold text-center">{busy ? 'Salvando...' : absent ? 'Desfazer confirmação' : 'Não tenho despesas fixas'}</Text>
            </Pressable>
          </View>
        ) : undefined}
        renderItem={({ item, index }) => (
          <ExpenseItem expense={item} disabled={busy || loading} first={index === 0} last={index === expenses.length - 1}
            onEdit={id => router.push({ pathname: '/expense-form', params: { id: String(id) } })}
            onDelete={confirmDelete} />
        )}
      />
    </SafeAreaView>
  );
}
