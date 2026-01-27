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
    // Web Implementation using CSS filters via NativeWind classes or direct style
    // The prompt requested using NativeWind class 'backdrop-blur-md'

    // We can map intensity to tailwind blur classes roughly if we wanted to stick purely to classes,
    // or use inline styles for precision. The prompt asked for "using a standard '<View>' with NativeWind class 'backdrop-blur-md'".

    // I will append 'backdrop-blur-md' to the className.
    // I will also keep the tint logic for background color.

    const tintClass = tint === 'dark' ? 'bg-black/40' : 'bg-white/40';
    const combinedClassName = `${className || ''} backdrop-blur-md ${tintClass}`.trim();

    return (
        <View
            className={combinedClassName}
            style={style}
            {...props}
        >
            {children}
        </View>
    );
}
