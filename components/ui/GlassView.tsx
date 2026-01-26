import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, View, ViewProps } from 'react-native';
// But wait, user didn't have cn utility set up in instructions. I should implement inline or check if utils exists.
// User asked to install clsx and tailwind-merge, implying I might need to use them or create a util.
// I will create a simple utility if I can't find one, or just usage inline for now to be safe.
// Actually, standard practice with clsx/tailwind-merge is a util. I'll stick to direct usage or standard View props for now to minimize assumptions, 
// OR simpler: `className` prop is handled by nativewind on View/BlurView automatically.
// I will assume `className` works on View and BlurView via NativeWind.

interface GlassViewProps extends ViewProps {
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    className?: string; // NativeWind will handle this but good to type it if using TypeScript
}

export function GlassView({
    intensity = 50,
    tint = 'light',
    className,
    style,
    children,
    ...props
}: GlassViewProps) {

    if (Platform.OS === 'ios') {
        return (
            <BlurView
                intensity={intensity}
                tint={tint}
                className={className}
                style={style}
                {...props}
            >
                {children}
            </BlurView>
        );
    }

    if (Platform.OS === 'android') {
        // Android Fallback: Semi-transparent background
        // Calculate opacity based on intensity (roughly)
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

    // Web Implementation
    if (Platform.OS === 'web') {
        // NativeWind handles className, but we need to ensure backdrop-filter style is applied.
        // We can mix style prop. 
        // Note: React Native Web doesn't support backdropFilter in strict style types usually, might need simple casting or valid CSS.
        const webStyle = {
            backdropFilter: `blur(${intensity * 0.2}px)`,
            WebkitBackdropFilter: `blur(${intensity * 0.2}px)`, // Safari
            backgroundColor: tint === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)', // Base transparency for glass
        } as any;

        return (
            <View
                className={className}
                style={[webStyle, style]}
                {...props}
            >
                {children}
            </View>
        );
    }

    return (
        <View className={className} style={style} {...props}>
            {children}
        </View>
    );
}
