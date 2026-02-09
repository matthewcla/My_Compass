import { ScreenGradient } from '@/components/ScreenGradient';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import React from 'react';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PcsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    useScreenHeader("PCS", "Relocation Manager");

    return (
        <ScreenGradient>
            {/* <ScreenHeader
                title="PCS"
                subtitle="Relocation Manager"
            /> */}
        </ScreenGradient>
    );
}
