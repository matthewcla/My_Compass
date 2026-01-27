import { Tabs, useNavigation } from 'expo-router';
import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { Anchor, Menu } from 'lucide-react-native';
import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function AssignmentLayout() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CompositeTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: 'My Assignment',
        headerLeft: () => (
          <Pressable
            onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
            style={{ marginLeft: 16 }}
          >
             <Menu color={Colors[colorScheme ?? 'light'].text} size={24} />
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="assignments/index"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <Anchor size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="settings_placeholder" options={{ href: null }} />
    </Tabs>
  );
}
