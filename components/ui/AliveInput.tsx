import Colors from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { TextInput, TextInputProps, useColorScheme, View } from 'react-native';
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
        if (focused) return isDark ? '#3b82f6' : '#2563eb'; // blue focus
        if (isValid) return isDark ? '#334155' : '#e2e8f0'; // base
        return isDark ? '#334155' : '#e2e8f0';
    };

    const borderColor = useSharedValue(getTargetBorderColor(false));

    useEffect(() => {
        borderColor.value = withTiming(getTargetBorderColor(isFocused), { duration: 200 });
    }, [hasError, isValid, isDark, isFocused]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            borderColor: borderColor.value,
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
                className={`flex-row items-center bg-inputBackground rounded-2xl border px-4 shadow-sm ${containerClassName}`}
                style={[{ flexDirection: 'row', alignItems: 'center' }, animatedStyle]}
            >
                {icon && <View className="mr-3">{icon}</View>}
                <TextInput
                    {...props}
                    className="flex-1 text-base text-labelPrimary dark:text-white py-4"
                    placeholderTextColor={Colors.gray[500]}
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
