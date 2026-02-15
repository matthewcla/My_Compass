import { useCurrentProfile } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { getHHGWeightAllowance } from '@/utils/hhg';
import { AlertTriangle, Scale, Truck, TruckIcon } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';

const formatCurrency = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
const formatLbs = (n: number) => `${n.toLocaleString()} lbs`;

/** Industry average $/lb for excess HHG weight */
const EXCESS_COST_PER_LB = 0.70;
/** GBL cost per cwt for PPM incentive calc */
const GBL_COST_PER_CWT = 68.50;
const PPM_INCENTIVE_RATE = 0.95;

type ShipmentType = 'GBL' | 'PPM';

interface HHGCostProjectionProps {
    onShipmentTypeChange?: (type: ShipmentType) => void;
}

export function HHGCostProjection({ onShipmentTypeChange }: HHGCostProjectionProps) {
    const profile = useCurrentProfile();
    const hhg = usePCSStore((s) => s.financials.hhg);
    const updateHHGPlan = usePCSStore((s) => s.updateHHGPlan);

    const [selectedType, setSelectedType] = useState<ShipmentType>(
        (hhg.shipments?.[0]?.type as ShipmentType) ?? 'GBL'
    );

    const hasDependents = (profile?.dependents || 0) > 0;
    const maxWeight = getHHGWeightAllowance(profile?.rank || 'E-1', hasDependents);
    const estimatedWeight = hhg.estimatedWeight || 0;
    const excessLbs = Math.max(0, estimatedWeight - maxWeight);

    const analysis = useMemo(() => {
        // GBL Path
        const gblExcessCost = Math.round(excessLbs * EXCESS_COST_PER_LB * 100) / 100;
        const gblYouPay = gblExcessCost;
        const gblNavyPays = 0; // Navy covers the base move

        // PPM Path
        const cwt = estimatedWeight / 100;
        const gblEquivalent = Math.round(cwt * GBL_COST_PER_CWT * 100) / 100;
        const ppmIncentive = Math.round(gblEquivalent * PPM_INCENTIVE_RATE * 100) / 100;

        // Rough PPM cost estimate (fuel, truck rental, materials)
        const ppmEstimatedCost = Math.round(estimatedWeight * 0.45); // ~$0.45/lb average self-move cost
        const ppmNet = ppmIncentive - ppmEstimatedCost;

        return {
            gbl: { excessCost: gblExcessCost, youPay: gblYouPay, navyCovers: 'Base shipment' },
            ppm: { incentive: ppmIncentive, estimatedCost: ppmEstimatedCost, net: ppmNet, gblEquivalent },
            excessLbs,
            recommendation: excessLbs > 0 && ppmNet > 0 ? 'PPM' : 'GBL',
        };
    }, [estimatedWeight, maxWeight, excessLbs]);

    const handleTypeSelect = (type: ShipmentType) => {
        setSelectedType(type);
        // Update the first shipment's type, or just update excess cost
        const firstShipment = hhg.shipments?.[0];
        if (firstShipment) {
            usePCSStore.getState().updateShipment(firstShipment.id, { type });
        }
        updateHHGPlan({
            estimatedExcessCost: type === 'GBL' ? analysis.gbl.excessCost : Math.max(0, -analysis.ppm.net),
        });
        onShipmentTypeChange?.(type);
    };

    useEffect(() => {
        // Auto-update excess cost when weight changes
        updateHHGPlan({
            estimatedExcessCost: selectedType === 'GBL' ? analysis.gbl.excessCost : Math.max(0, -analysis.ppm.net),
        });
    }, [estimatedWeight]);

    if (estimatedWeight === 0) {
        return (
            <Animated.View entering={FadeIn} className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl p-6 items-center gap-3">
                <Scale size={32} color="#71717a" />
                <Text className="text-zinc-500 text-center text-sm">
                    Add items above to see cost projections
                </Text>
            </Animated.View>
        );
    }

    return (
        <Animated.View entering={FadeIn} layout={LinearTransition.springify().damping(15)} className="gap-4">
            {/* Excess Weight Warning */}
            {excessLbs > 0 && (
                <Animated.View entering={FadeInDown} className="bg-amber-950/30 border border-amber-700/40 rounded-2xl p-4 flex-row items-center gap-3">
                    <AlertTriangle size={20} color="#f59e0b" />
                    <View className="flex-1">
                        <Text className="text-amber-300 font-semibold text-sm">
                            {formatLbs(excessLbs)} over your {formatLbs(maxWeight)} allowance
                        </Text>
                        <Text className="text-amber-400/70 text-xs mt-0.5">
                            You may incur charges for excess weight
                        </Text>
                    </View>
                </Animated.View>
            )}

            {/* Shipment Type Selector */}
            <View className="flex-row gap-3">
                {/* GBL Card */}
                <Pressable
                    onPress={() => handleTypeSelect('GBL')}
                    className={`flex-1 border rounded-2xl p-4 ${selectedType === 'GBL' ? 'bg-blue-950/40 border-blue-500/50' : 'bg-zinc-800/50 border-zinc-700/40'
                        }`}
                >
                    <View className="flex-row items-center gap-2 mb-3">
                        <Truck size={18} color={selectedType === 'GBL' ? '#3b82f6' : '#71717a'} />
                        <Text className={`font-bold text-sm ${selectedType === 'GBL' ? 'text-blue-300' : 'text-zinc-400'}`}>
                            GBL
                        </Text>
                    </View>
                    <Text className="text-zinc-500 text-xs mb-2">Government ships it</Text>

                    <View className="gap-1.5">
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-400 text-xs">Navy covers</Text>
                            <Text className="text-emerald-400 text-xs font-medium">Base move</Text>
                        </View>
                        {excessLbs > 0 && (
                            <View className="flex-row justify-between">
                                <Text className="text-zinc-400 text-xs">Excess cost</Text>
                                <Text className="text-red-400 text-xs font-medium">{formatCurrency(analysis.gbl.excessCost)}</Text>
                            </View>
                        )}
                        <View className="border-t border-zinc-700/50 mt-1 pt-1 flex-row justify-between">
                            <Text className="text-zinc-300 text-xs font-semibold">You pay</Text>
                            <Text className={`text-xs font-bold ${analysis.gbl.youPay === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {analysis.gbl.youPay === 0 ? '$0' : formatCurrency(analysis.gbl.youPay)}
                            </Text>
                        </View>
                    </View>

                    {analysis.recommendation === 'GBL' && (
                        <View className="bg-emerald-500/20 rounded-full px-2 py-0.5 self-start mt-2">
                            <Text className="text-emerald-400 text-[10px] font-bold">RECOMMENDED</Text>
                        </View>
                    )}
                </Pressable>

                {/* PPM Card */}
                <Pressable
                    onPress={() => handleTypeSelect('PPM')}
                    className={`flex-1 border rounded-2xl p-4 ${selectedType === 'PPM' ? 'bg-purple-950/40 border-purple-500/50' : 'bg-zinc-800/50 border-zinc-700/40'
                        }`}
                >
                    <View className="flex-row items-center gap-2 mb-3">
                        <TruckIcon size={18} color={selectedType === 'PPM' ? '#a855f7' : '#71717a'} />
                        <Text className={`font-bold text-sm ${selectedType === 'PPM' ? 'text-purple-300' : 'text-zinc-400'}`}>
                            PPM (DITY)
                        </Text>
                    </View>
                    <Text className="text-zinc-500 text-xs mb-2">You move it yourself</Text>

                    <View className="gap-1.5">
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-400 text-xs">Incentive</Text>
                            <Text className="text-emerald-400 text-xs font-medium">{formatCurrency(analysis.ppm.incentive)}</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-zinc-400 text-xs">Est. cost</Text>
                            <Text className="text-zinc-300 text-xs font-medium">-{formatCurrency(analysis.ppm.estimatedCost)}</Text>
                        </View>
                        <View className="border-t border-zinc-700/50 mt-1 pt-1 flex-row justify-between">
                            <Text className="text-zinc-300 text-xs font-semibold">Net</Text>
                            <Text className={`text-xs font-bold ${analysis.ppm.net >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {analysis.ppm.net >= 0 ? '+' : ''}{formatCurrency(analysis.ppm.net)}
                            </Text>
                        </View>
                    </View>

                    {analysis.recommendation === 'PPM' && (
                        <View className="bg-emerald-500/20 rounded-full px-2 py-0.5 self-start mt-2">
                            <Text className="text-emerald-400 text-[10px] font-bold">RECOMMENDED</Text>
                        </View>
                    )}
                </Pressable>
            </View>
        </Animated.View>
    );
}
