import { GlassView } from '@/components/ui/GlassView';
import Colors from '@/constants/Colors';
import { TrendingDown, Wallet } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

interface LeaveImpactHUDProps {
    chargeableDays: number;
    availableOnDeparture: number;
    remainingOnReturn: number;
    isOverdraft: boolean;
    isUnchargeable?: boolean;
}

export function LeaveImpactHUD({
    chargeableDays,
    availableOnDeparture,
    remainingOnReturn,
    isOverdraft,
    isUnchargeable = false,
}: LeaveImpactHUDProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    // Animation Values
    const chargeScale = useSharedValue(1);
    const balanceScale = useSharedValue(1);

    // Trigger animations on value change
    useEffect(() => {
        chargeScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
    }, [chargeableDays]);

    useEffect(() => {
        balanceScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
    }, [remainingOnReturn]);

    const chargeStyle = useAnimatedStyle(() => ({
        transform: [{ scale: chargeScale.value }]
    }));

    const balanceStyle = useAnimatedStyle(() => ({
        transform: [{ scale: balanceScale.value }]
    }));

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm"
        >
            <View className="flex-row items-center justify-between p-4">

                {/* Left: Chargeable Days */}
                <View className="flex-1 flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                        <TrendingDown size={20} className="text-blue-600 dark:text-blue-400" />
                    </View>
                    <View>
                        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Leave Charge
                        </Text>
                        <Animated.View style={[chargeStyle, { flexDirection: 'row', alignItems: 'flex-end' }]}>
                            {isUnchargeable ? (
                                <Text className="text-base font-bold text-slate-400 dark:text-slate-500">
                                    No Charge
                                </Text>
                            ) : (
                                <>
                                    <Text className="text-xl font-bold text-slate-900 dark:text-white">
                                        {chargeableDays.toFixed(1)}
                                    </Text>
                                    <Text className="text-xs font-medium text-slate-500 dark:text-slate-400 ml-1">
                                        Days
                                    </Text>
                                </>
                            )}
                        </Animated.View>
                    </View>
                </View>

                {/* Divider */}
                <View className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />

                {/* Right: Remaining Balance */}
                <View className="flex-1 flex-row items-center justify-end gap-3">
                    <View className="items-end">
                        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Remaining
                        </Text>
                        <Animated.View style={balanceStyle}>
                            {isUnchargeable ? (
                                <Text className="text-base font-bold text-slate-400 dark:text-slate-500">
                                    No Impact
                                </Text>
                            ) : (
                                <>
                                    <Text className={`text-xl font-bold ${isOverdraft ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                        {remainingOnReturn.toFixed(1)}
                                    </Text>
                                    <Text className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-right">
                                        on return
                                    </Text>
                                </>
                            )}
                        </Animated.View>
                    </View>
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${isUnchargeable ? 'bg-slate-100 dark:bg-slate-800' : isOverdraft ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'}`}>
                        <Wallet size={20} className={isUnchargeable ? 'text-slate-400 dark:text-slate-500' : isOverdraft ? 'text-red-500 dark:text-red-400' : 'text-green-600 dark:text-green-400'} />
                    </View>
                </View>

            </View>
        </GlassView>
    );
}
