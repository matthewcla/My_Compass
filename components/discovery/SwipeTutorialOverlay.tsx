import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const STORAGE_KEY = 'discovery_tutorial_seen';

/**
 * First-run overlay that teaches the 4 swipe gesture directions.
 * Renders on top of the discovery deck. Dismisses on tap and
 * persists dismissal to AsyncStorage.
 */
export function SwipeTutorialOverlay() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY).then(value => {
            if (value !== 'true') setVisible(true);
        });
    }, []);

    const dismiss = useCallback(() => {
        setVisible(false);
        AsyncStorage.setItem(STORAGE_KEY, 'true');
    }, []);

    if (!visible) return null;

    return (
        <Animated.View
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(200)}
            className="absolute inset-0 z-[100]"
        >
            <Pressable
                onPress={dismiss}
                className="flex-1 bg-black/70 items-center justify-center"
            >
                <View className="items-center gap-6 px-8">
                    <Text className="text-white text-xl font-black text-center mb-2">
                        Swipe to Decide
                    </Text>

                    {/* Grid of 4 directions */}
                    <View className="items-center gap-4">
                        {/* Up */}
                        <SwipeHint
                            icon={<ArrowUp size={28} color="#3B82F6" />}
                            label="Add to Slate"
                            color="text-blue-400"
                            direction="up"
                        />

                        {/* Left / Right row */}
                        <View className="flex-row items-center gap-12">
                            <SwipeHint
                                icon={<ArrowLeft size={28} color="#EF4444" />}
                                label="Pass"
                                color="text-red-400"
                                direction="left"
                            />
                            <SwipeHint
                                icon={<ArrowRight size={28} color="#22C55E" />}
                                label="Save"
                                color="text-green-400"
                                direction="right"
                            />
                        </View>

                        {/* Down */}
                        <SwipeHint
                            icon={<ArrowDown size={28} color="#F59E0B" />}
                            label="Later"
                            color="text-amber-400"
                            direction="down"
                        />
                    </View>

                    <Text className="text-slate-400 text-xs mt-4 text-center">
                        Tap anywhere to start
                    </Text>
                </View>
            </Pressable>
        </Animated.View>
    );
}

/* ─── Individual Hint ─────────────────────────────────────────────────────── */

function SwipeHint({
    icon,
    label,
    color,
    direction,
}: {
    icon: React.ReactNode;
    label: string;
    color: string;
    direction: 'up' | 'down' | 'left' | 'right';
}) {
    const offset = useSharedValue(0);

    useEffect(() => {
        const distance = 8;
        offset.value = withRepeat(
            withSequence(
                withTiming(distance, { duration: 600 }),
                withTiming(0, { duration: 600 })
            ),
            -1,
            true,
        );
    }, [offset]);

    const animStyle = useAnimatedStyle(() => {
        const isVertical = direction === 'up' || direction === 'down';
        const sign = direction === 'up' || direction === 'left' ? -1 : 1;
        return {
            transform: isVertical
                ? [{ translateY: offset.value * sign }]
                : [{ translateX: offset.value * sign }],
        };
    });

    return (
        <View className="items-center gap-1.5">
            <Animated.View style={animStyle}>
                <View className="w-16 h-16 rounded-full bg-white/10 border border-white/20 items-center justify-center">
                    {icon}
                </View>
            </Animated.View>
            <Text className={`text-sm font-bold ${color}`}>{label}</Text>
        </View>
    );
}
