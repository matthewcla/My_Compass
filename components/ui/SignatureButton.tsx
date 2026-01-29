
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface SignatureButtonProps {
    onSign: () => void;
    isSubmitting: boolean;
    disabled?: boolean;
}

const DURATION = 1500;

export function SignatureButton({ onSign, isSubmitting, disabled }: SignatureButtonProps) {
    const isDark = useColorScheme() === 'dark';

    const progress = useSharedValue(0);
    const scale = useSharedValue(1);
    const [isComplete, setIsComplete] = useState(false);

    // Timer ref for haptics loop
    const hapticTimer = useRef<any>(null);

    const animatedProgressStyle = useAnimatedStyle(() => ({
        width: `${progress.value * 100}%`,
    }));

    const buttonScaleStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const startHaptics = useCallback(() => {
        let speed = 150;
        const tick = () => {
            if (progress.value >= 1) return;
            Haptics.selectionAsync();
            speed = Math.max(30, speed * 0.90); // Accelerate
            hapticTimer.current = setTimeout(tick, speed);
        };
        tick();
    }, []);

    const stopHaptics = useCallback(() => {
        if (hapticTimer.current) {
            clearTimeout(hapticTimer.current);
            hapticTimer.current = null;
        }
    }, []);

    const handlePressIn = () => {
        if (disabled || isSubmitting || isComplete) return;

        scale.value = withSpring(0.97);
        progress.value = withTiming(1, { duration: DURATION }, (finished) => {
            if (finished) {
                runOnJS(triggerSuccess)();
            }
        });
        startHaptics();
    };

    const handlePressOut = () => {
        if (isComplete) return;
        scale.value = withSpring(1);
        progress.value = withTiming(0, { duration: 200 });
        stopHaptics();
    };

    const triggerSuccess = () => {
        stopHaptics();
        setIsComplete(true);
        scale.value = withSpring(1);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Delay slighty to show success state before callback
        setTimeout(() => {
            onSign();
        }, 500);
    };

    return (
        <Animated.View style={[buttonScaleStyle]} className="w-full">
            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isSubmitting || isComplete}
                className={`h-14 w-full rounded-xl overflow-hidden relative items-center justify-center border ${disabled
                    ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    : 'bg-blue-600 border-blue-600'
                    }`}
            >
                {/* Progress Fill Layer */}
                {!disabled && !isComplete && !isSubmitting && (
                    <Animated.View
                        style={[
                            {
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                bottom: 0,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                            },
                            animatedProgressStyle
                        ]}
                    />
                )}

                {/* Success Fill Layer */}
                {isComplete && (
                    <View className="absolute inset-0 bg-green-500 items-center justify-center">
                        <Check size={24} color="white" strokeWidth={3} />
                    </View>
                )}

                {/* Label Layer */}
                {!isComplete && (
                    <View className="flex-row items-center gap-2">
                        {isSubmitting ? (
                            <>
                                <View className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <Text className="font-bold text-white text-base">Submitting...</Text>
                            </>
                        ) : (
                            <Text className={`font-bold text-base uppercase tracking-wider ${disabled ? 'text-slate-400 dark:text-slate-500' : 'text-white'
                                }`}>
                                {isSubmitting ? 'Sending...' : 'Hold to Sign'}
                            </Text>
                        )}
                    </View>
                )}
            </Pressable>
        </Animated.View>
    );
}



