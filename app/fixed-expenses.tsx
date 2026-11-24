import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../src/components/EmptyState';
import { ExpenseItem } from '../src/components/ExpenseItem';
import { TipsCarousel, type Tip } from '../src/components/TipsCarousel';
import { useExpenses } from '../src/hooks/useExpenses';
import { Expense } from '../src/types/expense';
import { formatCurrency } from '../src/utils/currency';

const EXPENSE_TIPS: readonly Tip[] = [
  {
    title: 'O que são despesas fixas?',
    description: 'São os gastos recorrentes que ajudam a manter sua atividade artesanal funcionando, mesmo quando você não vende nenhuma peça.',
    icon: 'bulb-outline',
    iconColor: '#d97706',
  },
  {
    title: 'Quais despesas incluir?',
    description: 'Energia elétrica, água, internet, aluguel do espaço, mensalidades de aplicativos e serviços utilizados no seu negócio.',
    icon: 'receipt-outline',
    iconColor: '#4f46e5',
  },
  {
    title: 'Você trabalha em casa?',
    description: 'Não precisa incluir o valor inteiro das contas da sua casa. Estime apenas a parcela relacionada à sua atividade artesanal.',
    icon: 'home-outline',
    iconColor: '#0d9488',
  },
  {
    title: 'O que não incluir aqui?',
    description: 'Matérias-primas, embalagens individuais, mão de obra e taxas percentuais da maquininha serão consideradas em outras etapas da precificação.',
    icon: 'cube-outline',
    iconColor: '#4f46e5',
  },
];

export default function FixedExpensesScreen() {
  const router = useRouter();
  const { expenses, loading, error, totalMonthlyCostCents, loadExpenses, removeExpense } = useExpenses();
  const [deleting, setDeleting] = useState(false);

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
            <TipsCarousel title="Dicas de despesas" tips={EXPENSE_TIPS} />
            <View className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-4">
              <Text className="text-gray-600 font-medium">Total mensal de despesas fixas</Text>
              <Text className="text-2xl text-indigo-700 font-bold mt-1">
                {error || (loading && !expenses.length) ? '—' : totalMonthlyCostCents === null ? 'Total acima do limite' : formatCurrency(totalMonthlyCostCents)}
              </Text>
            </View>
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
