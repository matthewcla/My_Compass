import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { usePCSPhase, usePCSStore, useSubPhase } from '@/store/usePCSStore';
import { useUserDependents } from '@/store/useUserStore';
import { AssignmentPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Anchor, Calendar, Eye, FileCheck, Heart, Package, Plane, Star, Timer, Users } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface StatusCardProps {
    nextCycle: string;
    daysUntilOpen: number;
}

// ── Variant Derivation ───────────────────────────────────────────────────────

type StatusVariant =
    | 'cycle-prep'
    | 'cycle-open'
    | 'negotiation'
    | 'selected'
    | 'processing'
    | 'orders-received'
    | 'plan-move'
    | 'en-route'
    | 'welcome-aboard';

function deriveVariant(
    assignmentPhase: AssignmentPhase | null,
    pcsPhase: string | null,
    pcsSubPhase: string | null,
): StatusVariant {
    switch (assignmentPhase) {
        case 'ON_RAMP':
            return 'cycle-open';
        case 'NEGOTIATION':
            return 'negotiation';
        case 'SELECTION':
            return 'selected';
        case 'ORDERS_PROCESSING':
            return 'processing';
        case 'ORDERS_RELEASED':
            if (pcsPhase === 'CHECK_IN') return 'welcome-aboard';
            if (pcsPhase === 'TRANSIT_LEAVE' && pcsSubPhase === 'ACTIVE_TRAVEL') return 'en-route';
            if (pcsPhase === 'TRANSIT_LEAVE' && pcsSubPhase === 'PLANNING') return 'plan-move';
            return 'orders-received';
        case 'DISCOVERY':
        default:
            return 'cycle-prep';
    }
}

// ── Component ────────────────────────────────────────────────────────────────

export function StatusCard({ nextCycle, daysUntilOpen }: StatusCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    const assignmentPhase = useDemoStore((state) => state.assignmentPhaseOverride);
    const activeOrder = usePCSStore((state) => state.activeOrder);
    const obliserv = usePCSStore((state) => state.financials.obliserv);
    const checklist = usePCSStore((state) => state.checklist);
    const financials = usePCSStore((state) => state.financials);
    const pcsPhase = usePCSPhase();
    const pcsSubPhase = useSubPhase();

    // Always call — needed for negotiation/on-ramp variants but hooks must be unconditional
    const applications = useAssignmentStore((s) => s.applications);
    const userApplicationIds = useAssignmentStore((s) => s.userApplicationIds);
    const realDecisions = useAssignmentStore((s) => s.realDecisions);
    const currentProfile = useCurrentProfile();
    const dependentCount = useUserDependents() ?? 0;

    const variant = deriveVariant(assignmentPhase, pcsPhase, pcsSubPhase);

    // Days on station (welcome-aboard only)
    const daysOnStation = useMemo(() => {
        if (variant !== 'welcome-aboard' || !activeOrder?.reportNLT) return 0;
        const report = new Date(activeOrder.reportNLT);
        const today = new Date();
        report.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    }, [variant, activeOrder?.reportNLT]);

    // Countdown to report NLT (orders-received + plan-move)
    const daysToReport = useMemo(() => {
        if ((variant !== 'plan-move' && variant !== 'orders-received' && variant !== 'en-route') || !activeOrder?.reportNLT) return null;
        const nlt = new Date(activeOrder.reportNLT);
        const today = new Date();
        nlt.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return Math.max(0, Math.ceil((nlt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }, [variant, activeOrder?.reportNLT]);

    switch (variant) {
        // ── Welcome Aboard (Phase 4) ────────────────────────────────
        case 'welcome-aboard': {
            const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
            const uniformOfDay = activeOrder?.gainingCommand.uniformOfDay?.trim() || null;

            // UCT Phase 4 progress (Check-in & Claim)
            const phase4Items = checklist.filter(i => i.uctPhase === 4);
            const completedPhase4 = phase4Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase4 = phase4Items.length;
            const wabNextAction = checklist.find(
                i => i.uctPhase === 4 && i.status === 'NOT_STARTED'
            );

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-green-400 dark:border-green-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(34,197,94,0.08)', 'rgba(34,197,94,0.02)']
                                : ['rgba(34,197,94,0.14)', 'rgba(34,197,94,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title | Day N pill ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-green-100 dark:bg-green-900/30">
                                        <Anchor size={24} color={isDark ? '#4ade80' : '#15803d'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-green-900 dark:text-green-100">Welcome Aboard</Headline>
                                        <Detail>{gainingCommand}</Detail>
                                    </View>
                                </View>

                                <Pill bg="bg-green-100 dark:bg-green-900/40" border="border-green-200 dark:border-green-700/50">
                                    <PillText color="text-green-800 dark:text-green-200">Day {daysOnStation}</PillText>
                                </Pill>
                            </View>

                            {/* ── Footer Row: progress + next action + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-1">
                                    {/* Phase 4 progress dots */}
                                    {totalPhase4 > 0 && (
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="flex-row gap-0.5">
                                                {phase4Items.map((item) => (
                                                    <View
                                                        key={item.id}
                                                        className={`w-5 h-2 rounded-full ${item.status === 'COMPLETE'
                                                            ? 'bg-green-500 dark:bg-green-400'
                                                            : item.status === 'IN_PROGRESS'
                                                                ? 'bg-green-400 dark:bg-green-500'
                                                                : 'bg-slate-300 dark:bg-slate-600'
                                                            }`}
                                                    />
                                                ))}
                                            </View>
                                            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                {completedPhase4}/{totalPhase4} check-in tasks
                                            </Text>
                                        </View>
                                    )}

                                    {/* Next action */}
                                    {wabNextAction && (
                                        <Text className="text-green-700 dark:text-green-300 text-[11px] font-semibold" numberOfLines={1}>
                                            Next: {wabNextAction.label}
                                        </Text>
                                    )}

                                    {/* Uniform of the day */}
                                    {uniformOfDay && (
                                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            👔 {uniformOfDay}
                                        </Text>
                                    )}
                                </View>

                                {/* CTA — bottom right */}
                                <TouchableOpacity
                                    onPress={() => router.push('/pcs/check-in' as any)}
                                    className="bg-green-600 dark:bg-green-700 px-3 py-2 rounded-lg border border-green-500 dark:border-green-600 ml-3"
                                >
                                    <CTAText>Check{`\n`}In</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── Plan Move (TRANSIT_LEAVE + PLANNING) ─────────────────────
        case 'plan-move': {
            const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';

            // PCS planning steps: UCT phases 1 (Orders & OBLISERV) + 2 (Logistics & Finances)
            const planItems = checklist.filter(i => i.uctPhase === 1 || i.uctPhase === 2);
            const completedPlanItems = planItems.filter(i => i.status === 'COMPLETE').length;
            const totalPlanItems = planItems.length;

            // Next action — first NOT_STARTED item from planning phases
            const nextAction = checklist.find(
                i => (i.uctPhase === 1 || i.uctPhase === 2) && i.status === 'NOT_STARTED'
            );

            // HHG micro-status
            const shipments = financials.hhg?.shipments ?? [];
            const hasShipments = shipments.length > 0;
            const hhgLabel = hasShipments
                ? shipments.some(s => s.status === 'CONFIRMED')
                    ? '✅ HHG Scheduled'
                    : shipments.some(s => s.status === 'SUBMITTED')
                        ? '⏳ HHG Submitted'
                        : '📋 HHG Drafted'
                : null;

            // Urgency color escalation for countdown
            const urgencyColor = daysToReport !== null
                ? daysToReport < 30
                    ? { num: 'text-red-600 dark:text-red-400', label: 'text-red-500 dark:text-red-400' }
                    : daysToReport <= 60
                        ? { num: 'text-orange-600 dark:text-orange-400', label: 'text-orange-500 dark:text-orange-400' }
                        : { num: 'text-teal-950 dark:text-white', label: 'text-teal-700 dark:text-teal-300' }
                : { num: 'text-teal-950 dark:text-white', label: 'text-teal-700 dark:text-teal-300' };

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-teal-400 dark:border-teal-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(20,184,166,0.08)', 'rgba(20,184,166,0.02)']
                                : ['rgba(20,184,166,0.14)', 'rgba(20,184,166,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title aligned with days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-teal-100 dark:bg-teal-900/30">
                                        <Package size={24} color={isDark ? '#2dd4bf' : '#0d9488'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-teal-900 dark:text-teal-100">Plan Your Move</Headline>
                                        <Detail>{gainingCommand}</Detail>
                                    </View>
                                </View>

                                {daysToReport !== null && (
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className={`${urgencyColor.num} text-2xl font-black font-mono tracking-tighter`}>
                                            {daysToReport}
                                        </Text>
                                        <Text className={`${urgencyColor.label} text-[10px] font-bold uppercase tracking-wide`}>
                                            Days
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* ── Progress + Next Action + CTA Row ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-1">
                                    {/* Checklist progress */}
                                    <View className="flex-row items-center gap-1.5">
                                        <View className="flex-row gap-0.5">
                                            {planItems.map((item) => (
                                                <View
                                                    key={item.id}
                                                    className={`w-5 h-2 rounded-full ${item.status === 'COMPLETE'
                                                        ? 'bg-green-500 dark:bg-green-400'
                                                        : item.status === 'IN_PROGRESS'
                                                            ? 'bg-teal-400 dark:bg-teal-500'
                                                            : 'bg-slate-300 dark:bg-slate-600'
                                                        }`}
                                                />
                                            ))}
                                        </View>
                                        <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                            {completedPlanItems}/{totalPlanItems} PCS tasks
                                        </Text>
                                    </View>

                                    {/* Next action */}
                                    {nextAction && (
                                        <Text className="text-teal-700 dark:text-teal-300 text-[11px] font-semibold" numberOfLines={1}>
                                            Next: {nextAction.label}
                                        </Text>
                                    )}

                                    {/* HHG micro-status */}
                                    {hhgLabel ? (
                                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            {hhgLabel}
                                        </Text>
                                    ) : (
                                        <Text className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                            ⚠️ HHG: Not Started
                                        </Text>
                                    )}
                                </View>

                                {/* CTA — bottom right */}
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/(pcs)/pcs')}
                                    className="bg-teal-600 dark:bg-teal-700 px-3 py-2 rounded-lg border border-teal-500 dark:border-teal-600 ml-3"
                                >
                                    <CTAText>My{`\n`}Roadmap</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── En Route (TRANSIT_LEAVE + ACTIVE_TRAVEL) ──────────────────
        case 'en-route': {
            const enGainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';

            // UCT Phase 3 progress (Transit & Leave)
            const phase3Items = checklist.filter(i => i.uctPhase === 3);
            const completedPhase3 = phase3Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase3 = phase3Items.length;
            const enNextAction = checklist.find(
                i => i.uctPhase === 3 && i.status === 'NOT_STARTED'
            );

            // HHG micro-status
            const enShipments = financials.hhg?.shipments ?? [];
            const enHasShipments = enShipments.length > 0;
            const enHhgLabel = enHasShipments
                ? enShipments.some(s => s.status === 'CONFIRMED')
                    ? '✅ HHG Scheduled'
                    : enShipments.some(s => s.status === 'SUBMITTED')
                        ? '⏳ HHG Submitted'
                        : '📋 HHG Drafted'
                : null;

            // Urgency color escalation for countdown
            const enUrgencyColor = daysToReport !== null
                ? daysToReport < 30
                    ? { num: 'text-red-600 dark:text-red-400', label: 'text-red-500 dark:text-red-400' }
                    : daysToReport <= 60
                        ? { num: 'text-orange-600 dark:text-orange-400', label: 'text-orange-500 dark:text-orange-400' }
                        : { num: 'text-sky-950 dark:text-white', label: 'text-sky-700 dark:text-sky-300' }
                : { num: 'text-sky-950 dark:text-white', label: 'text-sky-700 dark:text-sky-300' };

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-sky-400 dark:border-sky-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(56,189,248,0.08)', 'rgba(56,189,248,0.02)']
                                : ['rgba(56,189,248,0.14)', 'rgba(56,189,248,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title aligned with days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-sky-100 dark:bg-sky-900/30">
                                        <Plane size={24} color={isDark ? '#38bdf8' : '#0284c7'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-sky-900 dark:text-sky-100">En Route</Headline>
                                        <Detail>{enGainingCommand}</Detail>
                                    </View>
                                </View>

                                {daysToReport !== null && (
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className={`${enUrgencyColor.num} text-2xl font-black font-mono tracking-tighter`}>
                                            {daysToReport}
                                        </Text>
                                        <Text className={`${enUrgencyColor.label} text-[10px] font-bold uppercase tracking-wide`}>
                                            Days
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* ── Footer Row: Progress + Next Action + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-1">
                                    {/* Phase 3 progress dots */}
                                    {totalPhase3 > 0 && (
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="flex-row gap-0.5">
                                                {phase3Items.map((item) => (
                                                    <View
                                                        key={item.id}
                                                        className={`w-5 h-2 rounded-full ${item.status === 'COMPLETE'
                                                            ? 'bg-green-500 dark:bg-green-400'
                                                            : item.status === 'IN_PROGRESS'
                                                                ? 'bg-sky-400 dark:bg-sky-500'
                                                                : 'bg-slate-300 dark:bg-slate-600'
                                                            }`}
                                                    />
                                                ))}
                                            </View>
                                            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                {completedPhase3}/{totalPhase3} Phase 3
                                            </Text>
                                        </View>
                                    )}

                                    {/* Next action */}
                                    {enNextAction && (
                                        <Text className="text-sky-700 dark:text-sky-300 text-[11px] font-semibold" numberOfLines={1}>
                                            Next: {enNextAction.label}
                                        </Text>
                                    )}

                                    {/* HHG micro-status */}
                                    {enHhgLabel ? (
                                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            {enHhgLabel}
                                        </Text>
                                    ) : (
                                        <Text className="text-red-500 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                            ⚠️ HHG: Not Started
                                        </Text>
                                    )}
                                </View>

                                {/* CTA — bottom right */}
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/(pcs)/pcs')}
                                    className="bg-sky-600 dark:bg-sky-700 px-3 py-2 rounded-lg border border-sky-500 dark:border-sky-600 ml-3"
                                >
                                    <CTAText>My{`\n`}Roadmap</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── Orders Received (PCS Phase 1) ──────────────────────────
        case 'orders-received': {
            const ordGainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
            const ordBilletTitle = useDemoStore.getState().selectionDetails?.billetTitle ?? null;

            // Urgency color escalation (reuses top-level daysToReport)
            const ordUrgencyColor = daysToReport !== null
                ? daysToReport < 30
                    ? { num: 'text-red-600 dark:text-red-400', label: 'text-red-500 dark:text-red-400' }
                    : daysToReport <= 60
                        ? { num: 'text-orange-600 dark:text-orange-400', label: 'text-orange-500 dark:text-orange-400' }
                        : { num: 'text-amber-950 dark:text-white', label: 'text-amber-700 dark:text-amber-300' }
                : { num: 'text-amber-950 dark:text-white', label: 'text-amber-700 dark:text-amber-300' };

            // UCT Phase 1 progress
            const phase1Items = checklist.filter(i => i.uctPhase === 1);
            const completedPhase1 = phase1Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase1 = phase1Items.length;
            const ordNextAction = checklist.find(
                i => i.uctPhase === 1 && i.status === 'NOT_STARTED'
            );

            // Duty type flags
            const isOconus = activeOrder?.isOconus ?? false;
            const isSeaDuty = activeOrder?.isSeaDuty ?? false;

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-amber-400 dark:border-amber-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(251,191,36,0.08)', 'rgba(251,191,36,0.02)']
                                : ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title aligned with days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/30">
                                        <FileCheck size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-amber-900 dark:text-amber-100">Orders Received</Headline>
                                        <Detail>{ordGainingCommand}</Detail>
                                        {ordBilletTitle && (
                                            <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold" numberOfLines={1}>
                                                {ordBilletTitle}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {daysToReport !== null && (
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className={`${ordUrgencyColor.num} text-2xl font-black font-mono tracking-tighter`}>
                                            {daysToReport}
                                        </Text>
                                        <Text className={`${ordUrgencyColor.label} text-[10px] font-bold uppercase tracking-wide`}>
                                            Days
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* ── Footer Row: Progress + Next Action + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-1">
                                    {/* UCT Phase 1 progress dots */}
                                    {totalPhase1 > 0 && (
                                        <View className="flex-row items-center gap-1.5">
                                            <View className="flex-row gap-0.5">
                                                {phase1Items.map((item) => (
                                                    <View
                                                        key={item.id}
                                                        className={`w-5 h-2 rounded-full ${item.status === 'COMPLETE'
                                                            ? 'bg-green-500 dark:bg-green-400'
                                                            : item.status === 'IN_PROGRESS'
                                                                ? 'bg-amber-400 dark:bg-amber-500'
                                                                : 'bg-slate-300 dark:bg-slate-600'
                                                            }`}
                                                    />
                                                ))}
                                            </View>
                                            <Text className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                                                {completedPhase1}/{totalPhase1} Phase 1
                                            </Text>
                                        </View>
                                    )}

                                    {/* Next action */}
                                    {ordNextAction && (
                                        <Text className="text-amber-700 dark:text-amber-300 text-[11px] font-semibold" numberOfLines={1}>
                                            Next: {ordNextAction.label}
                                        </Text>
                                    )}

                                    {/* Duty-type micro-status */}
                                    {(isOconus || isSeaDuty) ? (
                                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                                            {isOconus ? '🌍 OCONUS' : ''}{isOconus && isSeaDuty ? ' · ' : ''}{isSeaDuty ? '⚓ Sea Duty' : ''}
                                        </Text>
                                    ) : null}
                                </View>

                                {/* CTA — bottom right */}
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/(pcs)/pcs')}
                                    className="bg-amber-600 dark:bg-amber-700 px-3 py-2 rounded-lg border border-amber-500 dark:border-amber-600 ml-3"
                                >
                                    <CTAText>My{`\n`}Roadmap</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── Orders Processing ───────────────────────────────────────
        case 'processing': {
            const procSelectionDetails = useDemoStore.getState().selectionDetails;
            const procGainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
            const procBilletTitle = procSelectionDetails?.billetTitle;
            const procEstDate = procSelectionDetails?.estimatedOrdersDate
                ? new Date(procSelectionDetails.estimatedOrdersDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : null;

            // Derive human-readable pipeline label
            const procPipelineLabel = (() => {
                switch (procSelectionDetails?.pipelineStatus) {
                    case 'MATCH_ANNOUNCED': return 'Match Announced';
                    case 'CO_ENDORSEMENT': return 'Awaiting CO Endorsement';
                    case 'PERS_PROCESSING': return 'PERS Processing';
                    case 'ORDERS_DRAFTING': return 'Orders Being Drafted';
                    case 'ORDERS_RELEASED': return 'Orders Released';
                    default: return null;
                }
            })();

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-zinc-400 dark:border-zinc-500 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(161,161,170,0.08)', 'rgba(161,161,170,0.02)']
                                : ['rgba(161,161,170,0.14)', 'rgba(161,161,170,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title | Est. date pill ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-zinc-100 dark:bg-zinc-800/30">
                                        <FileCheck size={24} color={isDark ? '#a1a1aa' : '#52525b'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline>Orders Processing</Headline>
                                        <Detail>{procGainingCommand}</Detail>
                                        {procBilletTitle && (
                                            <Text className="text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold" numberOfLines={1}>
                                                {procBilletTitle}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <Pill bg="bg-zinc-100 dark:bg-zinc-800/40" border="border-zinc-200 dark:border-zinc-600/50">
                                    <PillText color="text-zinc-700 dark:text-zinc-300">
                                        {procEstDate ? `Est. ${procEstDate}` : 'Pending'}
                                    </PillText>
                                </Pill>
                            </View>

                            {/* ── Footer Row: pipeline status + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                {procPipelineLabel ? (
                                    <Text className="text-zinc-500 dark:text-zinc-400 text-[11px] font-semibold flex-1">
                                        ⏱ {procPipelineLabel}
                                    </Text>
                                ) : (
                                    <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex-1">
                                        Awaiting pipeline update
                                    </Text>
                                )}

                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/(assignment)' as any)}
                                    className="bg-zinc-100 dark:bg-zinc-800/40 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-600/50 ml-3"
                                >
                                    <CTAText color="text-zinc-700 dark:text-zinc-300">Track{`\n`}Progress</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── You've Been Selected (Celebratory) ────────────────────
        case 'selected': {
            const selectionDetails = useDemoStore.getState().selectionDetails;
            const selGainingCommand = activeOrder?.gainingCommand.name || 'Awaiting assignment details';
            const selBilletTitle = selectionDetails?.billetTitle;
            const selReportNLT = activeOrder?.reportNLT
                ? new Date(activeOrder.reportNLT).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : null;
            const obliservBlocked = obliserv.required && obliserv.status !== 'COMPLETE';

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-emerald-400 dark:border-emerald-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(16,185,129,0.08)', 'rgba(16,185,129,0.02)']
                                : ['rgba(16,185,129,0.14)', 'rgba(16,185,129,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: star icon + headline + details ── */}
                            <View className="flex-row items-center gap-4">
                                <View className="w-12 h-12 rounded-full overflow-hidden items-center justify-center">
                                    <LinearGradient
                                        colors={['#A7F3D0', '#10B981']}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                    />
                                    <Star size={24} color={isDark ? '#064E3B' : '#FFFFFF'} fill={isDark ? '#064E3B' : '#FFFFFF'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-emerald-900 dark:text-emerald-100 text-lg font-black leading-tight mb-0.5">
                                        You've Been Selected!!!
                                    </Text>
                                    <Detail>{selGainingCommand}</Detail>
                                    {selBilletTitle && (
                                        <Text className="text-emerald-800 dark:text-emerald-200 text-[11px] font-semibold" numberOfLines={1}>
                                            {selBilletTitle}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* ── Footer Row: report date + status + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-0.5">
                                    {selReportNLT && (
                                        <Text className="text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
                                            Report by {selReportNLT}
                                        </Text>
                                    )}
                                    {obliservBlocked && (
                                        <Text className="text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider">
                                            ⚠ OBLISERV Extension Required
                                        </Text>
                                    )}
                                </View>

                                {obliservBlocked ? (
                                    <TouchableOpacity
                                        onPress={() => router.push('/pcs-wizard/obliserv-check' as any)}
                                        className="bg-red-600 dark:bg-red-700 px-3 py-2 rounded-lg border border-red-500 dark:border-red-600 ml-3"
                                    >
                                        <CTAText>Extend{`\n`}to Accept</CTAText>
                                    </TouchableOpacity>
                                ) : (
                                    <TouchableOpacity
                                        onPress={() => router.push('/(tabs)/(assignment)' as any)}
                                        className="bg-emerald-100 dark:bg-emerald-900/40 px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700/50 ml-3"
                                    >
                                        <CTAText color="text-emerald-800 dark:text-emerald-200">View{`\n`}Details</CTAText>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── MNA Negotiation ─────────────────────────────────────────
        case 'negotiation': {
            const negotiationDetails = useDemoStore.getState().negotiationDetails;

            // Derive slate status
            const slateCount = userApplicationIds.length;
            const submittedCount = userApplicationIds.filter(
                (id) => applications[id]?.status === 'submitted'
            ).length;
            const allSubmitted = slateCount > 0 && submittedCount === slateCount;
            const hasAnyApps = slateCount > 0;

            // Derive deadline label
            const closeDate = negotiationDetails?.windowCloseDate
                ? new Date(negotiationDetails.windowCloseDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                })
                : null;

            // Detailer info
            const detailerName = negotiationDetails?.detailer.name ?? null;
            const detailerOffice = negotiationDetails?.detailer.office ?? null;

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-amber-400 dark:border-amber-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(251,191,36,0.08)', 'rgba(251,191,36,0.02)']
                                : ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title | days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/50">
                                        <Users size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-amber-900 dark:text-amber-100">MNA Negotiation</Headline>
                                        <Detail>Build and submit your ranked slate</Detail>
                                    </View>
                                </View>

                                <View className="flex-row items-baseline gap-1">
                                    <Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">
                                        {daysUntilOpen}
                                    </Text>
                                    <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                                        Days
                                    </Text>
                                </View>
                            </View>

                            {/* ── Footer Row: slate status + deadline + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-0.5">
                                    {/* Slate Status */}
                                    <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        {allSubmitted
                                            ? `✅ Slate Submitted`
                                            : hasAnyApps
                                                ? `⚠️ ${slateCount} of ${MAX_SLATE_SIZE} drafted`
                                                : `⚠️ No billets on slate`}
                                        {allSubmitted ? ` (${submittedCount} of ${MAX_SLATE_SIZE})` : ''}
                                    </Text>

                                    {/* Deadline */}
                                    {closeDate && (
                                        <Text className="text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
                                            Window closes {closeDate}
                                        </Text>
                                    )}

                                    {/* Detailer Line */}
                                    {detailerName && (
                                        <Text
                                            className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider"
                                            numberOfLines={1}
                                        >
                                            ⏳ {detailerName}{detailerOffice ? ` · ${detailerOffice}` : ''}
                                        </Text>
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={() => router.push('/(career)/discovery' as any)}
                                    className="bg-amber-100 dark:bg-amber-900/60 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700/50 ml-3"
                                >
                                    <CTAText color="text-amber-800 dark:text-amber-200">My{`\n`}Slate</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── Cycle Open (On-Ramp) ────────────────────────────────────
        case 'cycle-open': {
            const prdLabel = currentProfile?.prd
                ? new Date(currentProfile.prd).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                : null;

            // Prep readiness — same source as DiscoveryStatusCard
            const reviewed = Object.keys(realDecisions).length;
            const saved = Object.values(realDecisions).filter(
                (d) => d === 'super' || d === 'like'
            ).length;
            const hasPrepped = reviewed > 0;

            return (
                <CardShell borderColor="border-indigo-500 dark:border-indigo-400" isDark={isDark}>
                    {/* ── Header: icon + title + PRD ── */}
                    <View className="flex-row items-center gap-2 w-full">
                        <Timer size={16} color={isDark ? '#818cf8' : '#4f46e5'} />
                        <Text className="text-indigo-900 dark:text-indigo-100 text-sm font-extrabold flex-shrink">
                            Cycle {nextCycle} Opening Soon
                        </Text>
                        {prdLabel && (
                            <Text className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold ml-auto">
                                PRD {prdLabel}
                            </Text>
                        )}
                    </View>

                    {/* ── Hero: countdown + prep stats ── */}
                    <View className="flex-row items-center mt-3 w-full">
                        <View className="flex-row items-baseline gap-1.5">
                            <Text className="text-indigo-950 dark:text-white text-4xl font-black font-mono tracking-tighter">
                                {daysUntilOpen}
                            </Text>
                            <Text className="text-indigo-700 dark:text-indigo-300 text-xs font-bold uppercase tracking-wide">
                                Days
                            </Text>
                        </View>

                        {/* Compact prep stats — right side */}
                        <View className="ml-auto items-end gap-0.5">
                            {hasPrepped ? (
                                <>
                                    <View className="flex-row items-center gap-1">
                                        <Eye size={11} color={isDark ? '#818cf8' : '#3730a3'} />
                                        <Text className="text-indigo-800 dark:text-indigo-200 text-[11px] font-semibold">
                                            {reviewed} reviewed
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <Heart size={11} color={isDark ? '#818cf8' : '#3730a3'} />
                                        <Text className="text-indigo-800 dark:text-indigo-200 text-[11px] font-semibold">
                                            {saved} saved
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text className="text-indigo-600 dark:text-indigo-400 text-[11px] font-medium">
                                    No billets reviewed yet
                                </Text>
                            )}
                        </View>
                    </View>

                    {/* ── Footer: coaching + CTA ── */}
                    <View className="flex-row items-end mt-3 w-full gap-3">
                        <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-medium flex-1 leading-[14px]">
                            When the window opens, you'll build and submit your ranked slate.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/(profile)/preferences')}
                            className="bg-indigo-100 dark:bg-indigo-900/60 px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700/50"
                        >
                            <CTAText color="text-indigo-800 dark:text-indigo-200">Get{`\n`}Ready</CTAText>
                        </TouchableOpacity>
                    </View>
                </CardShell>
            );
        }

        // ── Cycle Prep (Discovery / Default) ────────────────────────
        // Sailor is >17 months from PRD — calm, exploratory tone.
        case 'cycle-prep':
        default: {
            // Derive PRD from profile, fall back to mock
            const prdDate = currentProfile?.prd ? new Date(currentProfile.prd) : null;
            const prdLabel = prdDate
                ? prdDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
                : 'Oct 2027';
            const monthsOut = prdDate
                ? Math.max(0, Math.round((prdDate.getTime() - Date.now()) / (30.44 * 86400000)))
                : 19;

            return (
                <View className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border-l-4 border-blue-400 dark:border-blue-400 rounded-xl overflow-hidden shadow-sm bg-slate-50 dark:bg-slate-900/50"
                    >
                        <LinearGradient
                            colors={isDark
                                ? ['rgba(59,130,246,0.08)', 'rgba(59,130,246,0.02)']
                                : ['rgba(59,130,246,0.14)', 'rgba(59,130,246,0.04)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={{ paddingLeft: 16, paddingRight: 12, paddingVertical: 16 }}
                        >
                            {/* ── Header Row: icon + title | months counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-blue-100 dark:bg-blue-900/30">
                                        <Calendar size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-blue-900 dark:text-blue-100">MNA Cycle Opens</Headline>
                                        <Detail>PRD {prdLabel}</Detail>
                                    </View>
                                </View>

                                <View className="flex-row items-baseline gap-1">
                                    <Text className="text-blue-950 dark:text-white text-2xl font-black font-mono tracking-tighter">
                                        ~{monthsOut}
                                    </Text>
                                    <Text className="text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wide">
                                        Months
                                    </Text>
                                </View>
                            </View>

                            {/* ── Footer Row: coaching + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex-1 leading-[14px]">
                                    Explore billets now — no action required yet.
                                </Text>

                                <TouchableOpacity
                                    onPress={() => router.push('/(career)/discovery' as any)}
                                    className="bg-blue-600 dark:bg-blue-700 px-3 py-2 rounded-lg border border-blue-500 dark:border-blue-600 ml-3"
                                >
                                    <CTAText>Start{`\n`}Exploring</CTAText>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }
    }
}

// ── Shared Primitives ────────────────────────────────────────────────────────

function CardShell({
    borderColor,
    isDark,
    children,
}: {
    borderColor: string;
    isDark: boolean;
    children: React.ReactNode;
}) {
    return (
        <View className="flex flex-col gap-2">
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className={`border-l-4 ${borderColor} pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-col shadow-sm bg-slate-50 dark:bg-slate-900/50`}
            >
                {children}
            </GlassView>
        </View>
    );
}

function IconBubble({ bg, children }: { bg: string; children: React.ReactNode }) {
    return <View className={`${bg} p-3 rounded-full`}>{children}</View>;
}

function Headline({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
        <Text className={`${color || 'text-slate-900 dark:text-slate-100'} text-base font-bold leading-none mb-1`}>
            {children}
        </Text>
    );
}

function Detail({ children }: { children: React.ReactNode }) {
    return (
        <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium leading-tight" numberOfLines={1}>
            {children}
        </Text>
    );
}

function Pill({ bg, border, children }: { bg: string; border: string; children: React.ReactNode }) {
    return (
        <View className={`${bg} px-2.5 py-1 rounded-full border ${border}`}>
            {children}
        </View>
    );
}

function PillText({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <Text className={`text-[10px] font-black ${color} uppercase tracking-wider`}>
            {children}
        </Text>
    );
}

function CTAText({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
        <Text className={`text-[10px] font-bold ${color || 'text-white'} text-center uppercase tracking-wide`}>
            {children}
        </Text>
    );
}
