import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack } from 'expo-router';
import React from 'react';

export default function AssignmentLayout() {
  return (
    <>
      <GlobalHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="assignments" />
        <Stack.Screen name="cycle" />
      </Stack>
      <GlobalTabBar />
    </>
  );
}
