import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { MainScreen } from '../../src/components/MainScreen';
import { useOnboarding } from '../../src/hooks/useOnboarding';

export default function HomeScreen() {
  const router = useRouter();
  const { hasCompleted } = useOnboarding();
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState(false);

  useFocusEffect(useCallback(() => {
    let active = true;
    setCheckError(false);
    setChecking(true);
    hasCompleted().then(completed => {
      if (!active) return;
      setChecking(false);
      if (!completed) router.push('/onboarding');
    }).catch(() => {
      if (active) { setCheckError(true); setChecking(false); }
    });
    return () => { active = false; };
  }, [hasCompleted, router]));

  return (
    <MainScreen>
      <View className="flex-1 p-4">
        <View className="bg-white border border-gray-200 rounded-xl p-4">
          <Text className="text-lg font-semibold text-gray-800 mb-2">Bem-vindo!</Text>
          <Text className="text-gray-500">Use o menu inferior para acessar seus materiais e as demais áreas do aplicativo.</Text>
        </View>
        {checking && <ActivityIndicator className="mt-4" color="#4f46e5" />}
        {checkError && <View className="bg-white rounded-xl p-4 mt-4 border border-gray-200">
          <Text className="text-gray-600">Não foi possível verificar a configuração inicial.</Text>
          <Pressable onPress={() => router.push('/onboarding')} className="py-3">
            <Text className="text-indigo-700 font-semibold">Abrir guia de primeiros passos</Text>
          </Pressable>
        </View>}
      </View>
    </MainScreen>
  );
}
