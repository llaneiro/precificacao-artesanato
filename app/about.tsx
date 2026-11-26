import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AboutScreen() {
  const name = Constants.expoConfig?.name ?? 'Precificação Artesanal';
  const version = Constants.expoConfig?.version ?? '1.0.0';
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="items-center py-6">
          <View className="w-20 h-20 rounded-3xl bg-indigo-100 items-center justify-center mb-4">
            <Ionicons name="calculator-outline" size={40} color="#4f46e5" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">{name}</Text>
          <Text className="text-gray-500 mt-1">Versão {version}</Text>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Sobre o aplicativo</Text>
          <Text className="text-gray-600 leading-6">Uma ferramenta para ajudar artesãos a calcular o preço de venda dos seus produtos, considerando materiais, tempo de confecção, despesas, taxas de pagamento e margem de lucro.</Text>
          <Text className="text-gray-600 leading-6 mt-2">O aplicativo permite acompanhar custos e precificações, organizar os dados do negócio e trabalhar mesmo sem conexão com a internet, com sincronização automática quando disponível.</Text>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-4">
          <Text className="text-lg font-bold text-gray-800 mb-3">Desenvolvimento</Text>
          <View className="flex-row items-center gap-3">
            <View className="w-11 h-11 rounded-full bg-indigo-50 items-center justify-center">
              <Ionicons name="person-outline" size={23} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Larissa Laneiro dos Santos</Text>
              <Text className="text-sm text-gray-500 mt-1">Desenvolvedora</Text>
            </View>
          </View>
          <View className="border-t border-gray-100 mt-4 pt-3">
            <Text className="text-gray-700 font-medium">Projeto acadêmico</Text>
            <Text className="text-gray-500 text-sm mt-1">Fatec · Análise e Desenvolvimento de Sistemas</Text>
            <Text className="text-gray-500 text-sm mt-1">Desenvolvimento para Dispositivos Móveis</Text>
          </View>
        </View>
        <View className="bg-white border border-gray-200 rounded-2xl p-4">
          <Text className="text-lg font-bold text-gray-800 mb-2">Tecnologias utilizadas</Text>
          <Text className="text-gray-600 leading-6">React Native, Expo, TypeScript, SQLite e Firebase.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
