import type { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CostSectionItem({ title, summary, icon, onPress, last = false, pending = false }: {
  title: string;
  summary: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  last?: boolean;
  pending?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title + ', ' + summary}
      onPress={onPress}
      className={'flex-row items-center gap-3 px-3 py-4 active:bg-gray-50 ' + (last ? '' : 'border-b border-gray-100')}
    >
      <View className="w-11 h-11 rounded-xl bg-indigo-50 items-center justify-center">
        <Ionicons name={icon} size={24} color="#4f46e5" />
      </View>
      <View className="flex-1 gap-1">
        <Text className="text-gray-800 text-base font-semibold">{title}</Text>
        <Text className={pending ? 'text-amber-800 text-sm' : 'text-gray-600 text-sm'}>{summary}</Text>
      </View>
      <Ionicons name="chevron-forward" size={19} color="#6b7280" />
    </Pressable>
  );
}
