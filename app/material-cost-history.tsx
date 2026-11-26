import { Redirect, useLocalSearchParams } from 'expo-router';

// Compatibilidade com o endereço anterior: não há mais uma segunda interface.
export default function MaterialCostHistoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={{ pathname: '/material-details', params: { id: String(id), section: 'history' } }} />;
}
