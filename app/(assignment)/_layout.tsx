import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import { Tabs, useNavigation } from 'expo-router';
import { Anchor } from 'lucide-react-native';
import React from 'react';

export default function AssignmentLayout() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CompositeTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
