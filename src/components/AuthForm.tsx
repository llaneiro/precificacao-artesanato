import { FormScrollView } from './FormScrollView';
import { PasswordField } from './PasswordField';
import { validEmail, validateNewPassword, authErrorMessage } from '../utils/authValidation';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
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
  const [emailFocused, setEmailFocused] = useState(false);
  const appName = Constants.expoConfig?.name ?? 'Precificação Artesanal';
  const title = recovering ? 'Recuperar senha' : registering ? 'Criar sua conta' : 'Entrar na sua conta';
  const description = recovering ? 'Informe seu e-mail para receber um link de recuperação.' : registering ? 'Comece a organizar os custos e preços das suas criações.' : 'Acesse seus produtos, materiais e precificações.';

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
      <FormScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20, paddingVertical: 28 }}>
        <View style={{ width: '100%', maxWidth: 460, alignSelf: 'center' }}>
          <View className="items-center mb-6 px-2">
            <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="w-20 h-20 rounded-3xl bg-indigo-600 items-center justify-center mb-3">
              <Ionicons name="calculator-outline" size={40} color="#fff" />
              <View className="absolute -right-1 -top-1 w-7 h-7 rounded-full bg-indigo-100 items-center justify-center">
                <Ionicons name="sparkles" size={16} color="#4f46e5" />
              </View>
            </View>
            <Text className="text-xl font-bold text-indigo-700 text-center">{appName}</Text>
            <Text className="text-gray-500 text-sm text-center mt-1">Valorize cada criação.</Text>
          </View>

          <View className="bg-white rounded-2xl border border-gray-200 p-5">
            {!sent && <>
              <Text accessibilityRole="header" className="text-2xl font-bold text-gray-900">{title}</Text>
              <Text className="text-gray-600 text-sm leading-5 mt-2 mb-5">{description}</Text>
            </>}
            {sent ? (
              <View>
                <View className="w-14 h-14 rounded-2xl bg-indigo-50 items-center justify-center mb-4"><Ionicons name="mail-unread-outline" size={29} color="#4f46e5" /></View>
                <Text accessibilityRole="alert" className="text-xl font-bold text-gray-900 mb-2">Confira seu e-mail</Text>
                <Text className="text-gray-600 leading-6">Se existir uma conta com esse endereço, você receberá um link para redefinir sua senha. Confira também a caixa de spam.</Text>
                <Pressable accessibilityRole="button" onPress={() => switchRecovery(false)} className="bg-indigo-600 rounded-xl min-h-12 px-4 py-3 items-center justify-center mt-5 active:bg-indigo-700">
                  <Text className="text-white font-bold text-center">Voltar para entrar</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => { setSent(false); setError(''); }} className="min-h-12 justify-center mt-1">
                  <Text className="text-indigo-700 text-center font-semibold">Usar outro e-mail</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text className="text-gray-700 font-semibold mb-2">E-mail</Text>
                <View className={'flex-row items-center rounded-xl border mb-4 ' + (emailFocused ? 'bg-white border-indigo-500' : 'bg-gray-50 border-gray-200')}>
                  <View className="pl-3"><Ionicons name="mail-outline" size={20} color={emailFocused ? '#4f46e5' : '#6b7280'} /></View>
                  <TextInput accessibilityLabel="E-mail" className="flex-1 min-h-12 px-3 py-3 text-base text-gray-800" value={email} onChangeText={v => { setEmail(v); setError(''); }} onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} placeholder="seu@email.com" placeholderTextColor="#9ca3af" keyboardType="email-address" autoComplete="email" textContentType="emailAddress" autoCapitalize="none" autoCorrect={false} editable={!busy} />
                </View>
                {!recovering && <PasswordField authStyle label="Senha" value={password} onChangeText={v => { setPassword(v); setError(''); }} busy={busy} newPassword={registering} />}
                {!recovering && registering && (
                  <>
                    <Text className="text-gray-500 text-xs leading-4 -mt-2 mb-4">Use pelo menos 6 caracteres. Prefira uma senha longa e exclusiva.</Text>
                    <PasswordField authStyle label="Confirmar senha" value={confirmation} onChangeText={v => { setConfirmation(v); setError(''); }} busy={busy} newPassword />
                  </>
                )}
                {!recovering && !registering && onReset && (
                  <Pressable accessibilityRole="button" disabled={busy} onPress={() => switchRecovery(true)} className="self-end min-h-11 justify-center -mt-2 mb-2">
                    <Text className="text-indigo-700 font-semibold text-sm">Esqueci minha senha</Text>
                  </Pressable>
                )}
                {!!error && <View accessibilityRole="alert" className="bg-red-50 rounded-xl p-3 mb-4 flex-row items-start gap-2"><Ionicons name="alert-circle-outline" size={20} color="#b91c1c" /><Text className="text-red-700 text-sm leading-5 flex-1">{error}</Text></View>}
                <Pressable accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} disabled={busy} onPress={() => void submit()} className={'rounded-xl min-h-12 px-4 py-3 flex-row items-center justify-center gap-2 ' + (busy ? 'bg-indigo-400' : 'bg-indigo-600 active:bg-indigo-700')}>
                  {busy ? <ActivityIndicator color="#fff" /> : <>
                    <Text className="text-white text-center font-bold text-base shrink">{recovering ? 'Enviar link de recuperação' : registering ? 'Criar conta' : 'Entrar'}</Text>
                    <Ionicons name="arrow-forward" size={20} color="#fff" />
                  </>}
                </Pressable>
                {recovering && <Pressable accessibilityRole="button" disabled={busy} onPress={() => switchRecovery(false)} className="min-h-12 justify-center mt-1"><Text className="text-indigo-700 text-center font-semibold">Voltar para entrar</Text></Pressable>}
              </>
            )}
          </View>
          {!recovering && (
            <View className="mt-5 items-center">
              <Text className="text-gray-600 text-sm text-center">{registering ? 'Já possui uma conta?' : 'Ainda não possui uma conta?'}</Text>
              <Pressable accessibilityRole="button" disabled={busy} onPress={onSwitch} className="min-h-12 px-4 justify-center">
                <Text className="text-indigo-700 font-bold text-center">{registering ? 'Entrar na minha conta' : 'Criar uma conta'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </FormScrollView>
    </SafeAreaView>
  );
}
