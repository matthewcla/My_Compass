import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack, useSegments } from 'expo-router';
import React from 'react';

export default function AssignmentLayout() {
  const segments = useSegments();
  const isCycle = segments[segments.length - 1] === 'cycle';

  return (
    <>
      {!isCycle && <GlobalHeader />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="assignments" />
        <Stack.Screen name="cycle" />
      </Stack>
      {!isCycle && <GlobalTabBar />}
    </>
  );
}
