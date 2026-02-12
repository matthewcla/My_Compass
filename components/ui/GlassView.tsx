import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, ViewProps } from 'react-native';

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
    const opacity = 0.5 + (intensity / 200);
    const fallbackBg = tint === 'dark'
        ? `rgba(0,0,0,${Math.min(opacity, 0.85)})`
        : `rgba(255,255,255,${Math.min(opacity, 0.85)})`;

    // Web: BlurView not supported — use opacity fallback
    if (Platform.OS === 'web') {
        return (
            <View
                className={className}
                style={[{ backgroundColor: fallbackBg }, style]}
                {...props}
            >
                {children}
            </View>
        );
    }

    // Native (iOS + Android): real blur via expo-blur
    // iOS: native UIVisualEffectView gaussian blur
    // Android: translucent dimmed surface (expo-blur fallback)
    return (
        <BlurView
            intensity={Math.min(intensity, 100)}
            tint={tint}
            className={className}
            style={[{ overflow: 'hidden' }, style]}
            {...props}
        >
            {children}
        </BlurView>
    );
}

