import Colors from '@/constants/Colors';
import React, { useState } from 'react';
import { TextInput, TextInputProps, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface AliveInputProps extends TextInputProps {
    icon?: React.ReactNode;
    containerClassName?: string;
}

export function AliveInput({ icon, containerClassName, style, ...props }: AliveInputProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const [isFocused, setIsFocused] = useState(false);

    // Animation Values
    const scale = useSharedValue(1);
    const borderColor = useSharedValue(isDark ? '#334155' : '#e2e8f0'); // slate-700 : slate-200

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
            borderColor: borderColor.value,
        };
    });

    const handleFocus = (e: any) => {
        setIsFocused(true);
        scale.value = withSpring(1.02, { damping: 10, stiffness: 100 });
        borderColor.value = withTiming(isDark ? '#3b82f6' : '#2563eb', { duration: 200 }); // Blue focus
        props.onFocus?.(e);
    };

    const handleBlur = (e: any) => {
        setIsFocused(false);
        scale.value = withSpring(1, { damping: 10, stiffness: 100 });
        borderColor.value = withTiming(isDark ? '#334155' : '#e2e8f0', { duration: 200 });
        props.onBlur?.(e);
    };

    return (
        <Animated.View
            className={`flex-row items-center bg-inputBackground rounded-2xl border px-4 shadow-sm ${containerClassName}`}
            style={[animatedStyle]}
        >
            {icon && <View className="mr-3">{icon}</View>}
            <TextInput
                {...props}
                className="flex-1 text-base text-labelPrimary dark:text-white py-4"
                placeholderTextColor={Colors.gray[500]}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
        </Animated.View>
    );
}
