import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
type Icon = ComponentProps<typeof Ionicons>['name'];
export function DashboardAction({ icon, title, subtitle, onPress, warning = false }: { icon: Icon; title: string; subtitle?: string; onPress: () => void; warning?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} className="flex-row items-center gap-3 py-3">
    <View className={'w-11 h-11 rounded-xl items-center justify-center ' + (warning ? 'bg-orange-50' : 'bg-indigo-50')}>
      <Ionicons name={icon} size={23} color={warning ? '#c2410c' : '#4f46e5'} />
    </View>
    <View className="flex-1">
      <Text className="font-semibold text-gray-800">{title}</Text>
      {!!subtitle && <Text className="text-gray-500 text-xs mt-1">{subtitle}</Text>}
    </View>
    <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
  </Pressable>;
}
