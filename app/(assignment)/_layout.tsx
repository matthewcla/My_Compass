import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack, useSegments } from 'expo-router';
import React from 'react';

export default function AssignmentLayout() {
  const segments = useSegments();

  // Check if we are on the 'cycle' screen to hide the tab bar
  const isCycle = segments[segments.length - 1] === 'cycle';

  return (
    <>
      <GlobalHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="cycle" />
      </Stack>

      {/* Show Tab Bar only if NOT on Cycle screen */}
      {!isCycle && <GlobalTabBar />}
    </>
  );
}
