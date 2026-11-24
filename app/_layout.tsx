import '../global.css';
import { Stack } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider, useAuthContext } from '../src/contexts/AuthContext';

export default function RootLayout() {
  // O Expo Router já trata a área segura superior do cabeçalho.
  return (
    <KeyboardProvider statusBarTranslucent>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </KeyboardProvider>
  );
}

function RootLayoutNav() {
  const { user, loading } = useAuthContext();
  if (loading) {
    return <View className="flex-1 items-center justify-center bg-white"><ActivityIndicator color="#4f46e5" /></View>;
  }
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#4f46e5' }, headerTintColor: '#fff', statusBarStyle: user ? 'light' : 'dark' }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, statusBarStyle: 'dark' }} />
        <Stack.Screen name="fixed-expenses" options={{ title: 'Despesas fixas' }} />
        <Stack.Screen name="additional-expenses" options={{ title: 'Despesas adicionais' }} />
        <Stack.Screen name="additional-expense-form" options={{ title: 'Nova despesa adicional' }} />
        <Stack.Screen name="sales-fees" options={{ title: 'Formas de pagamento' }} />
        <Stack.Screen name="labor-settings" options={{ title: 'Mão de obra' }} />
        <Stack.Screen name="expense-form" options={{ title: 'Nova despesa' }} />
        <Stack.Screen name="product-pricing" options={{ title: 'Precificação' }} />
        <Stack.Screen name="product-details" options={{ title: 'Detalhes do produto' }} />
        <Stack.Screen name="profit-margin" options={{ title: 'Margem de lucro' }} />
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
