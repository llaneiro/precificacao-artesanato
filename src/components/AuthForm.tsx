import { FormScrollView } from './FormScrollView';
import { PasswordField } from './PasswordField';
import { validEmail, validateNewPassword, authErrorMessage } from '../utils/authValidation';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface AuthFormProps {
  registering?: boolean;
  onSubmit: (email: string, password: string) => Promise<void>;
  onSwitch: () => void;
  onReset?: (email: string) => Promise<void>;
}

export function AuthForm({ registering = false, onSubmit, onSwitch, onReset }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [sent, setSent] = useState(false);
  const busyRef = useRef(false);
  const inputClass = 'bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-4';

  async function submit() {
    if (busyRef.current) return;
    setError('');
    if (!validEmail(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (!recovering) {
      const validation = registering ? validateNewPassword(password, confirmation) : (!password ? 'Informe a senha.' : '');
      if (validation) { setError(validation); return; }
    }
    busyRef.current = true;
    setBusy(true);
    try {
      if (recovering && onReset) {
        await onReset(email.trim());
        setSent(true);
      } else {
        await onSubmit(email.trim(), password);
      }
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  function switchRecovery(value: boolean) {
    setRecovering(value);
    setSent(false);
    setError('');
    setPassword('');
    setConfirmation('');
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FormScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
        <Text className="text-2xl font-bold text-indigo-600 mb-2">Precificação Artesanal</Text>
        <Text className="text-lg font-semibold text-gray-800 mb-2">{recovering ? 'Recuperar senha' : registering ? 'Criar conta' : 'Entrar'}</Text>
        <Text className="text-gray-500 mb-6">{recovering ? 'Informe seu e-mail para receber as instruções de recuperação.' : registering ? 'Crie sua conta para organizar seus preços.' : 'Acesse sua conta para continuar.'}</Text>
        {sent ? (
          <View className="bg-white border border-gray-200 rounded-xl p-4">
            <Text accessibilityRole="alert" className="font-semibold text-gray-800 mb-2">Confira seu e-mail</Text>
            <Text className="text-gray-600 leading-6">Se existir uma conta com esse endereço, você receberá um link para redefinir sua senha. Confira também a caixa de spam.</Text>
            <TouchableOpacity onPress={() => switchRecovery(false)} className="bg-indigo-600 rounded-xl p-4 mt-4">
              <Text className="text-white font-bold text-center">Voltar para entrar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSent(false); setError(''); }} className="p-3 mt-1">
              <Text className="text-indigo-600 text-center font-semibold">Usar outro e-mail</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text className="text-gray-700 font-semibold mb-2">E-mail</Text>
            <TextInput accessibilityLabel="E-mail" className={inputClass} value={email} onChangeText={v => { setEmail(v); setError(''); }} placeholder="seu@email.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false} editable={!busy} />
            {!recovering && <PasswordField label="Senha" value={password} onChangeText={v => { setPassword(v); setError(''); }} busy={busy} newPassword={registering} />}
            {!recovering && registering && (
              <>
                <Text className="text-gray-500 text-xs -mt-2 mb-4">Use pelo menos 6 caracteres. Prefira uma senha longa e exclusiva.</Text>
                <PasswordField label="Confirmar senha" value={confirmation} onChangeText={v => { setConfirmation(v); setError(''); }} busy={busy} newPassword />
              </>
            )}
            {!recovering && !registering && onReset && (
              <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => switchRecovery(true)} className="self-end pb-4">
                <Text className="text-indigo-600 font-semibold">Esqueci minha senha</Text>
              </TouchableOpacity>
            )}
            {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void submit()} className={'rounded-xl p-4 ' + (busy ? 'bg-indigo-400' : 'bg-indigo-600')}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-center font-bold">{recovering ? 'Enviar link de recuperação' : registering ? 'Cadastrar' : 'Entrar'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={recovering ? () => switchRecovery(false) : onSwitch} className="p-4">
              <Text className="text-indigo-600 text-center font-semibold">{recovering ? 'Voltar para entrar' : registering ? 'Já tenho conta' : 'Criar uma conta'}</Text>
            </TouchableOpacity>
          </>
        )}
      </FormScrollView>
    </SafeAreaView>
  );
}
