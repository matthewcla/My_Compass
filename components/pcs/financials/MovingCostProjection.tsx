import { usePCSStore } from '@/store/usePCSStore';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

const fmt = (n: number) => `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

interface CostField {
    key: string;
    label: string;
    placeholder: string;
    autoCalcLabel?: string;
}

const COST_FIELDS: CostField[] = [
    { key: 'securityDeposit', label: 'Security Deposit', placeholder: '0' },
    { key: 'firstLastRent', label: 'First / Last Month Rent', placeholder: '0' },
    { key: 'temporaryLodging', label: 'Temporary Lodging', placeholder: '0' },
    { key: 'fuelEstimate', label: 'Gas / Fuel', placeholder: '0', autoCalcLabel: 'from mileage' },
    { key: 'mealsEstimate', label: 'Meals (en route)', placeholder: '0', autoCalcLabel: 'from per diem' },
    { key: 'miscellaneous', label: 'Misc / Incidentals', placeholder: '0' },
];

export function MovingCostProjection() {
    const financials = usePCSStore((s) => s.financials);
    const updateMovingCosts = usePCSStore((s) => s.updateMovingCosts);

    // Local state for inputs
    const [inputs, setInputs] = useState<Record<string, string>>(() => {
        const mc = financials.movingCosts;
        if (!mc) return {} as Record<string, string>;
        return {
            securityDeposit: mc.securityDeposit > 0 ? `${mc.securityDeposit}` : '',
            firstLastRent: mc.firstLastRent > 0 ? `${mc.firstLastRent}` : '',
            temporaryLodging: mc.temporaryLodging > 0 ? `${mc.temporaryLodging}` : '',
            fuelEstimate: mc.fuelEstimate > 0 ? `${mc.fuelEstimate}` : '',
            mealsEstimate: mc.mealsEstimate > 0 ? `${mc.mealsEstimate}` : '',
            miscellaneous: mc.miscellaneous > 0 ? `${mc.miscellaneous}` : '',
        };
    });

    const parseNum = (s: string | undefined) => {
        if (!s) return 0;
        const n = Number(s.replace(/[^0-9.]/g, ''));
        return Number.isFinite(n) ? Math.max(0, n) : 0;
    };

    // Use pre-computed entitlements from the store
    // (recalculateFinancials already computes totalMalt, totalPerDiem, and DLA)
    const totalEntitlements = useMemo(() => {
        return (financials.totalMalt || 0) + (financials.totalPerDiem || 0) + (financials.dla.estimatedAmount || 0);
    }, [financials.totalMalt, financials.totalPerDiem, financials.dla.estimatedAmount]);

    // HHG excess cost from store
    const hhgExcessCost = financials.hhg.estimatedExcessCost || 0;

    // Compute costs
    const costs = useMemo(() => {
        const sd = parseNum(inputs.securityDeposit);
        const flr = parseNum(inputs.firstLastRent);
        const tl = parseNum(inputs.temporaryLodging);
        const fuel = parseNum(inputs.fuelEstimate);
        const meals = parseNum(inputs.mealsEstimate);
        const misc = parseNum(inputs.miscellaneous);
        const total = sd + flr + tl + fuel + meals + misc + hhgExcessCost;
        return { securityDeposit: sd, firstLastRent: flr, temporaryLodging: tl, fuelEstimate: fuel, mealsEstimate: meals, miscellaneous: misc, hhgExcessCost, totalEstimated: total };
    }, [inputs, hhgExcessCost]);

    const gap = totalEntitlements - costs.totalEstimated;
    const isSurplus = gap >= 0;

    const handleInputChange = useCallback((key: string, value: string) => {
        setInputs((prev) => ({ ...prev, [key]: value }));
        const numVal = parseNum(value);
        updateMovingCosts({ [key]: numVal } as any);
    }, [updateMovingCosts]);

    return (
        <Animated.View entering={FadeIn} layout={LinearTransition.springify().damping(15)} className="gap-4">
            {/* Gap Analysis Bar */}
            <Animated.View entering={FadeInDown} className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4">
                <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-zinc-300 text-sm font-semibold">Cost vs. Entitlements</Text>
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
                        style={{ flex: Math.max(1, costs.totalEstimated) }}
                    />
                </View>
                <View className="flex-row justify-between mt-2">
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <Text className="text-zinc-400 text-xs">Entitlements: <Text className="text-emerald-400 font-bold">{fmt(totalEntitlements)}</Text></Text>
                    </View>
                    <View className="flex-row items-center gap-1.5">
                        <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <Text className="text-zinc-400 text-xs">Costs: <Text className="text-amber-400 font-bold">{fmt(costs.totalEstimated)}</Text></Text>
                    </View>
                </View>

                {/* Delta */}
                <View className={`mt-3 rounded-xl px-4 py-3 ${isSurplus ? 'bg-emerald-950/30 border border-emerald-700/30' : 'bg-red-950/30 border border-red-700/30'}`}>
                    <View className="flex-row items-center justify-between">
                        <Text className="text-zinc-300 text-sm">Net Difference</Text>
                        <Text className={`text-lg font-black ${isSurplus ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isSurplus ? '+' : '-'}{fmt(gap)}
                        </Text>
                    </View>
                    {!isSurplus && (
                        <Text className="text-red-400/70 text-xs mt-1">
                            Consider requesting advance pay to cover this shortfall
                        </Text>
                    )}
                </View>
            </Animated.View>

            {/* Cost Inputs */}
            <View className="gap-2">
                {COST_FIELDS.map((field) => (
                    <View key={field.key} className="flex-row items-center gap-3 rounded-xl border border-zinc-700/40 bg-zinc-800/30 px-3 py-2.5">
                        <DollarSign size={14} color="#71717a" />
                        <View className="flex-1">
                            <Text className="text-zinc-400 text-xs">{field.label}</Text>
                            {field.autoCalcLabel && <Text className="text-zinc-600 text-[10px]">Auto: {field.autoCalcLabel}</Text>}
                        </View>
                        <TextInput
                            value={inputs[field.key] || ''}
                            onChangeText={(v) => handleInputChange(field.key, v)}
                            keyboardType="number-pad"
                            placeholder="$0"
                            placeholderTextColor="#52525b"
                            className="text-right text-sm font-bold text-white w-20"
                        />
                    </View>
                ))}

                {/* HHG Excess (auto from HHG planner) */}
                {hhgExcessCost > 0 && (
                    <Animated.View entering={FadeIn} className="flex-row items-center gap-3 rounded-xl border border-red-800/30 bg-red-950/20 px-3 py-2.5">
                        <DollarSign size={14} color="#f87171" />
                        <View className="flex-1">
                            <Text className="text-red-400 text-xs">HHG Excess Weight</Text>
                            <Text className="text-red-500/60 text-[10px]">From HHG planner</Text>
                        </View>
                        <Text className="text-right text-sm font-bold text-red-400">{fmt(hhgExcessCost)}</Text>
                    </Animated.View>
                )}
            </View>
        </Animated.View>
    );
}
