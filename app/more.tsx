import { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity } from 'react-native';
import { MainScreen } from '../src/components/MainScreen';
import { useAuthContext } from '../src/contexts/AuthContext';

export default function MoreScreen() {
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
    <MainScreen route="/more">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-lg font-bold text-gray-800 mb-2">Minha conta</Text>
        <Text className="text-gray-600 mb-4">{user?.email}</Text>
        <TouchableOpacity disabled={busy} onPress={() => void handleSignOut()} className="bg-white border border-gray-200 rounded-xl p-4">
          <Text className="text-red-600 font-semibold text-center">{busy ? 'Saindo...' : 'Sair da conta'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </MainScreen>
  );
}
