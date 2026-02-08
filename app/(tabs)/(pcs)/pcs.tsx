import { useScreenHeader } from '@/hooks/useScreenHeader';
import React from 'react';
import { View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PcsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    useScreenHeader("PCS", "Relocation Manager");

    return (
        <View
            className="flex-1 bg-slate-50 dark:bg-black"
            style={{
                backgroundColor: colorScheme === 'dark' ? '#000000' : '#f8fafc'
            }}
        >
            {/* <ScreenHeader
                title="PCS"
                subtitle="Relocation Manager"
            /> */}
        </View>
    );
}
