import AnimatedGlobalTabBar from '@/components/navigation/GlobalTabBar';
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
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 0,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
            overflow: 'visible',
          },
          tabBarBackground: () => null,
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
