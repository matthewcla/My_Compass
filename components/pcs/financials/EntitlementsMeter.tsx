import { calculatePCSEntitlements } from '@/utils/financialMath';
import { useCurrentProfile } from '@/store/useDemoStore';
import { DemoUser } from '@/constants/DemoData';
import { Minus, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle, CircleProps } from 'react-native-svg';

const RING_SIZE = 176;
const RING_STROKE = 18;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const formatCurrency = (value: number): string =>
  `$${Math.round(value).toLocaleString()}`;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const EntitlementsMeter = () => {
  const user = useCurrentProfile();
  const financialProfile = user?.financialProfile;
  const demoUser = user as DemoUser | null;

  // Initialize state with user values or defaults
  const [dependentsCount, setDependentsCount] = useState(financialProfile?.dependentsCount ?? 1);
  const [estimatedMileage, setEstimatedMileage] = useState(demoUser?.pcsRoute?.estimatedMileage ?? 2100);
  const [outOfPocketText, setOutOfPocketText] = useState('1800');

  // Update state if user changes (e.g. persona switch)
  useEffect(() => {
    if (financialProfile) {
      setDependentsCount(financialProfile.dependentsCount);
    }
    if (demoUser?.pcsRoute) {
      setEstimatedMileage(demoUser.pcsRoute.estimatedMileage);
    }
  }, [financialProfile, demoUser]);

  // Shared value for the animated stroke length
  const progress = useSharedValue(0);

  const outOfPocketExpenses = useMemo(() => {
    const parsed = Number(outOfPocketText || '0');
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }, [outOfPocketText]);

  const entitlements = useMemo(
    () =>
      calculatePCSEntitlements(
        {
          paygrade: financialProfile?.payGrade || 'E-6',
          monthlyBasePay: financialProfile?.basePay || 3800,
          hasDependents: dependentsCount > 0,
          numberOfDependents: dependentsCount,
        },
        {
          originStation: demoUser?.pcsRoute?.losingZip || 'Current Duty Station',
          destinationStation: demoUser?.pcsRoute?.gainingZip || 'Next Duty Station',
          authorizedMiles: estimatedMileage,
          tleDaysAuthorized: 10,
        },
      ),
    [dependentsCount, estimatedMileage, financialProfile, demoUser],
  );

  const payout = entitlements.totalNavyPayout;
  const netBalance = payout - outOfPocketExpenses;

  // Calculate target progress (ratio)
  useEffect(() => {
    const totalCompared = payout + outOfPocketExpenses;
    const ratio = totalCompared > 0 ? payout / totalCompared : 0;
    // Animate to the new ratio * circumference
    progress.value = withSpring(ratio * RING_CIRCUMFERENCE, {
      damping: 15,
      stiffness: 90,
    });
  }, [payout, outOfPocketExpenses, progress]);

  // Animated props for the SVG Circle
  const animatedCircleProps = useAnimatedProps<CircleProps>(() => ({
    strokeDasharray: [progress.value, RING_CIRCUMFERENCE],
  }));

  const adjustDependents = (delta: number) => {
    setDependentsCount((previous) => clamp(previous + delta, 0, 6));
  };

  const adjustMileage = (delta: number) => {
    setEstimatedMileage((previous) => clamp(previous + delta, 200, 6000));
  };

  const updateOutOfPocket = (raw: string) => {
    const sanitized = raw.replace(/[^0-9]/g, '');
    setOutOfPocketText(sanitized);
  };

  return (
    <View className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-xl shadow-slate-900/10 overflow-hidden">
      <View className="flex-row items-center justify-between mb-5">
        <View>
          <Text className="text-slate-900 dark:text-white text-lg font-extrabold">
            PCS What-If Meter
          </Text>
          <Text className="text-slate-700 dark:text-slate-200 text-xs mt-1">
            Navy payout vs out-of-pocket spend
          </Text>
        </View>
        <View className="rounded-full px-3 py-1 border border-emerald-300/60 bg-emerald-500/20">
          <Text className="text-emerald-700 dark:text-emerald-200 font-semibold text-xs">
            {formatCurrency(payout)}
          </Text>
        </View>
      </View>

      <View className="items-center mb-6">
        <View className="relative">
          <Svg width={RING_SIZE} height={RING_SIZE}>
            {/* Background Track */}
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="rgba(239, 68, 68, 0.35)"
              strokeWidth={RING_STROKE}
              fill="transparent"
            />
            {/* Animated Value Ring */}
            <AnimatedCircle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#10B981"
              strokeWidth={RING_STROKE}
              fill="transparent"
              animatedProps={animatedCircleProps}
              strokeLinecap="round"
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
          </Svg>
          <View className="absolute inset-0 items-center justify-center">
            <Text className="text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Net Position
            </Text>
            {/* 
              Ideally, we'd animate this number too, but React text updates 
              are fast enough for now, keeping it simple per instructions.
            */}
            <Text
              className={`text-2xl font-black ${netBalance >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
                }`}
            >
              {netBalance >= 0 ? '+' : '-'}
              {formatCurrency(Math.abs(netBalance))}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center gap-4 mt-4">
          <View className="flex-row items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-xs text-slate-700 dark:text-slate-200">
              Navy payout
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-red-400 mr-2" />
            <Text className="text-xs text-slate-700 dark:text-slate-200">
              Out of pocket
            </Text>
          </View>
        </View>
      </View>

      <View className="gap-3 mb-6">
        <View className="rounded-2xl border border-white/20 bg-white/15 p-3">
          <Text className="text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider mb-2">
            Out of Pocket Expenses
          </Text>
          <View className="rounded-xl border border-white/20 bg-white/20 px-3 py-2.5 flex-row items-center">
            <Text className="text-slate-700 dark:text-slate-200 text-base font-semibold mr-2">
              $
            </Text>
            <TextInput
              value={outOfPocketText}
              onChangeText={updateOutOfPocket}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#94A3B8"
              className="flex-1 text-slate-900 dark:text-white text-base font-semibold"
              accessibilityLabel="Out of pocket expenses"
            />
          </View>
        </View>

        <View className="rounded-2xl border border-white/20 bg-white/15 p-3 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
              Dependents
            </Text>
            <Text className="text-slate-900 dark:text-white text-lg font-bold mt-0.5">
              {dependentsCount}
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => adjustDependents(-1)}
              className="h-9 w-9 rounded-full border border-white/25 bg-white/20 items-center justify-center active:bg-white/30"
              accessibilityRole="button"
              accessibilityLabel="Decrease dependents"
            >
              <Minus size={16} color="#0F172A" />
            </Pressable>
            <Pressable
              onPress={() => adjustDependents(1)}
              className="h-9 w-9 rounded-full border border-white/25 bg-white/20 items-center justify-center active:bg-white/30"
              accessibilityRole="button"
              accessibilityLabel="Increase dependents"
            >
              <Plus size={16} color="#0F172A" />
            </Pressable>
          </View>
        </View>

        <View className="rounded-2xl border border-white/20 bg-white/15 p-3 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wider">
              Estimated Mileage
            </Text>
            <Text className="text-slate-900 dark:text-white text-lg font-bold mt-0.5">
              {estimatedMileage.toLocaleString()} mi
            </Text>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => adjustMileage(-100)}
              className="h-9 w-9 rounded-full border border-white/25 bg-white/20 items-center justify-center active:bg-white/30"
              accessibilityRole="button"
              accessibilityLabel="Decrease estimated mileage"
            >
              <Minus size={16} color="#0F172A" />
            </Pressable>
            <Pressable
              onPress={() => adjustMileage(100)}
              className="h-9 w-9 rounded-full border border-white/25 bg-white/20 items-center justify-center active:bg-white/30"
              accessibilityRole="button"
              accessibilityLabel="Increase estimated mileage"
            >
              <Plus size={16} color="#0F172A" />
            </Pressable>
          </View>
        </View>
      </View>

      <View className="rounded-2xl border border-white/20 bg-white/15 p-4">
        <Text className="text-slate-900 dark:text-white text-base font-bold mb-3">
          Entitlement Breakdown
        </Text>
        <View className="gap-2">
          <View className="flex-row items-center justify-between rounded-xl border border-white/20 bg-white/20 px-3 py-2.5">
            <Text className="text-slate-700 dark:text-slate-200 font-medium">
              DLA
            </Text>
            <Text className="text-slate-900 dark:text-white font-bold">
              {formatCurrency(entitlements.dla)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between rounded-xl border border-white/20 bg-white/20 px-3 py-2.5">
            <Text className="text-slate-700 dark:text-slate-200 font-medium">
              MALT
            </Text>
            <Text className="text-slate-900 dark:text-white font-bold">
              {formatCurrency(entitlements.malt)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between rounded-xl border border-white/20 bg-white/20 px-3 py-2.5">
            <Text className="text-slate-700 dark:text-slate-200 font-medium">
              TLE
            </Text>
            <Text className="text-slate-900 dark:text-white font-bold">
              {formatCurrency(entitlements.tle)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};


