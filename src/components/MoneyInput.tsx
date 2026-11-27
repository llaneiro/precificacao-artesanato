import { TextInput, type TextInputProps } from 'react-native';
import { moneyInputText } from '../utils/currency';

type Props = Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  value: string;
  onChangeText: (value: string) => void;
};

// Mantém a mesma aparência dos formulários e impede mais de duas casas decimais.
export function MoneyInput({ value, onChangeText, ...props }: Props) {
  return <TextInput {...props} value={value} keyboardType="decimal-pad" onChangeText={text => {
    const next = moneyInputText(text);
    if (next !== null) onChangeText(next);
  }} />;
}
