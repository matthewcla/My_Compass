import React from 'react';
import { View, ViewProps } from 'react-native';

export interface GlassViewProps extends ViewProps {
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    className?: string;
}

export function GlassView({
    intensity = 50,
    tint = 'light',
    className,
    style,
    children,
    ...props
}: GlassViewProps) {
    // Pure fallback to basic View to eliminate logic/hook risks
    const opacity = 0.5 + (intensity / 200);
    const backgroundColor = tint === 'dark'
        ? `rgba(0,0,0,${Math.min(opacity, 0.85)})`
        : `rgba(255,255,255,${Math.min(opacity, 0.85)})`;

    return (
        <View
            className={className}
            style={[
                { backgroundColor },
                style
            ]}
            {...props}
        >
            {children}
        </View>
    );
}
