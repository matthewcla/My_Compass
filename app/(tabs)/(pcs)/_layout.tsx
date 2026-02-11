import { Stack } from 'expo-router';
import React from 'react';

export default function PCSLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="pcs" />
      <Stack.Screen name="move" />
      <Stack.Screen name="financials/index" />
    </Stack>
  );
}
