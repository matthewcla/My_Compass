import { useUIStore } from '@/store/useUIStore';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router';
import { Home, Inbox, UserCircle } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

export default function CompositeTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const router = useRouter();

  // Colors for active/inactive states
  const activeColor = '#0F172A'; // slate-900 (Navy-ish)
  const inactiveColor = '#94A3B8'; // slate-400

  // Filter out hidden routes (href: null)
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    // @ts-ignore: specific to expo-router
    return options.href !== null;
  });

  // Helper to render dynamic tab
  const renderDynamicTab = (index: number) => {
    const route = visibleRoutes[index];
    if (!route) return <View className="flex-1" />;

    const { options } = descriptors[route.key];
    const isFocused = state.routes[state.index].key === route.key;
    const color = isFocused ? activeColor : inactiveColor;

    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
          ? options.title
          : route.name;

    const onPress = () => {
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    const onLongPress = () => {
      navigation.emit({
        type: 'tabLongPress',
        target: route.key,
      });
    };

    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        className="flex-1 items-center justify-center gap-1"
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarButtonTestID}
      >
        {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
        {typeof label === 'string' ? (
          <Text style={{ color, fontSize: 10, fontWeight: isFocused ? '600' : '400' }}>
            {label}
          </Text>
        ) : null}
      </Pressable>
    );
  };

  return (
    <View className="flex-row h-24 bg-white border-t border-slate-200 items-center justify-around pb-4 shadow-sm">
      {/* Slot 1 (Fixed): Home */}
      <Pressable
        onPress={() => {
          router.replace('/(hub)');
        }}
        className="flex-1 items-center justify-center gap-1"
      >
        <Home size={24} color={inactiveColor} />
        <Text style={{ color: inactiveColor, fontSize: 10 }}>Home</Text>
      </Pressable>

      {/* Slot 2 (Dynamic): 1st Tab */}
      {renderDynamicTab(0)}

      {/* Slot 3 (Fixed): Inbox */}
      <Pressable
        onPress={() => router.push('/inbox')}
        className="flex-1 items-center justify-center gap-1"
      >
        <Inbox size={24} color={inactiveColor} />
        <Text style={{ color: inactiveColor, fontSize: 10 }}>Inbox</Text>
      </Pressable>

      {/* Slot 4 (Dynamic): 2nd Tab */}
      {renderDynamicTab(1)}

      {/* Slot 5 (Fixed): User Menu */}
      <Pressable
        onPress={() => useUIStore.getState().openAccountDrawer()}
        className="flex-1 items-center justify-center gap-1"
      >
        <UserCircle size={24} color={inactiveColor} />
        <Text style={{ color: inactiveColor, fontSize: 10 }}>Profile</Text>
      </Pressable>
    </View>
  );
}
