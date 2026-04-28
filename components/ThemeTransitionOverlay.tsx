import { useUIStore } from '@/store/useUIStore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function ThemeTransitionOverlay() {
    const themeTransitionColor = useUIStore((state) => state.themeTransitionColor);
    const setThemeTransitionColor = useUIStore((state) => state.setThemeTransitionColor);

    // Explicitly grab window dimensions to ensure we strictly cover all edge safe areas
    const { width, height } = useWindowDimensions();

    const [activeColor, setActiveColor] = useState<string | null>(null);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    useEffect(() => {
        if (themeTransitionColor) {
            // 1. Instantly paint the solid mask color over the exact current state
            setActiveColor(themeTransitionColor);
            opacity.value = 1;

            // Start the "inhale" scale effect instantly 
            scale.value = withTiming(1.02, { duration: 150, easing: Easing.out(Easing.ease) });

            // 2. We wait 1 requestAnimationFrame for React to update the DOM,
            //    and NativeWind to parse the new theme and swap CSS variables underneath the mask
            requestAnimationFrame(() => {
                // 3. Elegantly dissolve the old color mask, revealing the new theme
                //    Use a luxuriously slow custom bezier curve (fast start, long tail)
                opacity.value = withTiming(0, {
                    duration: 600,
                    easing: Easing.bezier(0.25, 0.1, 0.25, 1)
                }, (finished) => {
                    if (finished) {
                        runOnJS(setThemeTransitionColor)(null);
                        runOnJS(setActiveColor)(null);
                    }
                });

                // Exhale back to normal scale
                scale.value = withTiming(1, { duration: 450, easing: Easing.inOut(Easing.ease) });
            });
        }
    }, [themeTransitionColor]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    if (!activeColor) return null;

    return (
        <Animated.View
            key="transition-mask"
            style={[
                StyleSheet.absoluteFillObject,
                {
                    backgroundColor: activeColor,
                    zIndex: 99999,
                    width,
                    height,
                },
                animatedStyle
            ]}
            pointerEvents="none"
        />
    );
}
