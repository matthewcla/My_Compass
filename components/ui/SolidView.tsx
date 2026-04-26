import React from 'react';
import { View, ViewProps } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

export interface SolidViewProps extends ViewProps {
    intensity?: number; // Kept for interface compatibility but ignored
    tint?: 'light' | 'dark' | 'default'; // Kept for interface compatibility
    className?: string;
}

export function SolidView({
    intensity = 50,
    tint = 'light',
    className,
    style,
    children,
    ...props
}: SolidViewProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <View
            className={`bg-white dark:bg-[#18181B] ${className || ''}`}
            style={[
                { overflow: 'hidden' },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}
