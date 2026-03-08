import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Anchor,
    CalendarDays, // Added CalendarDays import
    DollarSign,
    MapPin,
    Package
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

/**
 * PCS Mission Brief — Phase 1 & 2 Home Hub Widget
 *
 * Compact situational-awareness card answering:
 * - When do I report?
 * - What phase am I in and how far along?
 * - What should I do next?
 * - (Phase 2) What's my financial posture?
 */

// Map UCT phase number → human-readable phase label
const PHASE_LABELS: Record<number, string> = {
    1: 'Profile & Screenings',
    2: 'Logistics & Finances',
};

export function PCSMissionBrief() {
    const activeOrder = useActiveOrder();
    const checklist = usePCSStore((s) => s.checklist);
    const financials = usePCSStore((s) => s.financials);
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const demoTimeline = useDemoStore((s) => s.demoTimelineOverride);

    // ── Derived Data ──────────────────────────────────────────────

    const stats = useMemo(() => {
        if (!activeOrder) return null;

        // Countdown — use demo timeline when available
        let daysRemaining: number;
        if (isDemoMode && demoTimeline && demoTimeline.daysToReport > 0) {
            daysRemaining = demoTimeline.daysToReport;
        } else {
            const reportDate = new Date(activeOrder.reportNLT);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            reportDate.setHours(0, 0, 0, 0);
            daysRemaining = Math.max(0, Math.ceil(
                (reportDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
            ));
        }

        // Determine current UCT phase (highest incomplete)
        const phase1Items = checklist.filter((c) => c.uctPhase === 1);
        const phase2Items = checklist.filter((c) => c.uctPhase === 2);
        const phase1Done = phase1Items.every((c) => c.status === 'COMPLETE');

        const currentPhase = phase1Done && phase2Items.length > 0 ? 2 : 1;
        const phaseItems = currentPhase === 1 ? phase1Items : phase2Items;
        const completed = phaseItems.filter((c) => c.status === 'COMPLETE').length;
        const total = phaseItems.length;

        // Next action: first incomplete item in current phase with actionRoute
        const nextAction = phaseItems
            .filter((c) => c.status !== 'COMPLETE')
            .sort((a, b) => {
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            })[0] ?? null;

        return {
            daysRemaining,
            currentPhase,
            phaseLabel: PHASE_LABELS[currentPhase] ?? `Phase ${currentPhase} `,
            completed,
            total,
            progress: total > 0 ? completed / total : 0,
            nextAction,
        };
    }, [activeOrder, checklist, isDemoMode, demoTimeline]);

    if (!stats) return null;

    const {
        daysRemaining,
        currentPhase,
        phaseLabel,
        completed,
        total,
        progress,
        nextAction,
    } = stats;

    const homePort = activeOrder!.gainingCommand.homePort;
    const commandName = activeOrder!.gainingCommand.name;

    // Format RNLT as DD MMM YYYY (e.g., 31 AUG 2024)
    const formattedRNLT = new Date(activeOrder!.reportNLT)
        .toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        })
        .toUpperCase();

    // Financial snapshot (Phase 2 only)
    const showFinancials = currentPhase === 2;

    // Urgency color: green > 60d, amber > 21d, red ≤ 21d
    const urgencyColor =
        daysRemaining > 60
            ? isDark ? '#4ADE80' : '#16A34A'
            : daysRemaining > 21
                ? isDark ? '#FBBF24' : '#D97706'
                : isDark ? '#F87171' : '#DC2626';

    // ── Handlers ──────────────────────────────────────────────────

    const handleNextAction = async () => {
        if (!nextAction?.actionRoute) return;
        if (Platform.OS !== 'web') {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
        }
        router.push(nextAction.actionRoute as any);
    };

    // ── Render ────────────────────────────────────────────────────

    return (
        <Animated.View entering={FadeInDown.delay(50).springify()}>
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
            >
                <LinearGradient
                    colors={isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View className="p-5">
                    {/* ── Header: Command + Countdown ── */}
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4 flex-1 mr-2">
                            <View className="w-10 h-10 rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-800/60 shadow-sm">
                                <Anchor size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-1" numberOfLines={2}>{commandName}</Text>
                                <View className="flex-row items-center flex-wrap" style={{ gap: 8, rowGap: 4 }}>
                                    <View className="flex-row items-center">
                                        <MapPin size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <Text className="ml-1 text-slate-600 dark:text-slate-400 text-[12px] font-[500] leading-tight opacity-80" numberOfLines={1}>
                                            {homePort || "PCS Mission Brief"}
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center">
                                        <CalendarDays size={12} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                        <Text className="ml-1 text-slate-600 dark:text-slate-400 text-[12px] font-[600] leading-tight opacity-80" numberOfLines={1}>
                                            RNLT {formattedRNLT}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                        {/* Countdown badge */}
                        <View className="items-end justify-center ml-2">
                            <View
                                className="px-3 py-1.5 rounded-[12px] border pb-2 border-blue-500/20 shadow-sm"
                                style={{
                                    backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)',
                                }}
                            >
                                <Text style={{ color: urgencyColor }} className="text-[14px] font-black tracking-wide text-center uppercase">
                                    Day -{daysRemaining}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* ── Content ── */}
                    {showFinancials && (
                        <View className="mt-5">
                            {/* Financial Snapshot (Phase 2 only) */}
                            <View className="flex-row" style={{ gap: 8 }}>
                                <View className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 items-center shadow-sm">
                                    <DollarSign size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                                    <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                                        DLA
                                    </Text>
                                    <Text className="text-[15px] font-bold text-slate-900 dark:text-white mt-0.5" numberOfLines={1}>
                                        ${financials.dla.estimatedAmount.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 items-center shadow-sm">
                                    <DollarSign size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                                    <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                                        Advance
                                    </Text>
                                    <Text className="text-[15px] font-bold text-slate-900 dark:text-white mt-0.5" numberOfLines={1}>
                                        {financials.advancePay.requested ? `$${financials.advancePay.amount.toLocaleString()} ` : 'None'}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 items-center shadow-sm">
                                    <Package size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                                    <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                                        HHG
                                    </Text>
                                    <Text className="text-[15px] font-bold text-slate-900 dark:text-white mt-0.5" numberOfLines={1}>
                                        {financials.hhg.estimatedWeight > 0
                                            ? `${financials.hhg.estimatedWeight.toLocaleString()} lbs`
                                            : '—'
                                        }
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </View>
            </GlassView>
        </Animated.View>
    );
}
