import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MainScreen } from '../../src/components/MainScreen';
import { useAuthContext } from '../../src/contexts/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const name = user?.displayName?.trim();
  const initials = name?.split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();

  return (
    <MainScreen>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Acessar meu perfil" onPress={() => router.push('/account')} activeOpacity={0.8} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6">
          <View className="flex-row items-center gap-3">
            <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center">
              {initials ? <Text className="text-indigo-700 text-xl font-bold">{initials}</Text> : <Ionicons name="person-outline" size={30} color="#4f46e5" />}
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 text-lg font-bold" numberOfLines={2}>{name || 'Meu perfil'}</Text>
              <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>{user?.email}</Text>
              <Text className="text-indigo-600 text-sm font-semibold mt-2">{name ? 'Gerenciar perfil' : 'Personalizar perfil'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </View>
        </TouchableOpacity>
        <View className="bg-white border border-gray-200 rounded-2xl px-4">
          <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/settings')} className="flex-row items-center gap-3 py-4">
            <View className="w-11 h-11 bg-indigo-50 rounded-xl items-center justify-center">
              <Ionicons name="settings-outline" size={24} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Configurações</Text>
              <Text className="text-gray-500 text-xs mt-1">Preferências do aplicativo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
          <View className="border-t border-gray-100" />
          <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/about')} className="flex-row items-center gap-3 py-4">
            <View className="w-11 h-11 bg-indigo-50 rounded-xl items-center justify-center">
              <Ionicons name="information-circle-outline" size={25} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-semibold">Sobre o sistema</Text>
              <Text className="text-gray-500 text-xs mt-1">Informações do aplicativo</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </MainScreen>
  );
}
