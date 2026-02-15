import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { AlertTriangle, Package } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, CircleProps } from 'react-native-svg';

const RADIUS = 60;
const STROKE_WIDTH = 12;
const RING_SIZE = RADIUS * 2 + STROKE_WIDTH * 2;
const CENTER = RING_SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const formatLbs = (value: number): string => `${Math.round(value).toLocaleString()} lbs`;

const getProgressColor = (percentage: number): string => {
  if (percentage > 100) return '#EF4444';
  if (percentage > 80) return '#F59E0B';
  return '#10B981';
};

export function HHGWeightGaugeWidget() {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const hhg = usePCSStore((state) => state.financials.hhg);
  const maxWeightAllowance = hhg?.maxWeightAllowance ?? 0;
  const estimatedWeight = hhg?.estimatedWeight ?? 0;
  const isOverLimit = hhg?.isOverLimit ?? false;

  const rawPercentage = useMemo(() => {
    if (maxWeightAllowance <= 0) return 0;
    return (estimatedWeight / maxWeightAllowance) * 100;
  }, [estimatedWeight, maxWeightAllowance]);

  const animatedTarget = clamp(rawPercentage, 0, 100);
  const displayPercentage = Math.max(0, Math.round(rawPercentage));
  const progressColor = getProgressColor(rawPercentage);
  const trackColor = isDark ? '#334155' : '#E2E8F0';

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(animatedTarget, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });
  }, [animatedTarget, progress]);

  const animatedProps = useAnimatedProps<CircleProps>(() => ({
    strokeDashoffset: CIRCUMFERENCE * (1 - progress.value / 100),
  }));

  const handleEstimatePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
  };

  return (
    <GlassView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-2xl border border-slate-200 dark:border-white/10 p-4"
    >
      <View className="flex-row items-center mb-4">
        <View className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mr-3">
          <Package size={18} color={isDark ? '#cbd5e1' : '#475569'} />
        </View>
        <Text className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">
          HHG Weight Limit
        </Text>
      </View>

      {maxWeightAllowance === 0 ? (
        <View className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-4 py-6">
          <Text className="text-base font-bold text-slate-900 dark:text-white">
            Configure Profile
          </Text>
          <Text className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Add your profile details to calculate your authorized HHG weight allowance.
          </Text>
        </View>
      ) : (
        <>
          <View className="items-center justify-center mb-4">
            <View className="relative">
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
                  className={`text-3xl font-bold ${rawPercentage > 100
                      ? 'text-red-500 dark:text-red-400'
                      : rawPercentage > 80
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-emerald-500 dark:text-emerald-400'
                    }`}
                >
                  {displayPercentage}%
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400">of limit</Text>
              </View>
            </View>
          </View>

          {estimatedWeight === 0 ? (
            <Text className="text-center text-sm text-slate-600 dark:text-slate-300 mb-4">
              Start Estimating to track your HHG weight against your limit.
            </Text>
          ) : null}

          {isOverLimit ? (
            <View className="mb-4 self-center flex-row items-center rounded-full border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-900/20 px-3 py-1.5">
              <AlertTriangle size={14} color={isDark ? '#fda4af' : '#dc2626'} />
              <Text className="ml-1.5 text-xs font-semibold text-red-700 dark:text-red-300">
                Over Weight Limit
              </Text>
            </View>
          ) : null}

          <View className="mb-4 flex-row justify-between">
            <View>
              <Text className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estimated
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {formatLbs(estimatedWeight)}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Max
              </Text>
              <Text className="mt-1 text-base font-bold text-slate-900 dark:text-white">
                {formatLbs(maxWeightAllowance)}
              </Text>
            </View>
          </View>
        </>
      )}

      <Link href="/pcs-wizard/hhg-move-planner" asChild>
        <ScalePressable
          onPress={handleEstimatePress}
          className="rounded-lg border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 items-center"
          accessibilityRole="button"
          accessibilityLabel="Estimate Weight"
        >
          <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
            Estimate Weight
          </Text>
        </ScalePressable>
      </Link>
    </GlassView>
  );
}
