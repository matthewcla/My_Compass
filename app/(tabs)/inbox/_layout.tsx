import GlobalHeader from '@/components/navigation/GlobalHeader';
import { Stack, usePathname } from 'expo-router';
import React from 'react';
import { View } from 'react-native';

export default function InboxLayout() {
    const pathname = usePathname();
    const showGlobalHeader = pathname !== '/inbox';

    return (
        <View style={{ flex: 1 }}>
            {showGlobalHeader && <GlobalHeader />}
            <Stack screenOptions={{ headerShown: false }} />
        </View>
    );
}
