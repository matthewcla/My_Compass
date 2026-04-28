import ExpandableBottomDrawer from '@/components/navigation/ExpandableBottomDrawer';
import { ScrollControlProvider } from '@/components/navigation/ScrollControlContext';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <ScrollControlProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            display: 'none', // Hide standard tabs completely
          },
        }}
      >
        <Tabs.Screen name="(hub)" options={{ title: 'Home' }} />
        <Tabs.Screen name="(calendar)" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />

        <Tabs.Screen name="(career)" options={{ href: null }} />
        <Tabs.Screen name="(admin)" options={{ href: null }} />
        <Tabs.Screen name="(profile)" options={{ href: null }} />
      </Tabs>

      {/* New Global Bottom Drawer Prototype */}
      <ExpandableBottomDrawer />
    </ScrollControlProvider>
  );
}
