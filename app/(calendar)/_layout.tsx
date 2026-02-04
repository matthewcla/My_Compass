import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function CalendarLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="calendar" />
      </Stack>
    </View>
  );
}
