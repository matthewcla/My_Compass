import { Tabs, useNavigation } from 'expo-router';
import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { User, Menu } from 'lucide-react-native';
import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

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
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <User size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
