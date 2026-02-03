import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack, useSegments } from 'expo-router';
import React from 'react';

export default function CalendarLayout() {
  const segments = useSegments();
  const currentRoute = segments[segments.length - 1];
  const isScan = currentRoute === 'scan';

  return (
    <>
      {!isScan && <GlobalHeader />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="calendar" />
        <Stack.Screen name="scan" />
      </Stack>
      {!isScan && <GlobalTabBar />}
    </>
  );
}
