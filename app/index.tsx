import { Text, View } from 'react-native';
import { MainScreen } from '../src/components/MainScreen';

export default function HomeScreen() {
  return (
    <MainScreen route="/">
      <View className="flex-1 p-4">
        <View className="bg-white border border-gray-200 rounded-xl p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Bem-vindo!</Text>
          <Text className="text-gray-500">Use o menu inferior para acessar seus materiais e as demais áreas do aplicativo.</Text>
        </View>
      </View>
    </MainScreen>
  );
}
