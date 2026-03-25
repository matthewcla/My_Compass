import { usePCSStore } from '@/store/usePCSStore';
import { DollarSign, TrendingDown, TrendingUp } from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, Text, TextInput, useColorScheme, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

const fmt = (n: number) => {
    const abs = Math.abs(n).toFixed(2);
    const [whole, dec] = abs.split('.');
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$${withCommas}.${dec}`;
};

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

interface MovingCostProjectionProps {
    /** When true, hides the gap analysis bar so it can be rendered separately. */
    hideGapAnalysis?: boolean;
}

export function MovingCostProjection({ hideGapAnalysis = false }: MovingCostProjectionProps = {}) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

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

    // Refs for tap-to-focus: tapping anywhere on the row focuses the input
    const inputRefs = useRef<Record<string, TextInput | null>>({});

    return (
        <Animated.View entering={FadeIn} layout={LinearTransition.springify().damping(15)} className="gap-4">
            {/* Gap Analysis Bar — hidden when rendered separately */}
            {!hideGapAnalysis && (
                <Animated.View entering={FadeInDown} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-700/50 dark:bg-zinc-800/50 dark:shadow-none">
                    <View className="flex-row items-center justify-between mb-3">
                        <Text className="text-slate-900 dark:text-zinc-300 text-sm font-semibold">Cost vs. Entitlements</Text>
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
                            <Text className="text-slate-500 dark:text-zinc-400 text-xs">Entitlements: <Text className="text-emerald-600 dark:text-emerald-400 font-bold">{fmt(totalEntitlements)}</Text></Text>
                        </View>
                        <View className="flex-row items-center gap-1.5">
                            <View className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <Text className="text-slate-500 dark:text-zinc-400 text-xs">Costs: <Text className="text-amber-600 dark:text-amber-400 font-bold">{fmt(costs.totalEstimated)}</Text></Text>
                        </View>
                    </View>

                    {/* Delta */}
                    <View className={`mt-3 rounded-xl px-4 py-3 border ${isSurplus ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700/30' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-700/30'}`}>
                        <View className="flex-row items-center justify-between">
                            <Text className="text-slate-900 dark:text-zinc-300 text-sm font-semibold">Net Difference</Text>
                            <Text className={`text-lg font-black ${isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                {isSurplus ? '+' : '-'}{fmt(gap)}
                            </Text>
                        </View>
                        {!isSurplus && (
                            <Text className="text-red-600 dark:text-red-400/70 text-xs mt-1">
                                Consider requesting advance pay to cover this shortfall
                            </Text>
                        )}
                    </View>
                </Animated.View>
            )}

            {/* Cost Inputs — 44pt minimum touch targets, full-row tap-to-focus */}
            <View className="gap-3">
                {COST_FIELDS.map((field) => (
                    <Pressable
                        key={field.key}
                        onPress={() => inputRefs.current[field.key]?.focus()}
                        className="rounded-xl border border-slate-200 bg-white px-4 active:bg-slate-50 shadow-sm dark:border-zinc-700/40 dark:bg-zinc-800/30 dark:active:bg-zinc-800/60 dark:shadow-none"
                        style={{ minHeight: 56 }}
                        accessibilityRole="button"
                        accessibilityHint={`Tap to edit ${field.label}`}
                    >
                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-2.5 flex-1">
                                <DollarSign size={16} color={isDark ? '#71717a' : '#94a3b8'} />
                                <View>
                                    <Text className="text-slate-900 dark:text-zinc-300 text-sm font-medium">{field.label}</Text>
                                    {field.autoCalcLabel && <Text className="text-slate-500 dark:text-zinc-600 text-[10px]">Auto: {field.autoCalcLabel}</Text>}
                                </View>
                            </View>
                            {/* Input well — visually distinct, 44pt target */}
                            <View className="flex-row items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-zinc-600/50 dark:bg-zinc-900" style={{ minHeight: 44 }}>
                                <Text className="text-slate-400 dark:text-zinc-500 text-base">$</Text>
                                <TextInput
                                    ref={(r) => { inputRefs.current[field.key] = r; }}
                                    value={inputs[field.key] || ''}
                                    onChangeText={(v) => handleInputChange(field.key, v)}
                                    keyboardType="number-pad"
                                    placeholder="0"
                                    placeholderTextColor={isDark ? '#52525b' : '#94a3b8'}
                                    className="text-right text-base font-bold text-slate-900 dark:text-white"
                                    style={{ minWidth: 48 }}
                                    accessibilityLabel={`Edit ${field.label}`}
                                />
                                <Text className="text-slate-400 dark:text-zinc-600 text-xs">✎</Text>
                            </View>
                        </View>
                    </Pressable>
                ))}

                {/* HHG Excess (auto from HHG planner) — matching 44pt row height */}
                {hhgExcessCost > 0 && (
                    <Animated.View
                        entering={FadeIn}
                        className="rounded-xl border border-red-200 bg-red-50 px-4 dark:border-red-800/30 dark:bg-red-950/20"
                        style={{ minHeight: 56 }}
                    >
                        <View className="flex-row items-center justify-between py-3">
                            <View className="flex-row items-center gap-2.5 flex-1">
                                <DollarSign size={16} color={isDark ? '#f87171' : '#dc2626'} />
                                <View>
                                    <Text className="text-red-700 dark:text-red-400 text-sm font-medium">HHG Excess Weight</Text>
                                    <Text className="text-red-500/60 text-[10px]">From HHG planner</Text>
                                </View>
                            </View>
                            <Text className="text-base font-bold text-red-600 dark:text-red-400">{fmt(hhgExcessCost)}</Text>
                        </View>
                    </Animated.View>
                )}
            </View>
        </Animated.View>
    );
}
