import { useCallback, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { AuthUser, UseAuthReturn } from '../types/auth';
import { authErrorCode, validateDisplayName } from '../utils/authValidation';

// Centraliza a lógica de autenticação, sem chamadas ao Firebase nas telas.
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // O observador acompanha login, logout e restauração da sessão.
    return onAuthStateChanged(auth, firebaseUser => {
      setUser(firebaseUser ? {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      } : null);
      setLoading(false);
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    // Não distingue endereços cadastrados e desconhecidos.
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (error) {
      if (authErrorCode(error) !== 'auth/user-not-found') throw error;
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const current = auth.currentUser;
    if (!current?.email) throw new Error('Sessão indisponível.');
    await reauthenticateWithCredential(current, EmailAuthProvider.credential(current.email, currentPassword));
    if (auth.currentUser?.uid !== current.uid) throw new Error('Sessão alterada.');
    await updatePassword(current, newPassword);
  }, []);

  const updateDisplayName = useCallback(async (name: string) => {
    const validation = validateDisplayName(name);
    if (validation) throw new Error(validation);
    const current = auth.currentUser;
    if (!current) throw new Error('Sessão indisponível.');
    const displayName = name.trim();
    await updateProfile(current, { displayName });
    // Atualiza o contexto imediatamente, sem depender de novo login.
    if (auth.currentUser?.uid === current.uid) {
      setUser(previous => previous?.uid === current.uid ? { ...previous, displayName } : previous);
    }
  }, []);

  return { user, loading, signIn, signUp, signOut, resetPassword, changePassword, updateDisplayName };
}
