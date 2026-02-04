import { Stack } from 'expo-router';
import React from 'react';
import { Text, View } from 'react-native';

export default function CalendarScreen() {
    return (
        <>
            <Stack.Screen options={{ title: 'Calendar' }} />
            <View className="flex-1 items-center justify-center bg-white dark:bg-black">
                <Text className="text-xl font-bold dark:text-white">Calendar</Text>
            </View>
        </>
    );
}
