import { GlassView } from '@/components/ui/GlassView';
import Colors from '@/constants/Colors';
import { formatCurrency } from '@/utils/formatCurrency';
import { AlertTriangle, Camera, DollarSign } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';

interface TravelClaimHUDProps {
    totalClaim: number;
    receiptCount: number;
    hasWarnings: boolean;
    isValid: boolean;
}

export function TravelClaimHUD({
    totalClaim,
    receiptCount,
    hasWarnings,
    isValid,
}: TravelClaimHUDProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    // Animation Values
    const amountScale = useSharedValue(1);
    const receiptScale = useSharedValue(1);

    // Trigger animations on value change
    useEffect(() => {
        amountScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
    }, [totalClaim]);

    useEffect(() => {
        receiptScale.value = withSequence(
            withTiming(1.2, { duration: 100 }),
            withSpring(1)
        );
    }, [receiptCount]);

    const amountStyle = useAnimatedStyle(() => ({
        transform: [{ scale: amountScale.value }]
    }));

    const receiptStyle = useAnimatedStyle(() => ({
        transform: [{ scale: receiptScale.value }]
    }));

    // Format currency
    const formattedTotal = formatCurrency(totalClaim);

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="mb-4 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm"
        >
            <View className="flex-row items-center justify-between p-4">

                {/* Left: Total Claim Amount */}
                <View className="flex-1 flex-row items-center gap-3">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${hasWarnings ? 'bg-amber-50 dark:bg-amber-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                        {hasWarnings ? (
                            <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400" />
                        ) : (
                            <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                        )}
                    </View>
                    <View>
                        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Total Claim
                        </Text>
                        <Animated.View style={amountStyle}>
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                                {formattedTotal}
                            </Text>
                        </Animated.View>
                    </View>
                </View>

                {/* Divider */}
                <View className="h-10 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2" />

                {/* Right: Receipt Count */}
                <View className="flex-row items-center justify-end gap-3">
                    <View className="items-end">
                        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Receipts
                        </Text>
                        <Animated.View style={receiptStyle}>
                            <Text className="text-xl font-bold text-slate-700 dark:text-slate-200">
                                {receiptCount}
                            </Text>
                        </Animated.View>
                    </View>
                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center">
                        <Camera size={20} className="text-slate-500 dark:text-slate-400" />
                    </View>
                </View>

            </View>

            {/* Validation Bar (if invalid or warnings) */}
            {hasWarnings && (
                <View className="bg-amber-100 dark:bg-amber-900/40 px-4 py-1 flex-row items-center justify-center">
                    <Text className="text-xs font-medium text-amber-800 dark:text-amber-200">
                        Review warnings before submitting
                    </Text>
                </View>
            )}
        </GlassView>
    );
}
