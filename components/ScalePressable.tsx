import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ScalePressableProps extends PressableProps {
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}

export function ScalePressable({
    children,
    style,
    onPressIn,
    onPressOut,
    ...props
}: ScalePressableProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = (event: any) => {
        scale.value = withSpring(0.96, { damping: 10, stiffness: 300 });

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
                // Haptics might fail or be unavailable, fail silently
            });
        }

        onPressIn?.(event);
    };

    const handlePressOut = (event: any) => {
        scale.value = withSpring(1.0, { damping: 10, stiffness: 300 });
        onPressOut?.(event);
    };

    return (
        <AnimatedPressable
            {...props}
            style={[style, animatedStyle]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
        >
            {children}
        </AnimatedPressable>
    );
}
