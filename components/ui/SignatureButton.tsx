
import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import Animated, {
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SignatureButtonProps {
    onSign: () => void;
    isSubmitting: boolean;
    disabled?: boolean;
}

const DURATION = 1500;
const CIRCLE_LENGTH = 100; // Circumference
const R = CIRCLE_LENGTH / (2 * Math.PI);

export function SignatureButton({ onSign, isSubmitting, disabled }: SignatureButtonProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const progress = useSharedValue(0);
    const scale = useSharedValue(1);
    const [isComplete, setIsComplete] = useState(false);

    // Timer ref for haptics loop
    const hapticTimer = useRef<any>(null);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
    }));

    const buttonStyle = useAnimatedStyle(() => ({
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

        scale.value = withSpring(0.95);
        progress.value = withTiming(1, { duration: DURATION }, (finished) => {
            if (finished) {
                // Success!
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
        scale.value = withSpring(1.1, {}, () => {
            scale.value = withSpring(1);
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Delay slighty to show success state before callback
        setTimeout(() => {
            onSign();
        }, 500);
    };

    // Need to runOnJS because triggerSuccess is called from UI thread (reanimated callback)
    // However, triggerSuccess is defined in component scope, so we wrap it.
    // Reanimated's runOnJS helper needs to be imported if used inside worklet.
    // But here withTiming callback runs on UI thread.

    // Correction: I need to import runOnJS.

    return (
        <View className="items-center justify-center">
            {/* Background Track */}
            <View style={{ position: 'absolute' }}>
                <Svg width={64} height={64}>
                    <Circle
                        cx={32}
                        cy={32}
                        r={R}
                        stroke={isDark ? "#1e293b" : "#e2e8f0"}
                        strokeWidth={4}
                        fill="transparent"
                    />
                    <AnimatedCircle
                        cx={32}
                        cy={32}
                        r={R}
                        stroke={isDark ? "#3b82f6" : "#2563eb"} // Blue-500/600
                        strokeWidth={4}
                        fill="transparent"
                        strokeDasharray={CIRCLE_LENGTH}
                        strokeLinecap="round"
                        animatedProps={animatedProps}
                        rotation="-90"
                        origin="32, 32"
                    />
                </Svg>
            </View>

            <Pressable
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled || isSubmitting || isComplete}
                className="items-center justify-center w-16 h-16 rounded-full"
            >
                <Animated.View
                    style={[buttonStyle]}
                    className={`w-12 h-12 rounded-full items-center justify-center ${isComplete
                        ? 'bg-green-500'
                        : (disabled ? 'bg-slate-700' : 'bg-blue-600')
                        }`}
                >
                    {isSubmitting ? (
                        <View className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        // Note: animate-spin might not work in RN without nativewind configuration, 
                        // but simpler to just show text or icon. Let's use text for simplicity or keep static for now.
                        // Actually, let's just show an empty view or opacity pulse.
                    ) : isComplete ? (
                        <Check size={24} color="white" />
                    ) : (
                        <Text className="text-white font-bold text-xs">HOLD</Text>
                    )}
                </Animated.View>
            </Pressable>

            <View className="absolute top-16 mt-2">
                <Text className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">
                    {isComplete ? 'Signed' : (isSubmitting ? 'Sending...' : 'Hold to Sign')}
                </Text>
            </View>
        </View>
    );
}

// Helper to run on JS
import { runOnJS } from 'react-native-reanimated';
