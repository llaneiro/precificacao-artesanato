import { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthFormProps {
  registering?: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitch: () => void;
}

function errorMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : '';
  switch (code) {
    case 'auth/invalid-email': return 'Informe um e-mail válido.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use': return 'Não foi possível cadastrar este e-mail. Tente entrar na sua conta.';
    case 'auth/weak-password': return 'A senha precisa ter pelo menos 6 caracteres.';
    case 'auth/network-request-failed': return 'Verifique sua conexão com a internet.';
    case 'auth/too-many-requests': return 'Muitas tentativas. Tente novamente mais tarde.';
    default: return 'Não foi possível concluir a autenticação. Tente novamente.';
  }
}

export function AuthForm({ registering = false, onSubmit, onSwitch }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';

  async function submit() {
    if (busyRef.current) return;
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!password || (registering && password.length < 6)) {
      setError(registering ? 'A senha precisa ter pelo menos 6 caracteres.' : 'Informe a senha.');
      return;
    }
    if (registering && password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }
    busyRef.current = true;
    setBusy(true);
    try {
      await onSubmit(email.trim(), password);
    } catch (error) {
      setError(errorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }} keyboardShouldPersistTaps="handled">
        <Text className="text-2xl font-bold text-indigo-600 mb-2">Precificação Artesanal</Text>
        <Text className="text-lg font-semibold text-gray-800 mb-6">{registering ? 'Criar conta' : 'Entrar'}</Text>
        <Text className="text-gray-700 font-semibold mb-2">E-mail</Text>
        <TextInput className={inputClass} value={email} onChangeText={v => { setEmail(v); setError(''); }} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} editable={!busy} />
        <Text className="text-gray-700 font-semibold mb-2">Senha</Text>
        <TextInput className={inputClass} value={password} onChangeText={v => { setPassword(v); setError(''); }} secureTextEntry autoCapitalize="none" editable={!busy} />
        {registering && (
          <View>
            <Text className="text-gray-700 font-semibold mb-2">Confirmar senha</Text>
            <TextInput className={inputClass} value={confirmation} onChangeText={v => { setConfirmation(v); setError(''); }} secureTextEntry autoCapitalize="none" editable={!busy} />
          </View>
        )}
        {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
        <TouchableOpacity disabled={busy} onPress={() => void submit()} className={'rounded-xl p-4 ' + (busy ? 'bg-indigo-400' : 'bg-indigo-600')}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-center font-bold">{registering ? 'Cadastrar' : 'Entrar'}</Text>}
        </TouchableOpacity>
        <TouchableOpacity disabled={busy} onPress={onSwitch} className="p-4">
          <Text className="text-indigo-600 text-center font-semibold">{registering ? 'Já tenho conta' : 'Criar uma conta'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
