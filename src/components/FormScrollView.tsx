import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import type { ScrollViewProps } from 'react-native';

// Mantém o campo em foco acima do teclado e permite rolar o formulário
// inteiro, inclusive até o botão de salvar, sem fechar o teclado.
export function FormScrollView({ style, ...props }: ScrollViewProps) {
  return (
    <KeyboardAwareScrollView
      {...props}
      style={[{ flex: 1 }, style]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="none"
      nestedScrollEnabled
    />
  );
}
