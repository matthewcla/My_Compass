import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSPhase, useSubPhase } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { Plane } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

export function TransitSegmentWidget() {
    const isDark = useColorScheme() === 'dark';
    const router = useRouter();

    const activeOrder = useActiveOrder();
    const isDemoMode = useDemoStore((state) => state.isDemoMode);
    const demoTimeline = useDemoStore((state) => state.demoTimelineOverride);
    const pcsPhase = usePCSPhase();
    const pcsSubPhase = useSubPhase();

    // Only render if in Phase 3
    if (pcsPhase !== 'TRANSIT_LEAVE') {
        return null;
    }

    const firstSeg = activeOrder?.segments?.[0];
    const departureDate = firstSeg?.dates?.projectedDeparture ? new Date(firstSeg.dates.projectedDeparture) : null;
    const nltDate = activeOrder?.reportNLT ? new Date(activeOrder.reportNLT) : null;

    // Countdown to report NLT
    const daysToReport = useMemo(() => {
        if (isDemoMode && demoTimeline && demoTimeline.daysToReport > 0) return demoTimeline.daysToReport;
        if (!nltDate) return null;
        const today = new Date();
        const nlt = new Date(nltDate);
        nlt.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return Math.max(0, Math.ceil((nlt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }, [nltDate, isDemoMode, demoTimeline]);

    // Calculate progress percentage
    const progressPercent = useMemo(() => {
        if (!departureDate || !nltDate) return 50; // Default to middle if dates are messed up
        const totalDuration = nltDate.getTime() - departureDate.getTime();
        if (totalDuration <= 0) return 100;
        const elapsed = new Date().getTime() - departureDate.getTime();
        return Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
    }, [departureDate, nltDate]);

    // Check danger zones for urgency
    const isUrgent = daysToReport !== null && daysToReport < 7;
    const urgencyColor = daysToReport !== null
        ? daysToReport < 3
            ? 'text-red-600 dark:text-red-400'
            : daysToReport < 7
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-blue-600 dark:text-blue-400'
        : 'text-slate-900 dark:text-white';

    const progressColor = daysToReport !== null
        ? daysToReport < 3
            ? 'bg-red-500'
            : daysToReport < 7
                ? 'bg-orange-500'
                : 'bg-blue-500'
        : 'bg-blue-500';

    return (
        <View>
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-[20px] overflow-hidden shadow-sm dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
            >
                <View className="p-4">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-3">
                            <View className="w-10 h-10 rounded-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-sm items-center justify-center">
                                <Plane size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                            </View>
                            <View>
                                <Text className="text-slate-900 dark:text-white text-[18px] font-black tracking-tight" numberOfLines={2}>Transit Overview</Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-[13px] font-medium" numberOfLines={2}>
                                    {pcsSubPhase === 'ACTIVE_TRAVEL' ? 'En Route to Gaining Command' : 'Planning Transit Routing'}
                                </Text>
                            </View>
                        </View>
                        {daysToReport !== null && (
                            <View className="items-end">
                                <View className="flex-row items-baseline gap-1">
                                    <Text className={`${urgencyColor} text-2xl font-black font-mono tracking-tighter`}>{daysToReport}</Text>
                                    <Text className={`${urgencyColor} text-[10px] font-bold uppercase tracking-wider`}>Days</Text>
                                </View>
                                <Text className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-bold tracking-wider">To Report</Text>
                            </View>
                        )}
                    </View>

                    {/* Timeline Tracker */}
                    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 mb-3">
                        <View className="flex-row justify-between mb-2">
                            <Text className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Detached</Text>
                            <Text className="text-[12px] font-bold text-slate-700 dark:text-slate-300">Report NLT</Text>
                        </View>
                        <View className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
                            <View className={`h-full ${progressColor} rounded-full`} style={{ width: `${progressPercent}%` }} />
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {departureDate ? departureDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                            </Text>
                            <Text className={`text-[11px] font-medium ${isUrgent ? urgencyColor : 'text-slate-500 dark:text-slate-400'}`}>
                                {nltDate ? nltDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'TBD'}
                            </Text>
                        </View>
                    </View>
                </View>
            </GlassView>
        </View>
    );
}
