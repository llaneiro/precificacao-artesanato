import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { MainScreen } from '../../src/components/MainScreen';
import { useAuthContext } from '../../src/contexts/AuthContext';

export default function MoreScreen() {
  const router = useRouter();
  const { user, signOut } = useAuthContext();
  const [busy, setBusy] = useState(false);

  async function handleSignOut() {
    setBusy(true);
    try {
      await signOut();
    } catch {
      Alert.alert('Erro', 'Não foi possível sair da conta.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <MainScreen>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-lg font-bold text-gray-800 mb-2">Minha conta</Text>
        <Text className="text-gray-600 mb-4">{user?.email}</Text>
        <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => router.push('/onboarding')} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 flex-row items-center gap-3">
          <Ionicons name="compass-outline" size={24} color="#4f46e5" />
          <Text className="text-gray-800 font-semibold flex-1">Guia de primeiros passos</Text>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>
        <TouchableOpacity disabled={busy} onPress={() => void handleSignOut()} className="bg-white border border-gray-200 rounded-xl p-4">
          <Text className="text-red-600 font-semibold text-center">{busy ? 'Saindo...' : 'Sair da conta'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </MainScreen>
  );
}
