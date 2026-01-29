import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack } from 'expo-router';
import React from 'react';

export default function PCSLayout() {
  return (
    <>
      <GlobalHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="orders" />
        <Stack.Screen name="move" />
      </Stack>
      <GlobalTabBar />
    </>
  );
}
