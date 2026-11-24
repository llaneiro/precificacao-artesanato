import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function HeaderSaveButton({ onPress, disabled = false, saving = false }: {
  onPress: () => void;
  disabled?: boolean;
  saving?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Salvar" accessibilityState={{ disabled: disabled || saving, busy: saving }}
      disabled={disabled || saving} onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', flexWrap: 'nowrap', alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 82, flexShrink: 0, paddingHorizontal: 4, gap: 4, opacity: disabled ? 0.5 : pressed ? 0.7 : 1 })}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, flexShrink: 0 }}>
      {saving ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="checkmark" size={22} color="#fff" />}
      <Text numberOfLines={1} style={{ flexShrink: 0, color: "#fff", fontWeight: "600", fontSize: 14 }}>Salvar</Text>
      </View>
    </Pressable>
  );
}
