import { MoneyInput } from './MoneyInput';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HelpLabel } from './HelpTip';

export function ExpenseFormFields({ name, cost, description, onNameChange, onCostChange, onDescriptionChange, namePlaceholder, costLabel, costHelp, costPlaceholder, descriptionPlaceholder, saving }: {
  name: string;
  cost: string;
  description: string;
  onNameChange: (value: string) => void;
  onCostChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  namePlaceholder: string;
  costLabel: string;
  costHelp: string;
  costPlaceholder: string;
  descriptionPlaceholder: string;
  saving: boolean;
}) {
  const [descriptionOverride, setDescriptionOverride] = useState<boolean | null>(null);
  const descriptionExpanded = descriptionOverride ?? Boolean(description);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';
  return (
    <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
      <Text className="text-gray-700 font-semibold mb-2">Nome da despesa</Text>
      <TextInput accessibilityLabel="Nome da despesa" className={inputClass} value={name} onChangeText={onNameChange} placeholder={namePlaceholder} editable={!saving} />
      <HelpLabel title={costLabel} message={costHelp} className="text-gray-700 font-semibold" />
      <MoneyInput accessibilityLabel={costLabel} className={inputClass} value={cost} onChangeText={onCostChange} placeholder={costPlaceholder} editable={!saving} />
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: descriptionExpanded, disabled: saving }} disabled={saving}
        onPress={() => setDescriptionOverride(!descriptionExpanded)} className="flex-row items-center gap-2 min-h-12">
        <Ionicons name={descriptionExpanded ? 'remove-circle-outline' : 'add-circle-outline'} size={20} color="#4f46e5" />
        <Text className="flex-1 text-indigo-700 font-semibold text-sm">{descriptionExpanded ? 'Ocultar descrição' : description ? 'Mostrar descrição' : 'Adicionar descrição (opcional)'}</Text>
      </Pressable>
      {descriptionExpanded && <TextInput accessibilityLabel="Descrição opcional" className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 min-h-24 mt-2" multiline textAlignVertical="top" value={description} onChangeText={onDescriptionChange} placeholder={descriptionPlaceholder} editable={!saving} />}
    </View>
  );
}
