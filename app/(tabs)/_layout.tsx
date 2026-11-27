import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

export const unstable_settings = { initialRouteName: 'index' };

type IconName = ComponentProps<typeof Ionicons>['name'];
function tabIcon(active: IconName, inactive: IconName) {
  return ({ focused, color, size }: { focused: boolean; color: ColorValue | null; size: number }) =>
    <Ionicons name={focused ? active : inactive} color={typeof color === "number" ? undefined : color ?? undefined} size={size} />;
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerStyle: { backgroundColor: '#4f46e5' },
      headerTintColor: '#fff',
      tabBarActiveTintColor: '#4f46e5',
      tabBarInactiveTintColor: '#6b7280',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e5e7eb' },
      tabBarLabelStyle: { fontSize: 12 },
      animation: 'none',
    }} backBehavior="initialRoute">
      <Tabs.Screen name="index" options={{ title: 'Precifica Arte', tabBarLabel: 'Início', tabBarIcon: tabIcon('home', 'home-outline') }} />
      <Tabs.Screen name="products" options={{ title: 'Produtos', tabBarIcon: tabIcon('cube', 'cube-outline') }} />
      <Tabs.Screen name="materials" options={{ title: 'Materiais', tabBarIcon: tabIcon('layers', 'layers-outline') }} />
      <Tabs.Screen name="expenses" options={{ title: 'Central financeira', tabBarLabel: 'Financeiro', tabBarIcon: tabIcon('wallet', 'wallet-outline') }} />
      <Tabs.Screen name="more" options={{ title: 'Mais', tabBarIcon: tabIcon('ellipsis-horizontal', 'ellipsis-horizontal-outline') }} />
    </Tabs>
  );
}
