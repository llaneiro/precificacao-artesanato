import { useRouter } from 'expo-router';
import { AuthForm } from '../src/components/AuthForm';
import { useAuthContext } from '../src/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuthContext();
  return <AuthForm onSubmit={signIn} onSwitch={() => router.push('/register')} />;
}
