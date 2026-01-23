import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({
    width,
    height,
    borderRadius = 4,
    style,
}: SkeletonProps) {
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1000 }),
                withTiming(0.5, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Create a style object that considers width/height props but allows override via style prop
    const containerStyle: any = {
        width,
        height,
        borderRadius,
    };

    return (
        <Animated.View
            className="bg-gray-200 dark:bg-gray-700"
            style={[containerStyle, style, animatedStyle]}
        />
    );
}
