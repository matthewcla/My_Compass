import React from 'react';
import { View, ViewProps, useColorScheme } from 'react-native';

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

    // Completely opaque backgrounds as per Anchor Point guidelines
    const backgroundColor = isDark ? '#18181B' : '#FFFFFF';

    return (
        <View
            className={className}
            style={[
                { backgroundColor, overflow: 'hidden' },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
}
