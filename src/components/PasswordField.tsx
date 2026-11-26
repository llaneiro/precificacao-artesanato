import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  busy?: boolean;
  newPassword?: boolean;
  authStyle?: boolean;
}

export function PasswordField({ label, value, onChangeText, busy, newPassword, authStyle = false }: Props) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-semibold mb-2">{label}</Text>
      <View className={'flex-row items-center border rounded-xl ' + (authStyle ? focused ? 'bg-white border-indigo-500' : 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300')}>
        {authStyle && <View className="pl-3"><Ionicons name="lock-closed-outline" size={20} color={focused ? '#4f46e5' : '#6b7280'} /></View>}
        <TextInput
          accessibilityLabel={label}
          className={'flex-1 min-h-12 py-3 text-base text-gray-800 ' + (authStyle ? 'px-3' : 'px-4')}
          placeholder={authStyle ? newPassword ? 'Digite a senha' : 'Sua senha' : undefined}
          placeholderTextColor="#9ca3af"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
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
