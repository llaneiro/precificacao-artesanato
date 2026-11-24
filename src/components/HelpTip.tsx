import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function HelpTip({ title, message }: { title: string; message: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={'Ajuda: ' + title}
      onPress={() => Alert.alert(title, message, [{ text: 'Entendi' }])}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Ionicons name="help-circle-outline" size={21} color="#6b7280" />
    </Pressable>
  );
}

export function HelpLabel({ title, message, className = 'text-gray-700 font-semibold', rowClassName = '' }: {
  title: string; message: string; className?: string; rowClassName?: string;
}) {
  return <View className={'flex-row items-center ' + rowClassName}>
    <Text className={'flex-shrink ' + className}>{title}</Text>
    <HelpTip title={title} message={message} />
  </View>;
}
