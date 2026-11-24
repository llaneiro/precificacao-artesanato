import { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomNavigation, MainRoute } from './BottomNavigation';

// Compartilha o menu inferior apenas entre as telas principais.
// Formulários, login e cadastro continuam usando a Stack sem o menu.
export function MainScreen({ route, children }: { route: MainRoute; children: ReactNode }) {
  return (
    <View className="flex-1 bg-gray-50">
      <SafeAreaView edges={['left', 'right']} className="flex-1">
        {children}
      </SafeAreaView>
      <BottomNavigation activeRoute={route} />
    </View>
  );
}
