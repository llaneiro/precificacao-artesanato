import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function HeaderAddButton({ label, onPress, disabled = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={{ marginRight: 16 }}>
      <Pressable accessibilityRole="button" accessibilityLabel={label}
        accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
        className={'min-h-11 flex-row items-center justify-center gap-1 px-1 rounded-lg ' + (disabled ? 'opacity-50' : 'active:opacity-70')}>
        <Ionicons name="add" size={22} color="#fff" />
        <Text className="text-white font-semibold text-sm" numberOfLines={1}>Novo</Text>
      </Pressable>
    </View>
  );
}
