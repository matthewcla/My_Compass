import GlobalHeader from '@/components/navigation/GlobalHeader';
import { Stack, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function AdminLayout() {
  const pathname = usePathname();
  // Hide GlobalHeader on the admin hub screen — CollapsibleScaffold owns the header there
  const showGlobalHeader = pathname !== '/admin';

  return (
    <View style={{ flex: 1 }}>
      {showGlobalHeader && <GlobalHeader />}
      <Stack screenOptions={{ headerShown: false }} initialRouteName="admin">
        <Stack.Screen name="admin" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="pay-status" />
      </Stack>
    </View>
  );
}

