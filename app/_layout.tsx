import '../global.css';
import { Stack } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { ActivityIndicator, Platform, View } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { AuthProvider, useAuthContext } from '../src/contexts/AuthContext';

// O Expo Go usa o Info.plist do próprio aplicativo hospedeiro.
// Em builds iOS do projeto, o app.json habilita o controle por tela.
const canSetScreenStatusBar = Platform.OS !== 'ios' ||
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export default function RootLayout() {
  // O Expo Router já trata a área segura superior do cabeçalho.
  return (
    <KeyboardProvider statusBarTranslucent={Platform.OS === 'android'}>
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
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#4f46e5' }, headerTintColor: '#fff', statusBarStyle: canSetScreenStatusBar ? (user ? 'light' : 'dark') : undefined }}>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false, statusBarStyle: canSetScreenStatusBar ? 'dark' : undefined }} />
        <Stack.Screen name="fixed-expenses" options={{ title: 'Despesas fixas' }} />
        <Stack.Screen name="additional-expenses" options={{ title: 'Despesas adicionais' }} />
        <Stack.Screen name="additional-expense-form" options={{ title: 'Nova despesa adicional' }} />
        <Stack.Screen name="sales-fees" options={{ title: 'Formas de pagamento' }} />
        <Stack.Screen name="labor-settings" options={{ title: 'Mão de obra' }} />
        <Stack.Screen name="expense-form" options={{ title: 'Nova despesa' }} />
        <Stack.Screen name="product-pricing" options={{ title: 'Precificação' }} />
        <Stack.Screen name="pricing-history" options={{ title: 'Histórico de precificações' }} />
        <Stack.Screen name="pricing-history-details" options={{ title: 'Precificação salva' }} />
        <Stack.Screen name="product-details" options={{ title: 'Detalhes do produto' }} />
        <Stack.Screen name="profit-margin" options={{ title: 'Margem de lucro' }} />
        <Stack.Screen name="product-form" options={{ title: 'Novo produto' }} />
        <Stack.Screen name="material-price-form" options={{ title: 'Atualizar preço' }} />
        <Stack.Screen name="material-cost-history" options={{ title: 'Histórico de custos' }} />
        <Stack.Screen name="material-form" options={{ title: 'Novo material' }} />
      </Stack.Protected>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
