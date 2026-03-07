import { GlassView } from '@/components/ui/GlassView';
import { usePCSStore } from '@/store/usePCSStore';
import { useUserStore } from '@/store/useUserStore';
import { formatDays } from '@/utils/formatDays';
import { LinearGradient } from 'expo-linear-gradient';
import { CalendarRange, TrendingDown, Wallet } from 'lucide-react-native';
import React from 'react';
import { Text, View, useColorScheme } from 'react-native';

export function LeaveImpactWidget() {
    const currentDraft = usePCSStore((state) => state.currentDraft);
    const user = useUserStore((state) => state.user);
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    if (!currentDraft) return null;

    // Derive leave impact from the draft segment's entitlements
    const chargeableDays = currentDraft.entitlements?.leaveDays ?? 0;

    // TODO: Pull actual leave balance from user store when available
    const availableOnDeparture = (user as any)?.leaveBalance ?? 30;
    const remainingOnReturn = availableOnDeparture - chargeableDays;
    const isOverdraft = remainingOnReturn < 0;
    const isUnchargeable = chargeableDays === 0;

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
        >
            <LinearGradient
                colors={isDark ? ['rgba(244,63,94,0.15)', 'transparent'] : ['rgba(244,63,94,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-5">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-10 h-10 rounded-full bg-rose-500/10 dark:bg-rose-900/40 items-center justify-center border-[1.5px] border-rose-500/20 dark:border-rose-800/60 shadow-sm">
                            <CalendarRange size={20} color={isDark ? '#FB7185' : '#E11D48'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1}>Leave Impact</Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>PCS transit leave balance</Text>
                        </View>
                    </View>
                </View>

                <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5 flex-row items-center justify-between">
                    {/* Left: Chargeable Days */}
                    <View className="flex-1 flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center">
                            <TrendingDown size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
                        </View>
                        <View>
                            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Leave Charge
                            </Text>
                            <View className="flex-row items-baseline mt-0.5">
                                {isUnchargeable ? (
                                    <Text className="text-base font-bold text-slate-400 dark:text-slate-500">
                                        No Charge
                                    </Text>
                                ) : (
                                    <>
                                        <Text className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                            {formatDays(chargeableDays)}
                                        </Text>
                                        <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">
                                            Days
                                        </Text>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Divider */}
                    <View className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-3" />

                    {/* Right: Remaining Balance */}
                    <View className="flex-1 flex-row items-center justify-end gap-3">
                        <View className="items-end">
                            <Text className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Remaining
                            </Text>
                            <View className="mt-0.5">
                                {isUnchargeable ? (
                                    <Text className="text-base font-bold text-slate-400 dark:text-slate-500">
                                        No Impact
                                    </Text>
                                ) : (
                                    <View className="items-end">
                                        <Text className={`text-xl tracking-tight leading-6 font-bold ${isOverdraft ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            {formatDays(remainingOnReturn)}
                                        </Text>
                                        <Text className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                                            On Return
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isUnchargeable ? 'bg-slate-100 dark:bg-slate-800' : isOverdraft ? 'bg-red-50 dark:bg-red-900/40' : 'bg-emerald-50 dark:bg-emerald-900/40'}`}>
                            <Wallet size={20} color={isUnchargeable ? (isDark ? '#64748B' : '#94A3B8') : isOverdraft ? (isDark ? '#F87171' : '#EF4444') : (isDark ? '#34D399' : '#10B981')} />
                        </View>
                    </View>
                </View>
            </View>
        </GlassView>
    );
}
