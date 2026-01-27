import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { DrawerActions } from '@react-navigation/native';
import { Tabs, useNavigation } from 'expo-router';
import { ClipboardList, Menu, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable } from 'react-native';

export default function ProfileLayout() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CompositeTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: 'My Profile',
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
        name="preferences"
        options={{
          title: 'Preferences',
          tabBarLabel: 'Preferences',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="surveys"
        options={{
          title: 'Surveys',
          tabBarLabel: 'Surveys',
          tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
