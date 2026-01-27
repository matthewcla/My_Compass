import { Tabs, useNavigation } from 'expo-router';
import React from 'react';
import { DrawerActions } from '@react-navigation/native';
import { Pressable } from 'react-native';
import { Map, Menu } from 'lucide-react-native';
import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export default function PCSLayout() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();

  return (
    <Tabs
      tabBar={(props) => <CompositeTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerTitle: 'My PCS',
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
        name="pcs"
        options={{
          title: 'PCS',
          tabBarLabel: 'PCS',
          tabBarIcon: ({ color }) => <Map size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
