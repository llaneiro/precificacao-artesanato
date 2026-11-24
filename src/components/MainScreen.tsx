import { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Layout de conteúdo das telas principais; o menu pertence ao navegador Tabs.
export function MainScreen({ children }: { children: ReactNode }) {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        {children}
      </SafeAreaView>
    </View>
  );
}
