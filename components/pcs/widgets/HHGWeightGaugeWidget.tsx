import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
      className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
    >
      <LinearGradient
        colors={isDark ? ['rgba(245,158,11,0.15)', 'transparent'] : ['rgba(245,158,11,0.08)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-10 h-10 rounded-full bg-amber-500/10 dark:bg-amber-900/40 items-center justify-center border-[1.5px] border-amber-500/20 dark:border-amber-800/60 shadow-sm">
              <Package size={20} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={2}>HHG Weight</Text>
              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={2}>Estimates and allowances</Text>
            </View>
          </View>
        </View>

        <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
          {maxWeightAllowance === 0 ? (
            <View className="rounded-xl border border-dashed border-slate-300/80 dark:border-slate-700/80 px-4 py-6">
              <Text className="text-[15px] font-bold text-slate-900 dark:text-white">
                Configure Profile
              </Text>
              <Text className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-5">
                Add your profile details to calculate your authorized HHG weight allowance.
              </Text>
            </View>
          ) : (
            <>
              <View className="items-center justify-center mb-5">
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
                      className={`text-[28px] font-black tracking-tight ${rawPercentage > 100
                        ? 'text-red-500 dark:text-red-400'
                        : rawPercentage > 80
                          ? 'text-amber-500 dark:text-amber-400'
                          : 'text-emerald-500 dark:text-emerald-400'
                        }`}
                    >
                      {displayPercentage}%
                    </Text>
                    <Text className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Of Limit</Text>
                  </View>
                </View>
              </View>

              {estimatedWeight === 0 ? (
                <Text className="text-center text-[13px] text-slate-600 dark:text-slate-400 mb-5 leading-5 font-medium px-4">
                  Start Estimating to track your HHG weight against your limit.
                </Text>
              ) : null}

              {isOverLimit ? (
                <View className="mb-5 self-center flex-row items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1.5">
                  <AlertTriangle size={14} color={isDark ? '#f87171' : '#dc2626'} strokeWidth={2.5} />
                  <Text className="ml-1.5 text-xs font-bold text-red-700 dark:text-red-400">
                    Over Weight Limit
                  </Text>
                </View>
              ) : null}

              <View className="mb-5 flex-row justify-between bg-white/60 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60">
                <View>
                  <Text className="text-[10px] uppercase tracking-[1.2px] font-bold text-slate-400 dark:text-slate-500">
                    Estimated
                  </Text>
                  <Text className="mt-1 text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                    {formatLbs(estimatedWeight)}
                  </Text>
                </View>
                <View className="h-full w-px bg-slate-200 dark:bg-slate-700 mx-4" />
                <View className="items-end">
                  <Text className="text-[10px] uppercase tracking-[1.2px] font-bold text-slate-400 dark:text-slate-500">
                    Max Limit
                  </Text>
                  <Text className="mt-1 text-[15px] font-bold text-slate-900 dark:text-white tracking-tight">
                    {formatLbs(maxWeightAllowance)}
                  </Text>
                </View>
              </View>
            </>
          )}

          <Link href="/pcs-wizard/hhg-move-planner" asChild>
            <ScalePressable
              onPress={handleEstimatePress}
              className="rounded-xl border border-blue-500/30 bg-blue-500/10 h-12 flex-row justify-center items-center"
              accessibilityRole="button"
              accessibilityLabel="Estimate Weight"
            >
              <Text className="text-[13px] font-bold tracking-wide text-blue-700 dark:text-blue-400">
                ESTIMATE WEIGHT
              </Text>
            </ScalePressable>
          </Link>
        </View>
      </View>
    </GlassView>
  );
}
