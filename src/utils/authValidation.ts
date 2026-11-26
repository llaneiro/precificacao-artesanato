export const MIN_PASSWORD_LENGTH = 6;

export function validEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateNewPassword(password: string, confirmation: string): string {
  if (password.length < MIN_PASSWORD_LENGTH) return 'A senha precisa ter pelo menos 6 caracteres.';
  if (password !== confirmation) return 'As senhas não coincidem.';
  return '';
}

export function authErrorCode(error: unknown): string {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string' ? error.code : '';
}

export function authErrorMessage(error: unknown): string {
  switch (authErrorCode(error)) {
    case 'auth/invalid-email': return 'Informe um e-mail válido.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
    case 'auth/wrong-password':
    case 'auth/user-not-found': return 'E-mail ou senha incorretos.';
    case 'auth/email-already-in-use': return 'Não foi possível cadastrar este e-mail. Tente entrar na sua conta ou recuperar a senha.';
    case 'auth/weak-password':
    case 'auth/password-does-not-meet-requirements': return 'A senha não atende aos requisitos de segurança.';
    case 'auth/network-request-failed': return 'Verifique sua conexão com a internet e tente novamente.';
    case 'auth/too-many-requests':
    case 'auth/quota-exceeded': return 'Muitas tentativas. Tente novamente mais tarde.';
    case 'auth/user-disabled': return 'Esta conta está desativada.';
    case 'auth/requires-recent-login':
    case 'auth/user-token-expired':
    case 'auth/invalid-user-token': return 'Entre novamente na sua conta para continuar.';
    case 'auth/operation-not-allowed': return 'Esta operação não está disponível no momento.';
    default: return 'Não foi possível concluir a operação. Tente novamente.';
  }
}

export function passwordChangeErrorMessage(error: unknown): string {
  const code = authErrorCode(error);
  if (['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(code)) {
    return 'A senha atual está incorreta.';
  }
  return authErrorMessage(error);
}


export function validateDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Informe seu nome ou o nome do ateliê.';
  if (trimmed.length > 60) return 'Use até 60 caracteres.';
  return '';
}
