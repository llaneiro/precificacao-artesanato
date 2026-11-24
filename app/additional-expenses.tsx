import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../src/components/EmptyState';
import { AdditionalExpenseItem } from '../src/components/AdditionalExpenseItem';
import { TipsCarousel, type Tip } from '../src/components/TipsCarousel';
import { useAdditionalExpenses } from '../src/hooks/useAdditionalExpenses';
import { AdditionalExpense } from '../src/types/additionalExpense';

const EXPENSE_TIPS: readonly Tip[] = [
  { title: 'Gastos específicos da peça', description: 'Inclua serviços de terceiros, personalizações ou fretes que você paga e que fazem parte do custo de uma peça.', icon: 'cube-outline' },
  { title: 'Associe ao produto', description: 'Cadastre o custo por utilização aqui e selecione a despesa na ficha do produto. Informe quantas utilizações a peça precisa.', icon: 'link-outline' },
  { title: 'Evite duplicar custos', description: 'Embalagens e etiquetas ficam em Materiais. Gastos mensais ficam em Despesas fixas. Não registre o mesmo custo duas vezes.', icon: 'bulb-outline', iconColor: '#d97706' },
];

export default function AdditionalExpensesScreen() {
  const router = useRouter();
  const { expenses, loading, error, loadAdditionalExpenses, removeAdditionalExpense } = useAdditionalExpenses();
  const [deleting, setDeleting] = useState(false);

  function confirmDelete(expense: AdditionalExpense) {
    Alert.alert('Excluir despesa', 'Deseja excluir "' + expense.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          setDeleting(true);
          try {
            await removeAdditionalExpense(expense.id);
          } catch (error) {
            Alert.alert('Não foi possível excluir', String(error).includes('ADDITIONAL_EXPENSE_IN_USE') || String(error).includes('FOREIGN KEY constraint failed')
              ? 'Esta despesa está vinculada a um produto. Remova a associação antes de excluí-la.'
              : 'Não foi possível excluir a despesa.');
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
        onRefresh={() => void loadAdditionalExpenses()}
        contentContainerStyle={{ flexGrow: 1, padding: 16 }}
        ListHeaderComponent={(
          <View>
            <TipsCarousel title="Dicas de despesas" tips={EXPENSE_TIPS} />
            <TouchableOpacity disabled={deleting} onPress={() => router.push('/additional-expense-form')} className="bg-indigo-600 rounded-xl p-4 mb-4">
              <Text className="text-white font-bold text-center">+ Nova despesa</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={error ? (
          <View className="items-center py-8">
            <Text className="text-red-600 text-center">{error}</Text>
            <TouchableOpacity onPress={() => void loadAdditionalExpenses()} className="p-4">
              <Text className="text-indigo-600 font-semibold">Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" color="#4f46e5" />
        ) : (
          <EmptyState title="Nenhuma despesa cadastrada" subtitle="Toque em Nova despesa para começar." />
        )}
        renderItem={({ item }) => (
          <AdditionalExpenseItem expense={item} disabled={deleting}
            onEdit={id => router.push({ pathname: '/additional-expense-form', params: { id: String(id) } })}
            onDelete={confirmDelete} />
        )}
      />
    </SafeAreaView>
  );
}
