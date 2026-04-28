import { Stack } from 'expo-router';
import React from 'react';

export default function TravelClaimLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="history" options={{ headerShown: false }} />
      <Stack.Screen name="request" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
