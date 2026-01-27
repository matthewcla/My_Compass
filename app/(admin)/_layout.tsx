import CompositeTabBar from '@/components/navigation/CompositeTabBar';
import { useColorScheme } from '@/components/useColorScheme';
import { Tabs, useNavigation } from 'expo-router';
import { DollarSign, FileText } from 'lucide-react-native';
import React from 'react';

export default function AdminLayout() {
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
        name="requests"
        options={{
          title: 'Requests',
          tabBarLabel: 'Requests',
          tabBarIcon: ({ color }) => <FileText size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pay-status"
        options={{
          title: 'Pay',
          tabBarLabel: 'Pay',
          tabBarIcon: ({ color }) => <DollarSign size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
