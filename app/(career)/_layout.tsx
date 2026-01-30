import { Stack } from 'expo-router';
import React from 'react';

export default function CareerLayout() {
    return (
        <>
            <Stack
                screenOptions={{
                    headerShown: false,
                }}
            >
                <Stack.Screen
                    name="discovery"
                    options={{
                        headerShown: false,
                    }}
                />
                <Stack.Screen
                    name="manifest"
                    options={{
                        presentation: 'modal',
                        headerShown: false,
                    }}
                />
            </Stack>
        </>
    );
}
