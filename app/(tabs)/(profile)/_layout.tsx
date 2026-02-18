import GlobalHeader from '@/components/navigation/GlobalHeader';
import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
  return (
    <>
      <GlobalHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="profile" />
        <Stack.Screen name="preferences" />
        <Stack.Screen name="surveys" />
      </Stack>
    </>
  );
}
