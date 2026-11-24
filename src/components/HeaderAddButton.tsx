import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function HeaderAddButton({ label, onPress, disabled = false }: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 44,
        paddingHorizontal: 8,
        gap: 4,
        opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
      <Ionicons name="add" size={22} color="#fff" />
      <Text className="text-white font-semibold text-sm">Novo</Text>
      </View>
    </Pressable>
  );
}
