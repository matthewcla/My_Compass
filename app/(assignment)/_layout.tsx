import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import { Tabs, useNavigation } from 'expo-router';
import { Compass, Target } from 'lucide-react-native';
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
        name="assignments"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <Compass size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cycle"
        options={{
          title: 'My Cycle',
          tabBarLabel: 'Cycle',
          tabBarIcon: ({ color }) => <Target size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
