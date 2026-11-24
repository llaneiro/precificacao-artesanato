import { useRouter } from 'expo-router';
import { AuthForm } from '../src/components/AuthForm';
import { useAuthContext } from '../src/contexts/AuthContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp } = useAuthContext();
  return <AuthForm registering onSubmit={signUp} onSwitch={() => router.replace('/login')} />;
}
