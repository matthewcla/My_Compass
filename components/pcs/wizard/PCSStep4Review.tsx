import { useColorScheme } from '@/components/useColorScheme';
import { WizardCard } from '@/components/wizard/WizardCard';
import Colors from '@/constants/Colors';
import { usePCSStore } from '@/store/usePCSStore';
import { calculateSegmentEntitlement } from '@/utils/jtr';
import { Car, MapPin, Plane, Shuffle, Wallet } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

interface PCSStep4ReviewProps {
    embedded?: boolean;
}

export function PCSStep4Review({ embedded = false }: PCSStep4ReviewProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const currentDraft = usePCSStore((state) => state.currentDraft);
    const activeOrder = usePCSStore((state) => state.activeOrder);

    const { financials, originName } = useMemo(() => {
        if (!currentDraft || !activeOrder) return { financials: { malt: 0, perDiem: 0 }, originName: 'Origin' };

        const index = activeOrder.segments.findIndex(s => s.id === currentDraft.id);
        const prev = index > 0 ? activeOrder.segments[index - 1] : null;

        const entitlements = calculateSegmentEntitlement(currentDraft);
        return {
            financials: entitlements,
            originName: prev?.location.name || 'Origin'
        };
    }, [currentDraft, activeOrder]);

    if (!currentDraft) return null;

    const content = (
        <View>
            {/* Route Summary Card */}
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Route Summary</Text>

                <View className="flex-row items-center mb-4">
                    <MapPin size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                    <View className="ml-3 flex-1">
                        <Text className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Origin</Text>
                        <Text className="text-base font-semibold text-slate-900 dark:text-white">{originName}</Text>
                        <Text className="text-sm text-slate-500">{new Date(currentDraft.dates.projectedDeparture).toLocaleDateString()}</Text>
                    </View>
                </View>

                {/* Stops */}
                {(currentDraft.userPlan.stops || []).map((stop, i) => (
                    <View key={stop.id} className="flex-row items-center mb-4 pl-1">
                        <View className="w-2 h-2 rounded-full bg-slate-400 ml-[5px] mr-[19px]" />
                        <View className="flex-1">
                            <Text className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Stop {i + 1}</Text>
                            <Text className="text-sm font-semibold text-slate-900 dark:text-white">{stop.location}</Text>
                        </View>
                    </View>
                ))}

                <View className="flex-row items-center">
                    <MapPin size={20} color={Colors[colorScheme ?? 'light'].tint} />
                    <View className="ml-3 flex-1">
                        <Text className="text-xs text-slate-500 dark:text-slate-400 uppercase font-bold">Destination</Text>
                        <Text className="text-base font-semibold text-slate-900 dark:text-white">{currentDraft.location.name}</Text>
                        <Text className="text-sm text-slate-500">{new Date(currentDraft.dates.projectedArrival).toLocaleDateString()}</Text>
                    </View>
                </View>
            </View>

            {/* Travel Details Card */}
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">Travel Details</Text>

                <View className="flex-row justify-between mb-4">
                    <View className="flex-row items-center">
                        {currentDraft.userPlan.mode === 'POV' ? <Car size={20} color="#64748b" /> :
                            currentDraft.userPlan.mode === 'AIR' ? <Plane size={20} color="#64748b" /> :
                                <Shuffle size={20} color="#64748b" />}
                        <Text className="ml-2 text-slate-700 dark:text-slate-300 font-medium">
                            {currentDraft.userPlan.mode === 'POV' ? 'POV Travel' :
                                currentDraft.userPlan.mode === 'AIR' ? 'Commercial Air' : 'Mixed Mode'}
                        </Text>
                    </View>
                </View>

                <View className="flex-row justify-between">
                    <Text className="text-slate-500 dark:text-slate-400">Accompanied</Text>
                    <Text className="text-slate-900 dark:text-white font-medium">{currentDraft.userPlan.isAccompanied ? 'Yes' : 'No'}</Text>
                </View>
            </View>

            {/* Financial Estimates */}
            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-100 dark:border-blue-900">
                <View className="flex-row items-center mb-4">
                    <Wallet size={24} color={Colors[colorScheme ?? 'light'].tint} />
                    <Text className="text-lg font-bold text-blue-900 dark:text-blue-100 ml-2">Estimated Entitlements</Text>
                </View>

                <View className="flex-row justify-between mb-2">
                    <Text className="text-slate-600 dark:text-slate-300">Estimated MALT</Text>
                    <Text className="text-slate-900 dark:text-white font-bold text-lg">
                        ${financials.malt.toFixed(2)}
                    </Text>
                </View>
                <View className="flex-row justify-between">
                    <Text className="text-slate-600 dark:text-slate-300">Estimated Per Diem</Text>
                    <Text className="text-slate-900 dark:text-white font-bold text-lg">
                        ${financials.perDiem.toFixed(2)}
                    </Text>
                </View>
                <Text className="mt-4 text-xs text-blue-600 dark:text-blue-400">
                    * Estimates only. Actual reimbursement determined by finance based on filed travel claim.
                </Text>
            </View>
        </View>
    );

    if (embedded) return content;

    return (
        <WizardCard title="Review" scrollable={false}>
            {content}
        </WizardCard>
    );
}
