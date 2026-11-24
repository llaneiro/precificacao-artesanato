import { View, Text } from 'react-native';

interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export function EmptyState({ title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <Text className="text-xl font-bold text-gray-700 text-center mb-2">{title}</Text>
      <Text className="text-sm text-gray-500 text-center">{subtitle}</Text>
    </View>
  );
}
