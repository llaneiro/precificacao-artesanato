import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSyncStatus } from '../src/contexts/SyncContext';

export default function SettingsScreen() {
  const router = useRouter();
  const sync = useSyncStatus();
  const statusText = {
    synced: 'Dados sincronizados',
    syncing: 'Sincronizando dados...',
    pending: 'Aguardando sincronização',
    error: 'Erro de sincronização',
    waiting: 'Aguardando alterações',
  }[sync.phase];

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <Text className="text-lg font-bold text-gray-800 mb-3">Preferências</Text>
        <TouchableOpacity accessibilityRole="button" onPress={() => router.push('/dashboard-settings')} className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex-row items-center gap-3">
          <Ionicons name="notifications-outline" size={24} color="#4f46e5" />
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold">Lembretes</Text>
            <Text className="text-gray-500 text-xs mt-1">Frequência de revisão dos materiais</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-800 mb-3">Dados</Text>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 flex-row items-start gap-3">
          <Ionicons name={sync.phase === 'synced' ? 'cloud-done-outline' : 'cloud-outline'} size={25} color={sync.phase === 'synced' ? '#15803d' : sync.phase === 'error' ? '#dc2626' : '#6b7280'} />
          <View className="flex-1">
            <Text className="text-gray-800 font-semibold">Sincronização automática</Text>
            <Text accessibilityLiveRegion="polite" className={sync.phase === 'error' ? 'text-red-600 text-sm mt-1' : 'text-gray-600 text-sm mt-1'}>{statusText}</Text>
            {sync.phase === 'error' && <Text className="text-gray-500 text-xs mt-1">Alterações locais preservadas.</Text>}
            {!!sync.pending && <Text className="text-gray-500 text-xs mt-1">{sync.pending} {sync.pending === 1 ? 'alteração pendente' : 'alterações pendentes'}</Text>}
            {!!sync.lastSync && <Text className="text-gray-500 text-xs mt-1">Última sincronização: {new Date(sync.lastSync).toLocaleString('pt-BR')}</Text>}
            <Text className="text-gray-500 text-xs mt-3 leading-5">Seus dados são salvos neste aparelho e sincronizados com sua conta quando há conexão.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
