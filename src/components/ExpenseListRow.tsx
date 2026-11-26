import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OptionsMenu } from './OptionsMenu';
import { formatCurrency } from '../utils/currency';

export function ExpenseListRow({ name, costCents, description, onEdit, onDelete, disabled, first, last }: {
  name: string;
  costCents: number;
  description?: string | null;
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
  first?: boolean;
  last?: boolean;
}) {
  return (
    <View className={'bg-white border-gray-200 border-x border-t flex-row items-center gap-3 px-3 py-3 ' +
      (first ? 'rounded-t-2xl ' : '') + (last ? 'border-b rounded-b-2xl' : '')}>
      <View className="w-11 h-11 rounded-xl bg-indigo-50 items-center justify-center">
        <Ionicons name="receipt-outline" size={24} color="#4f46e5" />
      </View>
      <View className="flex-1">
        <Text className="text-base font-semibold text-gray-800">{name}</Text>
        <Text className="text-base font-semibold text-indigo-700 mt-1">{formatCurrency(costCents)}</Text>
        {!!description && <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>{description}</Text>}
      </View>
      <OptionsMenu label={'Opções de ' + name} disabled={disabled} actions={[
        { label: 'Editar', icon: 'create-outline', onPress: () => onEdit() },
        { label: 'Excluir', icon: 'trash-outline', destructive: true, onPress: () => onDelete() },
      ]} />
    </View>
  );
}
