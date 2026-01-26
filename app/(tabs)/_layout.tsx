import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Anchor, CircleUser, FileText, Map, User } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';

import { AccountDrawer } from '@/components/AccountDrawer';
import { useColorScheme } from '@/components/useColorScheme';
import { WebHeader } from '@/components/WebHeader';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [accountDrawerVisible, setAccountDrawerVisible] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const GlassBackground = () => {
    // ... (unchanged)
    if (Platform.OS === 'android') {
      // ...
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colorScheme === 'dark' ? '#000000' : 'rgba(242, 242, 247, 0.8)' },
          ]}
        />
      );
    }
    return (
      <BlurView intensity={80} tint={colorScheme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
    );
  };

  return (
    <>
      <AccountDrawer
        visible={accountDrawerVisible}
        onClose={() => setAccountDrawerVisible(false)}
      />
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerTintColor: Colors[colorScheme ?? 'light'].text,
          header: Platform.OS === 'web' && isDesktop ? () => <WebHeader /> : undefined,
          headerShown: Platform.OS === 'web' ? isDesktop : false,
          headerRight: undefined, // Controls are now inside ScreenHeader
          headerTransparent: Platform.OS === 'web' ? false : true,
          headerStyle: {
            borderBottomWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarStyle: {
            position: 'absolute',
            borderTopWidth: 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          tabBarBackground: () => <GlassBackground />,
          headerBackground: Platform.OS === 'web' ? undefined : () => <GlassBackground />,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="assignments/index"
          options={{
            title: 'Assign',
            tabBarLabel: 'Assign',
            headerTitle: '',
            headerShown: false,
            tabBarIcon: ({ color }) => <Anchor size={28} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="admin/index"
          options={{
            title: 'Admin',
            tabBarLabel: 'Admin',
            headerTitle: '',
            tabBarIcon: ({ color }) => <FileText size={28} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="pcs/index"
          options={{
            title: 'PCS',
            tabBarLabel: 'PCS',
            headerTitle: '',
            tabBarIcon: ({ color }) => <Map size={28} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="profile/index"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            headerTitle: '',
            tabBarIcon: ({ color }) => <User size={28} color={color} strokeWidth={1.5} />,
          }}
        />
        <Tabs.Screen
          name="settings_placeholder"
          options={{
            title: 'Account',
            tabBarLabel: '', // Show no label for the control? Or 'Settings'? User asked for "elegant user profile selector", circle user icon usually implies account.
            headerShown: false,
            tabBarIcon: ({ color }) => <CircleUser size={28} color={color} strokeWidth={1.5} />,
          }}
          listeners={() => ({
            tabPress: (e) => {
              e.preventDefault();
              setAccountDrawerVisible(true);
            },
          })}
        />
      </Tabs>
    </>
  );
}
