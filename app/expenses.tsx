import { Text, View } from 'react-native';
import { MainScreen } from '../src/components/MainScreen';

export default function ExpensesScreen() {
  return (
    <MainScreen route="/expenses">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-xl font-bold text-gray-700 text-center">Despesas</Text>
      </View>
    </MainScreen>
  );
}
