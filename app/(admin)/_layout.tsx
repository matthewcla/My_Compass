import { Tabs, useNavigation } from 'expo-router';
import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { FileText, Menu } from 'lucide-react-native';
import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function AdminLayout() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CompositeTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: 'My Admin',
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
        name="admin"
        options={{
          title: 'Admin',
          tabBarLabel: 'Admin',
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
