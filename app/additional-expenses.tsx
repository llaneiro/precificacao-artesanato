import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AdditionalExpenseItem } from '../src/components/AdditionalExpenseItem';
import { useAdditionalExpenses } from '../src/hooks/useAdditionalExpenses';
import { AdditionalExpense } from '../src/types/additionalExpense';

export default function AdditionalExpensesScreen() {
  const router = useRouter();
  const { expenses, loading, error, loadAdditionalExpenses, removeAdditionalExpense } = useAdditionalExpenses();
  const [deleting, setDeleting] = useState(false);
  const [examplesExpanded, setExamplesExpanded] = useState(false);
  const operation = useRef(false);

  function confirmDelete(expense: AdditionalExpense) {
    Alert.alert('Excluir despesa', 'Deseja excluir "' + expense.name + '"?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive', onPress: async () => {
          if (operation.current) return;
          operation.current = true;
          setDeleting(true);
          try {
            await removeAdditionalExpense(expense.id);
          } catch (error) {
            Alert.alert('Não foi possível excluir', String(error).includes('ADDITIONAL_EXPENSE_IN_USE') || String(error).includes('FOREIGN KEY constraint failed')
              ? 'Esta despesa está vinculada a um produto. Remova a associação antes de excluí-la.'
              : 'Não foi possível excluir a despesa.');
          } finally {
            operation.current = false;
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
        contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24 }}
        ListHeaderComponent={
          <View>
            <View className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mb-5">
              <View className="flex-row items-center gap-2 mb-2">
                <Ionicons name="bulb-outline" size={22} color="#4f46e5" />
                <Text className="flex-1 text-indigo-900 font-semibold">Quando usar?</Text>
              </View>
              <Text className="text-gray-700 text-sm leading-5">Gastos extras que se aplicam apenas aos produtos que precisam deles.</Text>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: examplesExpanded }}
                onPress={() => setExamplesExpanded(value => !value)} className="flex-row items-center gap-2 min-h-12 mt-1">
                <Text className="flex-1 text-indigo-700 text-sm font-semibold">Ver exemplos e como funciona</Text>
                <Ionicons name={examplesExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#4f46e5" />
              </Pressable>
              {examplesExpanded && (
                <View className="border-t border-indigo-100 pt-3">
                  <Text className="text-indigo-900 text-sm font-semibold mb-2">Exemplos</Text>
                  {['Costura terceirizada', 'Bordado personalizado', 'Corte a laser'].map(example => (
                    <View key={example} className="flex-row items-center gap-2 mb-1">
                      <Ionicons name="checkmark" size={17} color="#4f46e5" />
                      <Text className="flex-1 text-gray-700 text-sm leading-5">{example}</Text>
                    </View>
                  ))}
                  <Text className="text-gray-700 text-sm leading-5 mt-2">Cadastre a despesa e selecione-a nos produtos que utilizam esse serviço. Não repita custos já cadastrados em outras categorias.</Text>
                </View>
              )}
              <View className="flex-row items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3 mt-3">
                <Ionicons name="information-circle-outline" size={21} color="#92400e" />
                <Text className="flex-1 text-amber-900 text-sm leading-5">Embalagens e etiquetas devem ser cadastradas em <Text className="font-bold">Materiais</Text>.</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap items-center justify-between gap-2 mb-3">
              <Text accessibilityRole="header" className="text-lg font-bold text-gray-800">Suas despesas</Text>
              <Pressable accessibilityRole="button" disabled={deleting} onPress={() => router.push('/additional-expense-form')} className="bg-indigo-600 rounded-xl min-h-11 px-3 py-2 flex-row items-center justify-center gap-1 active:bg-indigo-700 disabled:opacity-50">
                <Ionicons name="add" size={21} color="#fff" />
                <Text className="text-white font-semibold text-sm">Nova despesa</Text>
              </Pressable>
            </View>
          </View>
        }
        ListEmptyComponent={error ? (
          <View className="bg-white rounded-2xl border border-gray-200 p-5 items-center">
            <Text className="text-gray-700 text-center">{error}</Text>
            <Pressable accessibilityRole="button" onPress={() => void loadAdditionalExpenses()} className="min-h-12 justify-center mt-1">
              <Text className="text-indigo-700 font-semibold">Tentar novamente</Text>
            </Pressable>
          </View>
        ) : loading ? (
          <ActivityIndicator className="mt-8" color="#4f46e5" />
        ) : (
          <View className="bg-white rounded-2xl border border-gray-200 p-5 items-center">
            <View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center mb-3">
              <Ionicons name="receipt-outline" size={29} color="#4f46e5" />
            </View>
            <Text className="text-gray-800 font-bold text-base text-center">Nenhuma despesa cadastrada</Text>
            <Text className="text-gray-600 text-sm text-center mt-2 leading-5">Cadastre custos extras quando precisar.</Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <AdditionalExpenseItem expense={item} disabled={deleting || loading} first={index === 0} last={index === expenses.length - 1}
            onEdit={id => router.push({ pathname: '/additional-expense-form', params: { id: String(id) } })}
            onDelete={confirmDelete} />
        )}
      />
    </SafeAreaView>
  );
}
