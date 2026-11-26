import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  busy?: boolean;
  newPassword?: boolean;
}

export function PasswordField({ label, value, onChangeText, busy, newPassword }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-semibold mb-2">{label}</Text>
      <View className="flex-row items-center bg-white border border-gray-300 rounded-xl">
        <TextInput
          accessibilityLabel={label}
          className="flex-1 px-4 py-3 text-base text-gray-800"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          autoComplete={newPassword ? 'new-password' : 'current-password'}
          textContentType={newPassword ? 'newPassword' : 'password'}
          editable={!busy}
        />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={visible ? 'Ocultar ' + label.toLowerCase() : 'Mostrar ' + label.toLowerCase()}
          onPress={() => setVisible(v => !v)}
          disabled={busy}
          className="px-4 min-h-12 justify-center"
        >
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
