import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';

interface ScreenGradientProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/**
 * Standard screen background gradient matching the Home Hub.
 *
 * Dark:  Slate-900 (#0f172a) → Slate-950 (#020617)
 * Light: Slate-50  (#f8fafc) → Slate-200 (#e2e8f0)
 */
export function ScreenGradient({ children, style }: ScreenGradientProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <LinearGradient
            colors={isDark ? Colors.gradient.dark : Colors.gradient.light}
            style={[{ flex: 1 }, style]}
        >
            {children}
        </LinearGradient>
    );
}
