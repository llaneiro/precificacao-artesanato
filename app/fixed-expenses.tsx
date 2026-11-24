import { HelpLabel } from '../src/components/HelpTip';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../src/components/EmptyState';
import { ExpenseItem } from '../src/components/ExpenseItem';
import { useExpenses } from '../src/hooks/useExpenses';
import { usePricingSettings } from '../src/hooks/usePricingSettings';
import { Expense } from '../src/types/expense';
import { formatCurrency } from '../src/utils/currency';

export default function FixedExpensesScreen() {
  const router = useRouter();
  const { expenses, loading, error, totalMonthlyCostCents, loadExpenses, removeExpense } = useExpenses();
  const [deleting, setDeleting] = useState(false);
  const pricing = usePricingSettings();
  const [confirming, setConfirming] = useState(false);
  const noExpenses = pricing.settings?.noFixedExpenses === 1;
  const pending = !expenses.length && !noExpenses;
  async function confirmAbsence(confirmed: boolean) {
    setConfirming(true);
    try { await pricing.saveNoFixedExpenses(confirmed); }
    catch (e) { Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.'); }
    finally { setConfirming(false); }
  }

  function confirmDelete(expense: Expense) {
    Alert.alert('Excluir despesa', 'Deseja excluir "' + expense.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await removeExpense(expense.id);
          } catch {
            Alert.alert('Erro', 'Não foi possível excluir a despesa.');
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="flex-1 bg-gray-50">
      <FlatList
        data={error ? [] : expenses}
        keyExtractor={item => String(item.id)}
        refreshing={loading}
        onRefresh={() => void loadExpenses()}
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        ListHeaderComponent={(
          <View>

            <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
              <HelpLabel title="Total mensal" message="Some gastos recorrentes como energia, água, internet e aluguel. Se trabalha em casa, inclua apenas a parte do negócio. Não inclua materiais nem mão de obra." className="text-gray-600 font-medium" />
              <Text className="text-2xl text-indigo-700 font-bold mt-1">
                {error || loading || pricing.loading || pricing.error ? '—' : pending ? 'Não informado' : totalMonthlyCostCents === null ? 'Total acima do limite' : formatCurrency(totalMonthlyCostCents)}
              </Text>
            </View>
            {!loading && !error && !pricing.loading && !pricing.error && !expenses.length && (
              <View className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <Text className="font-semibold text-gray-800">{noExpenses ? 'Ausência de despesas confirmada' : 'Você possui despesas fixas?'}</Text>
                <Text className="text-gray-600 text-sm mt-2">{noExpenses ? 'Sem despesas fixas.' : 'Cadastre seus gastos ou confirme que não possui.'}</Text>
                <TouchableOpacity accessibilityRole="button" disabled={confirming || deleting} className="py-3" onPress={() => {
                  if (noExpenses) void confirmAbsence(false);
                  else Alert.alert('Confirmar ausência de despesas?', 'Confirme apenas se não existem gastos mensais relacionados à sua atividade artesanal.', [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Confirmar', onPress: () => void confirmAbsence(true) },
                  ]);
                }}>
                  <Text className="text-indigo-700 font-semibold">{confirming ? 'Salvando...' : noExpenses ? 'Desfazer confirmação' : 'Não tenho despesas fixas'}</Text>
                </TouchableOpacity>
              </View>
            )}
            {pricing.error && <TouchableOpacity onPress={() => void pricing.loadSettings()} className="p-3 mb-3"><Text className="text-red-600">Não foi possível verificar a configuração. Tentar novamente</Text></TouchableOpacity>}
            <TouchableOpacity disabled={deleting} onPress={() => router.push('/expense-form')} className="bg-indigo-600 rounded-xl p-4 mb-4">
              <Text className="text-white font-bold text-center">+ Nova despesa</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={error ? (
          <View className="items-center py-8">
            <Text className="text-red-600 text-center">{error}</Text>
            <TouchableOpacity onPress={() => void loadExpenses()} className="p-4">
              <Text className="text-indigo-600 font-semibold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" color="#4f46e5" />
        ) : (
          <EmptyState title="Nenhuma despesa cadastrada" subtitle="Toque em Nova despesa para começar." />
        )}
        renderItem={({ item }) => (
          <ExpenseItem expense={item} disabled={deleting}
            onEdit={id => router.push({ pathname: '/expense-form', params: { id: String(id) } })}
            onDelete={confirmDelete} />
        )}
      />
    </SafeAreaView>
  );
}
