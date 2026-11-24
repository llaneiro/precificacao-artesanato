import { getApps, initializeApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import type { Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Configuração centralizada; os valores são carregados pelo Expo.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (Object.values(firebaseConfig).some(value => !value)) {
  throw new Error('Configure as variáveis do Firebase no arquivo .env.');
}

// Reutiliza a instância durante o Fast Refresh.
const existingApp = getApps().find(app => app.name === '[DEFAULT]');
const app = existingApp ?? initializeApp(firebaseConfig);

// Persiste a sessão no dispositivo, usando AsyncStorage no React Native.
// O SDK exporta esta função no bundle nativo, mas não nos tipos públicos.
const nativeAuth = FirebaseAuth as typeof FirebaseAuth & {
  getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
};

function createAuth() {
  if (existingApp || Platform.OS === 'web') return FirebaseAuth.getAuth(app);
  if (!nativeAuth.getReactNativePersistence) {
    throw new Error('Persistência nativa do Firebase indisponível.');
  }
  return FirebaseAuth.initializeAuth(app, {
    persistence: nativeAuth.getReactNativePersistence(AsyncStorage),
  });
}

export const auth = createAuth();

export default app;
