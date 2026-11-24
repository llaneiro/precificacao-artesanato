import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function HeaderSaveButton({ onPress, disabled = false, saving = false }: {
  onPress: () => void;
  disabled?: boolean;
  saving?: boolean;
}) {
  return (
    <View style={{ marginRight: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="Salvar"
        accessibilityState={{ disabled: disabled || saving, busy: saving }}
        disabled={disabled || saving} onPress={onPress}
        className={'min-h-11 flex-row items-center justify-center gap-1 px-1 rounded-lg ' + (disabled ? 'opacity-50' : 'active:opacity-70')}>
        {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={22} color="#fff" />}
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>Salvar</Text>
      </Pressable>
    </View>
  );
}
