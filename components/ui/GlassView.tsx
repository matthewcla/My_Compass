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

    // Android: BlurView renders at ~2x perceived intensity vs iOS, and on
    // SDK < 31 it falls back to a dim translucent surface. Scale intensity
    // down and layer a semi-transparent background to ensure consistent
    // Glass Cockpit aesthetic across platforms.
    const isAndroid = Platform.OS === 'android';
    const adjustedIntensity = isAndroid
        ? Math.min(Math.round(intensity * 0.5), 60)
        : Math.min(intensity, 100);

    return (
        <BlurView
            intensity={adjustedIntensity}
            tint={tint}
            className={className}
            style={[
                { overflow: 'hidden' },
                // Android fallback: layer a subtle background so the surface
                // is never fully transparent even when BlurView degrades
                isAndroid && { backgroundColor: fallbackBg },
                style,
            ]}
            {...props}
        >
            {children}
        </BlurView>
    );
}

