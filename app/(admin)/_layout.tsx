import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack } from 'expo-router';
import React from 'react';

export default function AdminLayout() {
  return (
    <>
      <GlobalHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="requests" />
        <Stack.Screen name="pay-status" />
      </Stack>
      <GlobalTabBar />
    </>
  );
}
