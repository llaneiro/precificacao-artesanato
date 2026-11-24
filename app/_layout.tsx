import '../global.css';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuthContext } from '../src/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuthContext();
  if (loading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#4f46e5" /></View>;
  }
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#4f46e5' }, headerTintColor: '#fff' }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="index" options={{ title: 'Precificação Artesanal', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="materials" options={{ title: 'Materiais', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="products" options={{ title: 'Produtos', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="expenses" options={{ title: 'Despesas', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="more" options={{ title: 'Mais', headerBackVisible: false, gestureEnabled: false }} />
        <Stack.Screen name="product-form" options={{ title: 'Novo produto' }} />
        <Stack.Screen name="material-form" options={{ title: 'Novo material' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
