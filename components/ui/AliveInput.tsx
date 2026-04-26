import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Animated, { FadeInDown, FadeOutUp, useAnimatedStyle, useSharedValue, withSpring, withTiming, ZoomIn, ZoomOut } from 'react-native-reanimated';

interface AliveInputProps extends TextInputProps {
    icon?: React.ReactNode;
    containerClassName?: string;
    isValid?: boolean;
    hasError?: boolean;
    errorMessage?: string;
}

export function AliveInput({ icon, containerClassName, style, isValid, hasError, errorMessage, ...props }: AliveInputProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const [isFocused, setIsFocused] = useState(false);

    // Animation Values
    const scale = useSharedValue(1);

    // Determine target border color based on state
    const getTargetBorderColor = (focused: boolean) => {
        if (hasError) return '#ef4444'; // red-500
        if (isValid && focused) return isDark ? '#4ade80' : '#15803d'; // green validation
        if (focused) return isDark ? '#C9A227' : '#C9A227'; // gold focus
        if (isValid) return isDark ? '#334155' : '#E2E8F0'; // base
        return isDark ? '#334155' : '#E2E8F0';
    };

    const borderColor = useSharedValue(getTargetBorderColor(false));
    // Anchor point guidelines say: "bottom-border only or fully enclosed sharp boxes. When focused, the border weight increases from 1px to 3px in Gold."
    const borderWidth = useSharedValue(1);

    useEffect(() => {
        borderColor.value = withTiming(getTargetBorderColor(isFocused), { duration: 200 });
        borderWidth.value = withTiming(isFocused ? 3 : 1, { duration: 150 });
    }, [hasError, isValid, isDark, isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            borderColor: borderColor.value,
            borderWidth: borderWidth.value,
        };
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleFocus = (e: any) => {
        setIsFocused(true);
        scale.value = withSpring(1.02, { damping: 10, stiffness: 100 });
        props.onFocus?.(e);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBlur = (e: any) => {
        setIsFocused(false);
        scale.value = withSpring(1, { damping: 10, stiffness: 100 });
        props.onBlur?.(e);
    };

    return (
        <View className="mb-2">
            <Animated.View
                className={`flex-row items-center bg-inputBackground rounded-none px-5 shadow-none ${containerClassName}`}
                style={[{ flexDirection: 'row', alignItems: 'center' }, animatedStyle]}
            >
                {icon && <View className="mr-3">{icon}</View>}
                <TextInput
                    {...props}
                    className="flex-1 text-base text-labelPrimary dark:text-white py-4"
                    placeholderTextColor={isDark ? '#C4C6D0' : '#44474F'}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                {isValid && !hasError && (
                    <Animated.View entering={ZoomIn} exiting={ZoomOut} className="ml-2">
                        <Ionicons name="checkmark-circle" size={20} color={isDark ? '#4ade80' : '#15803d'} />
                    </Animated.View>
                )}
                {hasError && (
                    <Animated.View entering={ZoomIn} exiting={ZoomOut} className="ml-2">
                        <Ionicons name="close-circle" size={20} color="#ef4444" />
                    </Animated.View>
                )}
            </Animated.View>
            {hasError && errorMessage && (
                <Animated.Text
                    entering={FadeInDown.duration(200)}
                    exiting={FadeOutUp.duration(200)}
                    className="text-red-500 text-sm mt-1 ml-2"
                >
                    {errorMessage}
                </Animated.Text>
            )}
        </View>
    );
}
