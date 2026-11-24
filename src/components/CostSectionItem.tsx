import { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function CostSectionItem({ title, description, summary, icon, onPress }: {
  title: string; description: string; summary: string;
  icon: ComponentProps<typeof Ionicons>['name']; onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="bg-white border border-gray-200 rounded-xl p-4 mb-3 flex-row items-center gap-3">
      <View className="bg-indigo-50 rounded-xl p-3"><Ionicons name={icon} size={24} color="#4f46e5" /></View>
      <View className="flex-1 gap-1">
        <Text className="text-gray-800 font-bold">{title}</Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
        <Text className="text-indigo-600 font-semibold text-sm">{summary}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#6b7280" />
    </Pressable>
  );
}
