/**
 * HHGWeightRing — Reusable animated ring gauge for HHG weight visualization.
 * Extracted from HHGWeightGaugeWidget for embedding in the Move Planner.
 * Accepts props rather than reading from the store directly.
 */
import { AlertTriangle, Package } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, {
    Easing,
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, CircleProps } from 'react-native-svg';

// Ring geometry
const RADIUS = 52;
const STROKE_WIDTH = 10;
const RING_SIZE = RADIUS * 2 + STROKE_WIDTH * 2;
const CENTER = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const formatLbs = (v: number) => `${Math.round(v).toLocaleString()} lbs`;

const getProgressColor = (pct: number): string => {
    if (pct > 100) return '#EF4444';
    if (pct > 80) return '#F59E0B';
    return '#10B981';
};

interface HHGWeightRingProps {
    estimatedWeight: number;
    maxWeight: number;
    isDark: boolean;
}

export function HHGWeightRing({ estimatedWeight, maxWeight, isDark }: HHGWeightRingProps) {
    const rawPercentage = useMemo(() => {
        if (maxWeight <= 0) return 0;
        return (estimatedWeight / maxWeight) * 100;
    }, [estimatedWeight, maxWeight]);

    const animatedTarget = clamp(rawPercentage, 0, 100);
    const displayPercentage = Math.max(0, Math.round(rawPercentage));
    const progressColor = getProgressColor(rawPercentage);
    const trackColor = isDark ? '#334155' : '#E2E8F0';
    const isOver = rawPercentage > 100;

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(animatedTarget, {
            duration: 900,
            easing: Easing.out(Easing.cubic),
        });
    }, [animatedTarget, progress]);

    const animatedProps = useAnimatedProps<CircleProps>(() => ({
        strokeDashoffset: CIRCUMFERENCE * (1 - progress.value / 100),
    }));

    if (maxWeight <= 0) {
        return (
            <View className="rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 px-4 py-5 items-center">
                <Package size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="mt-2 text-sm font-semibold text-slate-700 dark:text-zinc-200">
                    Configure your profile to see weight allowance
                </Text>
            </View>
        );
    }

    return (
        <View className="items-center">
            {/* Ring */}
            <View className="relative mb-3">
                <Svg width={RING_SIZE} height={RING_SIZE}>
                    <Circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        stroke={trackColor}
                        strokeWidth={STROKE_WIDTH}
                        fill="transparent"
                    />
                    <AnimatedCircle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        stroke={progressColor}
                        strokeWidth={STROKE_WIDTH}
                        fill="transparent"
                        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                        strokeLinecap="round"
                        rotation={-90}
                        origin={`${CENTER}, ${CENTER}`}
                        animatedProps={animatedProps}
                    />
                </Svg>

                <View className="absolute inset-0 items-center justify-center">
                    <Text
                        className={`text-2xl font-black ${rawPercentage > 100
                                ? 'text-red-500 dark:text-red-400'
                                : rawPercentage > 80
                                    ? 'text-amber-500 dark:text-amber-400'
                                    : 'text-emerald-500 dark:text-emerald-400'
                            }`}
                    >
                        {displayPercentage}%
                    </Text>
                    <Text className="text-[10px] text-slate-500 dark:text-slate-400">of limit</Text>
                </View>
            </View>

            {/* Labels */}
            <View className="flex-row justify-between w-full px-2">
                <View>
                    <Text className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Estimated</Text>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{formatLbs(estimatedWeight)}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Max Allowed</Text>
                    <Text className="text-sm font-bold text-slate-900 dark:text-white">{formatLbs(maxWeight)}</Text>
                </View>
            </View>

            {/* Over-limit badge */}
            {isOver && (
                <View className="mt-2 flex-row items-center rounded-full border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-3 py-1">
                    <AlertTriangle size={12} color={isDark ? '#fda4af' : '#dc2626'} />
                    <Text className="ml-1.5 text-[11px] font-semibold text-red-700 dark:text-red-300">Over Weight Limit</Text>
                </View>
            )}
        </View>
    );
}
