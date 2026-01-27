import { Stack } from 'expo-router';
import React from 'react';

export default function AssignmentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="assignments" />
      <Stack.Screen name="cycle" />
    </Stack>
  );
}
