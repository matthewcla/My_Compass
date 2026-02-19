import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    Anchor,
    ChevronRight,
    DollarSign,
    MapPin,
    Zap
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
            phaseLabel: PHASE_LABELS[currentPhase] ?? `Phase ${currentPhase}`,
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
                intensity={75}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
                {/* ── Header: Command + Countdown ── */}
                <View className="bg-blue-50/30 dark:bg-blue-900/20 px-5 py-4">
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-3">
                            <View className="w-12 h-12 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 items-center justify-center mr-3">
                                <Anchor size={22} color={isDark ? '#93c5fd' : '#2563eb'} strokeWidth={2.2} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-300">
                                    PCS Mission Brief
                                </Text>
                                <Text className="mt-0.5 text-base font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                    {commandName}
                                </Text>
                                {homePort && (
                                    <View className="flex-row items-center mt-0.5">
                                        <MapPin size={10} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2} />
                                        <Text className="ml-1 text-xs text-slate-500 dark:text-slate-400">
                                            {homePort}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        {/* Countdown badge */}
                        <View
                            className="rounded-lg px-2.5 py-1.5"
                            style={{ backgroundColor: `${urgencyColor}18` }}
                        >
                            <Text style={{ color: urgencyColor }} className="text-lg font-black text-center">
                                {daysRemaining}
                            </Text>
                            <Text style={{ color: urgencyColor }} className="text-[9px] font-bold uppercase tracking-wider text-center">
                                days
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Content ── */}
                <View className="p-5" style={{ gap: 14 }}>

                    {/* Phase Progress */}
                    <View className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                {phaseLabel}
                            </Text>
                            <Text className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                {completed} of {total}
                            </Text>
                        </View>
                        {/* Progress bar */}
                        <View className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <View
                                className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                        </View>
                    </View>



                    {/* Financial Snapshot (Phase 2 only) */}
                    {showFinancials && (
                        <View className="flex-row" style={{ gap: 8 }}>
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700 items-center">
                                <DollarSign size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                                <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                                    DLA
                                </Text>
                                <Text className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                    ${financials.dla.estimatedAmount.toLocaleString()}
                                </Text>
                            </View>
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700 items-center">
                                <DollarSign size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                                <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                                    Advance
                                </Text>
                                <Text className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                    {financials.advancePay.requested ? `$${financials.advancePay.amount.toLocaleString()}` : 'None'}
                                </Text>
                            </View>
                            <View className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700 items-center">
                                <Text className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    HHG
                                </Text>
                                <Text className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                                    {financials.hhg.estimatedWeight > 0
                                        ? `${financials.hhg.estimatedWeight.toLocaleString()} lbs`
                                        : '—'
                                    }
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Next Action CTA */}
                    {nextAction && (
                        <ScalePressable
                            onPress={handleNextAction}
                            className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3.5 border border-blue-200 dark:border-blue-800/40 flex-row items-center justify-between"
                            style={{ minHeight: 44 }}
                            accessibilityRole="button"
                            accessibilityLabel={`Start ${nextAction.label}`}
                        >
                            <View className="flex-row items-center flex-1">
                                <Zap size={16} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.2} />
                                <Text className="ml-2 text-sm font-semibold text-blue-700 dark:text-blue-300" numberOfLines={1}>
                                    {nextAction.label}
                                </Text>
                            </View>
                            {nextAction.actionRoute && (
                                <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.2} />
                            )}
                        </ScalePressable>
                    )}
                </View>
            </GlassView>
        </Animated.View>
    );
}
