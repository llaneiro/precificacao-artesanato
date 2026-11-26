import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FormScrollView } from '../src/components/FormScrollView';
import { PasswordField } from '../src/components/PasswordField';
import { useAuthContext } from '../src/contexts/AuthContext';
import { validateNewPassword, passwordChangeErrorMessage, validateDisplayName, authErrorMessage } from '../src/utils/authValidation';

export default function AccountScreen() {
  const { user, changePassword, updateDisplayName, signOut } = useAuthContext();
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);
  const lock = useRef(false);
  const [nameEditing, setNameEditing] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSaved, setNameSaved] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const disabled = busy || leaving;
  const displayName = user?.displayName?.trim();
  const initials = displayName?.split(/\s+/).slice(0, 2).map(part => Array.from(part)[0]).join('').toUpperCase();

  async function saveName() {
    if (lock.current) return;
    const validation = validateDisplayName(name);
    setNameError(validation);
    if (validation) return;
    lock.current = true;
    setBusy(true);
    try {
      await updateDisplayName(name);
      setNameEditing(false);
      setNameSaved(true);
    } catch (e) {
      setNameError(authErrorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function confirmSignOut() {
    if (lock.current) return;
    Alert.alert('Sair da conta', 'Deseja sair? Os dados salvos neste aparelho serão mantidos.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        if (lock.current) return;
        lock.current = true;
        setLeaving(true);
        try { await signOut(); }
        catch { Alert.alert('Erro', 'Não foi possível sair da conta.'); }
        finally { lock.current = false; setLeaving(false); }
      } },
    ]);
  }

  function clearForm() {
    setCurrent('');
    setPassword('');
    setConfirmation('');
    setError('');
  }

  async function save() {
    if (lock.current) return;
    setSuccess(false);
    const validation = !current ? 'Informe sua senha atual.' : password === current ? 'Escolha uma senha diferente da atual.' : validateNewPassword(password, confirmation);
    setError(validation);
    if (validation) return;
    lock.current = true;
    setBusy(true);
    try {
      await changePassword(current, password);
      clearForm();
      setEditing(false);
      setSuccess(true);
    } catch (e) {
      setError(passwordChangeErrorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} className="flex-1 bg-gray-50">
      <FormScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        <View className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex-row items-center gap-3">
          <View className="w-12 h-12 rounded-full bg-indigo-100 items-center justify-center">
            {initials ? <Text className="text-indigo-700 font-bold text-lg">{initials}</Text> : <Ionicons name="person-outline" size={24} color="#4f46e5" />}
          </View>
          <View className="flex-1">
            <Text className="text-gray-800 font-bold">{displayName || 'Meu perfil'}</Text>
            <Text className="text-gray-500 mt-1" selectable>{user?.email}</Text>
          </View>
        </View>
        <Text className="text-lg font-bold text-gray-800 mb-3">Perfil</Text>
        <View className="bg-white border border-gray-200 rounded-2xl p-4 mb-5">
          {nameEditing ? (
            <>
              <Text className="text-gray-700 font-semibold mb-2">Nome ou nome do ateliê</Text>
              <TextInput accessibilityLabel="Nome ou nome do ateliê" value={name} onChangeText={v => { setName(v); setNameError(''); }} maxLength={60} editable={!disabled} autoCapitalize="words" placeholder="Como deseja aparecer?" className="bg-white border border-gray-300 rounded-xl px-4 py-3 text-base text-gray-800 mb-3" />
              {!!nameError && <Text accessibilityRole="alert" className="text-red-600 mb-3">{nameError}</Text>}
              <TouchableOpacity disabled={disabled} onPress={() => void saveName()} className={'rounded-xl p-3 ' + (disabled ? 'bg-indigo-400' : 'bg-indigo-600')}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white text-center font-bold">Salvar nome</Text>}
              </TouchableOpacity>
              <TouchableOpacity disabled={disabled} onPress={() => { setNameEditing(false); setNameError(''); }} className="pt-4 pb-1">
                <Text className="text-indigo-600 font-semibold text-center">Cancelar</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity accessibilityRole="button" disabled={disabled || editing} onPress={() => { setName(displayName || ''); setNameError(''); setNameSaved(false); setNameEditing(true); }} className="flex-row items-center gap-3">
              <Ionicons name="create-outline" size={24} color="#4f46e5" />
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">Nome ou nome do ateliê</Text>
                <Text className="text-gray-500 text-sm mt-1">{displayName || 'Adicionar nome'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
          {nameSaved && <Text accessibilityRole="alert" className="text-green-700 text-sm mt-3">Perfil atualizado.</Text>}
        </View>
        <Text className="text-lg font-bold text-gray-800 mb-3">Segurança</Text>
        {!!success && <View className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
          <Text accessibilityRole="alert" className="text-green-800 font-semibold">Senha alterada com sucesso.</Text>
        </View>}
        {!editing ? (
          <TouchableOpacity accessibilityRole="button" onPress={() => { setSuccess(false); setEditing(true); }} disabled={!user?.email || disabled || nameEditing} className="bg-white border border-gray-200 rounded-xl p-4 flex-row items-center gap-3">
            <Ionicons name="lock-closed-outline" size={24} color="#4f46e5" />
            <Text className="text-gray-800 font-semibold flex-1">Alterar senha</Text>
            <Ionicons name="chevron-forward" size={18} color="#6b7280" />
          </TouchableOpacity>
        ) : (
          <View className="bg-white rounded-2xl border border-gray-200 p-4">
            <Text className="text-gray-800 font-bold text-base mb-2">Alterar senha</Text>
            <Text className="text-gray-500 text-sm mb-4">Confirme sua senha atual para proteger sua conta.</Text>
            <PasswordField label="Senha atual" value={current} onChangeText={v => { setCurrent(v); setError(''); }} busy={busy} />
            <PasswordField label="Nova senha" value={password} onChangeText={v => { setPassword(v); setError(''); }} busy={busy} newPassword />
            <Text className="text-xs text-gray-500 -mt-2 mb-4">Use pelo menos 6 caracteres. Prefira uma senha longa e exclusiva.</Text>
            <PasswordField label="Confirmar nova senha" value={confirmation} onChangeText={v => { setConfirmation(v); setError(''); }} busy={busy} newPassword />
            {!!error && <Text accessibilityRole="alert" className="text-red-600 mb-4">{error}</Text>}
            <TouchableOpacity accessibilityRole="button" disabled={busy} onPress={() => void save()} className={'rounded-xl p-4 ' + (busy ? 'bg-indigo-400' : 'bg-indigo-600')}>
              {busy ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-center">Salvar nova senha</Text>}
            </TouchableOpacity>
            <TouchableOpacity disabled={busy} onPress={() => { clearForm(); setEditing(false); }} className="p-4">
              <Text className="text-indigo-600 font-semibold text-center">Cancelar</Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity accessibilityRole="button" disabled={disabled || editing || nameEditing} onPress={confirmSignOut} className="bg-white border border-gray-200 rounded-xl p-4 mt-6 flex-row items-center justify-center gap-2">
          <Ionicons name="log-out-outline" color="#dc2626" size={21} />
          <Text className="text-red-600 font-semibold">{leaving ? 'Saindo...' : 'Sair da conta'}</Text>
        </TouchableOpacity>
      </FormScrollView>
    </SafeAreaView>
  );
}
