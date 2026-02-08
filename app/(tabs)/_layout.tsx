import { Tabs } from 'expo-router';
import React from 'react';
import AnimatedGlobalTabBar from '@/components/navigation/GlobalTabBar';
import { ScrollControlProvider } from '@/components/navigation/ScrollControlContext';

export default function TabLayout() {
  return (
    <ScrollControlProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
          },
        }}
        tabBar={(props) => {
          const routeName = props.state.routes[props.state.index].name;

          let activeRoute: 'home' | 'calendar' | 'inbox' = 'home';
          if (routeName === '(calendar)') {
            activeRoute = 'calendar';
          } else if (routeName === 'inbox') {
            activeRoute = 'inbox';
          }

          return <AnimatedGlobalTabBar activeRoute={activeRoute} />;
        }}
      >
        <Tabs.Screen name="(hub)" options={{ title: 'Home' }} />
        <Tabs.Screen name="(calendar)" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="inbox" options={{ title: 'Inbox' }} />

        <Tabs.Screen name="(career)" options={{ href: null }} />
        <Tabs.Screen name="(pcs)" options={{ href: null }} />
        <Tabs.Screen name="(admin)" options={{ href: null }} />
        <Tabs.Screen name="(profile)" options={{ href: null }} />
        <Tabs.Screen name="(assignment)" options={{ href: null }} />
      </Tabs>
    </ScrollControlProvider>
  );
}
