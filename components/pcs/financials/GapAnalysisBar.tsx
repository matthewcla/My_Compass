import { usePCSStore } from '@/store/usePCSStore';
import { TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

const fmt = (n: number) => {
    const abs = Math.abs(n).toFixed(2);
    const [whole, dec] = abs.split('.');
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$${withCommas}.${dec}`;
};

/**
 * Standalone gap analysis bar that reads entitlements and costs from the PCS store.
 * Shows a visual comparison of Navy entitlements vs. estimated moving costs,
 * with surplus/shortfall indicator and a nudge toward advance pay if needed.
 */
export function GapAnalysisBar() {
    const financials = usePCSStore((s) => s.financials);

    const totalEntitlements = useMemo(() => {
        return (financials.totalMalt || 0) + (financials.totalPerDiem || 0) + (financials.dla.estimatedAmount || 0);
    }, [financials.totalMalt, financials.totalPerDiem, financials.dla.estimatedAmount]);

    const totalCosts = useMemo(() => {
        const mc = financials.movingCosts;
        if (!mc) return 0;
        return mc.totalEstimated || 0;
    }, [financials.movingCosts]);

    const gap = totalEntitlements - totalCosts;
    const isSurplus = gap >= 0;

    return (
        <Animated.View entering={FadeIn} className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4">
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-zinc-300 text-sm font-semibold">Entitlements vs. Costs</Text>
                {isSurplus ? (
                    <View className="flex-row items-center gap-1 bg-emerald-900/30 rounded-full px-2 py-0.5">
                        <TrendingUp size={12} color="#34d399" />
                        <Text className="text-emerald-400 text-[10px] font-bold">SURPLUS</Text>
                    </View>
                ) : (
                    <View className="flex-row items-center gap-1 bg-red-900/30 rounded-full px-2 py-0.5">
                        <TrendingDown size={12} color="#f87171" />
                        <Text className="text-red-400 text-[10px] font-bold">SHORTFALL</Text>
                    </View>
                )}
            </View>

            {/* Bar Visualization */}
            <View className="h-8 rounded-lg bg-zinc-700/50 overflow-hidden flex-row">
                <View
                    className="bg-emerald-600/60 h-full rounded-l-lg"
                    style={{ flex: Math.max(1, totalEntitlements) }}
                />
                <View
                    className="bg-amber-600/60 h-full rounded-r-lg"
                    style={{ flex: Math.max(1, totalCosts) }}
                />
            </View>
            <View className="flex-row justify-between mt-2">
                <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <Text className="text-zinc-400 text-xs">Navy pays: <Text className="text-emerald-400 font-bold">{fmt(totalEntitlements)}</Text></Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                    <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <Text className="text-zinc-400 text-xs">Your costs: <Text className="text-amber-400 font-bold">{fmt(totalCosts)}</Text></Text>
                </View>
            </View>

            {/* Delta */}
            <View className={`mt-3 rounded-xl px-4 py-3 ${isSurplus ? 'bg-emerald-950/30 border border-emerald-700/30' : 'bg-red-950/30 border border-red-700/30'}`}>
                <View className="flex-row items-center justify-between">
                    <Text className="text-zinc-300 text-sm font-semibold">Net Position</Text>
                    <Text className={`text-lg font-black ${isSurplus ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isSurplus ? '+' : '-'}{fmt(gap)}
                    </Text>
                </View>
                {isSurplus ? (
                    <Text className="text-emerald-400/70 text-xs mt-1">
                        Your entitlements cover your estimated costs. Advance pay may not be necessary.
                    </Text>
                ) : (
                    <Text className="text-red-400/70 text-xs mt-1">
                        Your costs exceed entitlements by {fmt(gap)}. Consider requesting DLA or advance pay below to cover the gap.
                    </Text>
                )}
            </View>
        </Animated.View>
    );
}
