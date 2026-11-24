import { Text, TouchableOpacity, View } from 'react-native';
import { AdditionalExpense } from '../types/additionalExpense';
import { formatCurrency } from '../utils/currency';

interface AdditionalExpenseItemProps {
  expense: AdditionalExpense;
  onEdit: (id: number) => void;
  onDelete: (expense: AdditionalExpense) => void;
  disabled?: boolean;
}

export function AdditionalExpenseItem({ expense, onEdit, onDelete, disabled }: AdditionalExpenseItemProps) {
  return (
    <View className="bg-white border border-gray-200 rounded-xl p-4 mb-3">
      <Text className="text-lg font-bold text-gray-800">{expense.name}</Text>
      {!!expense.description && <Text className="text-gray-600 mt-1">{expense.description}</Text>}
      <Text className="text-indigo-600 text-lg font-semibold mt-2">{formatCurrency(expense.costCents)} / utilização</Text>
      <View className="flex-row justify-end mt-4 gap-4">
        <TouchableOpacity disabled={disabled} onPress={() => onEdit(expense.id)}>
          <Text className="text-indigo-600 font-semibold">Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity disabled={disabled} onPress={() => onDelete(expense)}>
          <Text className="text-red-600 font-semibold">Excluir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
