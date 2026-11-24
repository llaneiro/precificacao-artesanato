import { useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { MATERIAL_UNITS, MaterialUnit } from '../types/material';

interface MaterialUnitSelectProps {
  value: string;
  onChange: (value: MaterialUnit) => void;
  disabled?: boolean;
}

export function MaterialUnitSelect({ value, onChange, disabled }: MaterialUnitSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = MATERIAL_UNITS.find(unit => unit.value === value);

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Selecionar unidade de medida"
        disabled={disabled}
        onPress={() => setOpen(true)}
        className="bg-white border border-gray-300 rounded-xl px-4 py-3 mb-4 flex-row justify-between items-center"
      >
        <Text className={selected ? 'text-base text-gray-800' : 'text-base text-gray-500'}>
          {selected?.label ?? (value ? 'Selecione uma unidade (anterior: ' + value + ')' : 'Selecione uma unidade')}
        </Text>
        <Text className="text-gray-500">⌄</Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View className="flex-1 justify-center p-6">
          <Pressable onPress={() => setOpen(false)} className="absolute inset-0 bg-black/40" accessibilityLabel="Fechar seleção" />
          <View className="bg-white rounded-xl p-4">
            <Text className="text-lg font-bold text-gray-800 mb-2">Unidade de medida</Text>
            {MATERIAL_UNITS.map(unit => (
              <TouchableOpacity
                key={unit.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: value === unit.value }}
                onPress={() => { onChange(unit.value); setOpen(false); }}
                className={'p-3 rounded-lg ' + (value === unit.value ? 'bg-indigo-100' : '')}
              >
                <Text className={'text-base ' + (value === unit.value ? 'text-indigo-700 font-bold' : 'text-gray-800')}>{unit.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setOpen(false)} className="p-3 mt-2">
              <Text className="text-center text-indigo-600 font-semibold">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
