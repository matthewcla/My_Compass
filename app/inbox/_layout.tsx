import GlobalHeader from '@/components/navigation/GlobalHeader';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { Stack } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function InboxLayout() {
    return (
        <View style={{ flex: 1 }}>
            <GlobalHeader />
            <Stack screenOptions={{ headerShown: false }} />
            <GlobalTabBar />
        </View>
    );
}
