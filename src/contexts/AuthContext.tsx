import { createContext, useContext, type ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthContextType } from '../types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Uma única instância do hook para todas as telas.
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuthContext deve ser usado dentro do AuthProvider.');
  return context;
}

export default AuthProvider;
