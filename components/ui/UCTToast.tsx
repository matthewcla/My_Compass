import { useColorScheme } from '@/components/useColorScheme';
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface UCTToastProps {
    message: string;
    visible: boolean;
    onDismiss: () => void;
    duration?: number;
}

export function UCTToast({
    message,
    visible,
    onDismiss,
    duration = 2500,
}: UCTToastProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const translateY = useSharedValue(100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (!visible) {
            translateY.value = 100;
            opacity.value = 0;
            return;
        }

        translateY.value = withSpring(0, { damping: 20 });
        opacity.value = withTiming(1, { duration: 200 });
    }, [opacity, translateY, visible]);

    useEffect(() => {
        if (!visible) return;

        const timer = setTimeout(() => {
            onDismiss();
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [duration, onDismiss, visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    if (!visible) return null;

    return (
        <Animated.View
            className="absolute left-4 right-4 z-50 rounded-xl bg-slate-900 px-5 py-3.5 shadow-lg dark:bg-slate-100"
            style={[
                { bottom: 60 },
                {
                    elevation: 8,
                    shadowColor: isDark ? '#0f172a' : '#000000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.28,
                    shadowRadius: 8,
                },
                animatedStyle,
            ]}
        >
            <Text className="text-center text-sm font-semibold text-white dark:text-slate-900">
                {message}
            </Text>
        </Animated.View>
    );
}
