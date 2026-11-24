import { ComponentProps } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const NAV_ITEMS = [
  { route: '/', label: 'Início', icon: 'home-outline', activeIcon: 'home' },
  { route: '/products', label: 'Produtos', icon: 'cube-outline', activeIcon: 'cube' },
  { route: '/materials', label: 'Materiais', icon: 'layers-outline', activeIcon: 'layers' },
  { route: '/expenses', label: 'Financeiro', icon: 'wallet-outline', activeIcon: 'wallet' },
  { route: '/more', label: 'Mais', icon: 'ellipsis-horizontal-outline', activeIcon: 'ellipsis-horizontal' },
] as const satisfies readonly {
  route: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  activeIcon: ComponentProps<typeof Ionicons>['name'];
}[];

export type MainRoute = (typeof NAV_ITEMS)[number]['route'];

export function BottomNavigation({ activeRoute }: { activeRoute: MainRoute }) {
  const router = useRouter();

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} className="bg-white border-t border-gray-200">
      <View className="flex-row">
        {NAV_ITEMS.map(item => {
          const selected = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected }}
              onPress={() => {
                // Mantém a tela inicial como base da pilha e evita empilhar
                // uma nova rota a cada troca de aba.
                if (selected) return;
                if (activeRoute === '/' || item.route === '/') router.navigate(item.route);
                else router.replace(item.route);
              }}
              className="flex-1 items-center justify-center py-3 gap-1"
            >
              <Ionicons name={selected ? item.activeIcon : item.icon} size={23} color={selected ? '#4f46e5' : '#6b7280'} />
              <Text
                numberOfLines={1}
                className={'text-xs ' + (selected ? 'font-bold text-indigo-600' : 'text-gray-500')}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}
