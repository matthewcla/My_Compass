import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import { Tabs, useNavigation } from 'expo-router';
import React from 'react';

export default function HubLayout() {
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
        name="index"
        options={{
          // Hide from the tab bar so we only see the 3 persistent ones (Home, Inbox, Profile)
          href: null,
        }}
      />
    </Tabs>
  );
}
