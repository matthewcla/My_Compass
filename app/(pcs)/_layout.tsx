import { Stack } from 'expo-router';
import React from 'react';

export default function PCSLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="orders" />
      <Stack.Screen name="move" />
    </Stack>
  );
}
