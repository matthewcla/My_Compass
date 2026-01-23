import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Anchor, FileText, Map, User } from 'lucide-react-native';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { useColorScheme } from '@/components/useColorScheme';
import { WebHeader } from '@/components/WebHeader';
import Colors from '@/constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  const GlassBackground = () => {
    if (Platform.OS === 'android') {
      return (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(242, 242, 247, 0.8)' },
          ]}
        />
      );
    }
    return (
      <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        header: Platform.OS === 'web' ? () => <WebHeader /> : undefined,
        headerShown: Platform.OS === 'web' ? true : useClientOnlyValue(false, true),
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
          title: 'Assignments',
          tabBarLabel: 'Assignments',
          headerTitle: 'My Assignment',
          tabBarIcon: ({ color }) => <Anchor size={28} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="admin/index"
        options={{
          title: 'Admin',
          tabBarLabel: 'Admin',
          headerTitle: 'My Admin',
          tabBarIcon: ({ color }) => <FileText size={28} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="pcs/index"
        options={{
          title: 'PCS',
          tabBarLabel: 'PCS',
          headerTitle: 'My PCS',
          tabBarIcon: ({ color }) => <Map size={28} color={color} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color }) => <User size={28} color={color} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  );
}
