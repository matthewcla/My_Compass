import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleProp, TouchableOpacity, TouchableOpacityProps, ViewStyle } from 'react-native';

interface ScalePressableProps extends TouchableOpacityProps {
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

    const handlePressIn = (event: any) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
                // Haptics might fail or be unavailable, fail silently
            });
        }
        onPressIn?.(event);
    };

    return (
        <TouchableOpacity
            {...props}
            style={style}
            activeOpacity={0.9} // Simulate the scale effect roughly with opacity
            onPressIn={handlePressIn}
            onPressOut={onPressOut}
        >
            {children}
        </TouchableOpacity>
    );
}
