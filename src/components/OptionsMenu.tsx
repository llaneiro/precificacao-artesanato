import { useRef, useState, type ComponentProps, type ComponentRef } from 'react';
import { Modal, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

type MenuAction = {
  label: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
  destructive?: boolean;
};

export function OptionsMenu({ label, actions, disabled = false, color = '#6b7280' }: {
  label: string;
  actions: MenuAction[];
  disabled?: boolean;
  color?: string;
}) {
  const anchor = useRef<ComponentRef<typeof View>>(null);
  const [position, setPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const menuWidth = Math.min(190, window.width - 24);
  const menuHeight = actions.length * 52 + 12;
  const left = position ? Math.max(12, Math.min(position.x + position.width - menuWidth, window.width - menuWidth - 12)) : 12;
  const top = position ? Math.max(insets.top + 8, Math.min(
    position.y + position.height + 4 + menuHeight <= window.height - insets.bottom - 8
      ? position.y + position.height + 4 : position.y - menuHeight - 4,
    window.height - insets.bottom - menuHeight - 8,
  )) : 0;

  return <>
    <View ref={anchor} collapsable={false}>
      <Pressable accessibilityRole="button" accessibilityLabel={label}
        accessibilityState={{ disabled, expanded: position !== null }}
        disabled={disabled}
        onPress={() => anchor.current?.measureInWindow((x, y, width, height) => {
          if (width > 0 && height > 0) setPosition({ x, y, width, height });
        })}
        className="w-11 h-11 items-center justify-center rounded-lg">
        <Ionicons name="ellipsis-vertical" size={22} color={disabled ? '#d1d5db' : color} />
      </Pressable>
    </View>
    <Modal transparent visible={position !== null} animationType="none"
      statusBarTranslucent navigationBarTranslucent onRequestClose={() => setPosition(null)}>
      <View style={{ flex: 1 }}>
        <Pressable accessibilityLabel="Fechar opções" onPress={() => setPosition(null)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
        <View accessibilityViewIsModal style={{
          position: 'absolute', top, left, width: menuWidth, paddingVertical: 6,
          backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb',
          elevation: 8, shadowColor: '#000', shadowOpacity: 0.16, shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
        }}>
          {actions.map(action => <Pressable key={action.label} accessibilityRole="button"
            onPress={() => { setPosition(null); action.onPress(); }}
            className={'min-h-[52px] px-4 flex-row items-center gap-3 ' +
              (action.destructive ? 'active:bg-red-50' : 'active:bg-gray-100')}>
            <View className="w-6 items-center justify-center">
              <Ionicons name={action.icon} size={20} color={action.destructive ? '#dc2626' : '#374151'} />
            </View>
            <Text className={'flex-1 text-base font-medium ' + (action.destructive ? 'text-red-600' : 'text-gray-700')}>{action.label}</Text>
          </Pressable>)}
        </View>
      </View>
    </Modal>
  </>;
}
