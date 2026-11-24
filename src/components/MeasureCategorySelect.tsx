import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MEASURE_CATEGORIES, measureCategory, type MaterialUnit } from '../types/material';

export function MeasureCategorySelect({ unit, onChange, disabled }: { unit: string; onChange: (unit: MaterialUnit) => void; disabled?: boolean }) {
  return <View className="flex-row flex-wrap mb-4" style={{ marginHorizontal: -4 }}>
    {MEASURE_CATEGORIES.map(category => {
      const selected = measureCategory(unit) === category.id;
      return <View key={category.id} style={{ width: '50%', padding: 4 }}>
        <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected, disabled }} disabled={disabled}
          onPress={() => onChange(category.units[0])}
          className={'border rounded-xl p-3 gap-1 ' + (selected ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-200')}>
          <Ionicons name={category.icon} size={23} color={selected ? '#4f46e5' : '#6b7280'} />
          <Text className={'font-semibold ' + (selected ? 'text-indigo-700' : 'text-gray-800')}>{category.label}</Text>
          <Text className="text-gray-500 text-xs">{category.units.map(u => u === 'l' ? 'L' : u).join(', ')}</Text>
        </Pressable>
      </View>;
    })}
  </View>;
}

export function CompactUnitSelect({ value, units, onChange, disabled }: { value: string; units: readonly MaterialUnit[]; onChange: (unit: MaterialUnit) => void; disabled?: boolean }) {
  return <View className="flex-row gap-1 items-center mb-4">
    {units.map(unit => <Pressable key={unit} accessibilityRole="radio" accessibilityState={{ checked: value === unit, disabled }}
      disabled={disabled} onPress={() => onChange(unit)}
      className={'min-h-11 min-w-11 px-2 justify-center items-center rounded-lg border ' + (value === unit ? 'bg-indigo-50 border-indigo-500' : 'bg-white border-gray-300')}>
      <Text className={value === unit ? 'text-indigo-700 font-semibold' : 'text-gray-700'}>{unit === 'l' ? 'L' : unit}</Text>
    </Pressable>)}
  </View>;
}
