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
    const isDemoMode = useDemoStore((state) => state.isDemoMode);
    const demoTimeline = useDemoStore((state) => state.demoTimelineOverride);
    const negotiationDetails = useDemoStore((state) => state.negotiationDetails);
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
        // Use demo timeline override when available
        if (isDemoMode && demoTimeline && demoTimeline.daysOnStation > 0) {
            return demoTimeline.daysOnStation;
        }
        if (variant !== 'welcome-aboard' || !activeOrder?.reportNLT) return 0;
        const report = new Date(activeOrder.reportNLT);
        const today = new Date();
        report.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    }, [variant, activeOrder?.reportNLT, isDemoMode, demoTimeline]);

    // Countdown to report NLT (orders-received + plan-move + en-route)
    const daysToReport = useMemo(() => {
        // Use demo timeline override when available
        if (isDemoMode && demoTimeline && demoTimeline.daysToReport > 0) {
            return demoTimeline.daysToReport;
        }
        if ((variant !== 'plan-move' && variant !== 'orders-received' && variant !== 'en-route') || !activeOrder?.reportNLT) return null;
        const nlt = new Date(activeOrder.reportNLT);
        const today = new Date();
        nlt.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return Math.max(0, Math.ceil((nlt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }, [variant, activeOrder?.reportNLT, isDemoMode, demoTimeline]);

    // Days until negotiation window closes
    const daysUntilClose = useMemo(() => {
        if (!negotiationDetails?.windowCloseDate) return null;
        const close = new Date(negotiationDetails.windowCloseDate);
        const today = new Date();
        close.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);
        return Math.max(0, Math.ceil((close.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    }, [negotiationDetails?.windowCloseDate]);

    switch (variant) {
        // ── Welcome Aboard (Phase 4) ────────────────────────────────
        case 'welcome-aboard': {
            const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
            const uniformMonth = new Date().getMonth();
            const reportingUniform = uniformMonth >= 3 && uniformMonth <= 8 ? 'Service Dress Whites' : 'Service Dress Blues';

            // UCT Phase 4 progress (Check-in & Claim)
            const phase4Items = checklist.filter(i => i.uctPhase === 4);
            const completedPhase4 = phase4Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase4 = phase4Items.length;
            const wabNextAction = checklist.find(
                i => i.uctPhase === 4 && i.status === 'NOT_STARTED'
            );

            return (
                <TouchableOpacity onPress={() => router.push('/pcs/check-in' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
                            {/* ── Header Row: icon + title | Day N pill ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-green-100 dark:bg-green-900/30">
                                        <Anchor size={24} color={isDark ? '#3AAE6C' : '#16A34A'} />
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
                                </View>

                                {/* CTA — bottom right */}
                                <View
                                    className="bg-green-100 dark:bg-green-700 px-3 py-2 rounded-xl border border-green-900/10 dark:border-green-600 ml-3"
                                >
                                    <CTAText color="text-green-900 dark:text-white">Check{`\n`}In</CTAText>
                                </View>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
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
                        : { num: 'text-slate-900 dark:text-white', label: 'text-[#1A4E8A] dark:text-[#5B8FCF]' }
                : { num: 'text-slate-900 dark:text-white', label: 'text-[#1A4E8A] dark:text-[#5B8FCF]' };

            return (
                <TouchableOpacity onPress={() => router.push('/(tabs)/(pcs)/pcs' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
                            {/* ── Header Row: icon + title aligned with days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-[#E4EAF4] dark:bg-[rgba(26,78,138,0.25)]">
                                        <Package size={24} color={isDark ? '#5B8FCF' : '#1A4E8A'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-slate-900 dark:text-slate-100">Plan Your Move</Headline>
                                        <Detail>{gainingCommand}</Detail>
                                    </View>
                                </View>

                                {daysToReport !== null && (
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className={`${urgencyColor.num} text-2xl font-semibold font-mono tracking-tighter`}>
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
                                        <Text className="text-[#1A4E8A] dark:text-[#5B8FCF] text-[11px] font-semibold" numberOfLines={1}>
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
                                    onPress={() => router.push('/(tabs)/(pcs)/pcs' as any)}
                                    className="bg-blue-50 dark:bg-[#1A4E8A] px-3 py-2 rounded-xl border border-blue-900/10 dark:border-[#5B8FCF] ml-3"
                                >
                                    <CTAText color="text-[#1A4E8A] dark:text-white">My{`\n`}Roadmap</CTAText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
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
                        : { num: 'text-slate-900 dark:text-white', label: 'text-[#1A4E8A] dark:text-[#5B8FCF]' }
                : { num: 'text-slate-900 dark:text-white', label: 'text-[#1A4E8A] dark:text-[#5B8FCF]' };

            return (
                <TouchableOpacity onPress={() => router.push('/(tabs)/(pcs)/pcs' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
                            {/* ── Header Row: icon + title aligned with days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-[#E4EAF4] dark:bg-[rgba(26,78,138,0.25)]">
                                        <Plane size={24} color={isDark ? '#5B8FCF' : '#1A4E8A'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-slate-900 dark:text-slate-100">En Route</Headline>
                                        <Detail>{enGainingCommand}</Detail>
                                    </View>
                                </View>

                                {daysToReport !== null && (
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className={`${enUrgencyColor.num} text-2xl font-semibold font-mono tracking-tighter`}>
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
                                        <Text className="text-[#1A4E8A] dark:text-[#5B8FCF] text-[11px] font-semibold" numberOfLines={1}>
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
                                    onPress={() => router.push('/(tabs)/(pcs)/pcs' as any)}
                                    className="bg-blue-50 dark:bg-[#1A4E8A] px-3 py-2 rounded-xl border border-blue-900/10 dark:border-[#5B8FCF] ml-3"
                                >
                                    <CTAText color="text-[#1A4E8A] dark:text-white">My{`\n`}Roadmap</CTAText>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
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
                <TouchableOpacity onPress={() => router.push('/(tabs)/(pcs)/pcs' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
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
                                        <Text className={`${ordUrgencyColor.num} text-2xl font-semibold font-mono tracking-tighter`}>
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
                                <View
                                    className="bg-amber-100 dark:bg-amber-700 px-3 py-2 rounded-xl border border-amber-900/10 dark:border-amber-600 ml-3"
                                >
                                    <CTAText color="text-amber-900 dark:text-white">My{`\n`}Roadmap</CTAText>
                                </View>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
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
                <TouchableOpacity onPress={() => router.push('/(tabs)/(assignment)' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
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

                                <View
                                    className="bg-zinc-100 dark:bg-zinc-800/40 px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-600/50 ml-3"
                                >
                                    <CTAText color="text-zinc-800 dark:text-zinc-300">Track{`\n`}Progress</CTAText>
                                </View>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
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
                <TouchableOpacity onPress={() => router.push('/(tabs)/(assignment)' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
                            {/* ── Header Row: star icon + headline + details ── */}
                            <View className="flex-row items-center gap-4">
                                <View className="w-12 h-12 rounded-full overflow-hidden items-center justify-center">
                                    <LinearGradient
                                        colors={['#C8E8D8', '#3AAE6C']}
                                        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                    />
                                    <Star size={24} color="#FFFFFF" fill="#FFFFFF" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-green-900 dark:text-white text-lg font-bold leading-tight mb-0.5">
                                        Selection Confirmed
                                    </Text>
                                    <Detail>{selGainingCommand}</Detail>
                                    {selBilletTitle && (
                                        <Text className="text-green-800 dark:text-green-200 text-[11px] font-semibold" numberOfLines={1}>
                                            {selBilletTitle}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* ── Footer Row: read-only status ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-0.5">
                                    {selReportNLT && (
                                        <Text className="text-green-700 dark:text-green-300 text-[11px] font-semibold">
                                            Report by {selReportNLT}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
            );
        }

        // ── MNA Negotiation ─────────────────────────────────────────
        case 'negotiation': {

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
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
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

                                {daysUntilClose !== null && (
                                    <View className="flex-row items-baseline gap-1">
                                        <Text className="text-amber-950 dark:text-white text-3xl font-semibold font-mono tracking-tighter">
                                            {daysUntilClose}
                                        </Text>
                                        <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                                            Days
                                        </Text>
                                    </View>
                                )}
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
                                </View>

                                {/* CTA — bottom right */}
                                <TouchableOpacity
                                    onPress={() => router.push('/(tabs)/(assignment)' as any)}
                                    className="bg-amber-100 dark:bg-amber-700 px-3 py-2 rounded-xl border border-amber-900/10 dark:border-amber-600 ml-3"
                                >
                                    <CTAText color="text-amber-900 dark:text-white">My{`\n`}Slate</CTAText>
                                </TouchableOpacity>
                            </View>
                        </View>
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
                <TouchableOpacity onPress={() => hasPrepped ? router.push('/(career)/discovery' as any) : router.push('/(tabs)/(profile)/preferences' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
                            {/* ── Header Row: icon + title | days counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/30">
                                        <Timer size={24} color={isDark ? '#C8921C' : '#B07500'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-amber-900 dark:text-amber-100">Cycle {nextCycle} Opening Soon</Headline>
                                        {prdLabel && <Detail>PRD {prdLabel}</Detail>}
                                    </View>
                                </View>

                                <View className="flex-row items-baseline gap-1">
                                    <Text className="text-amber-950 dark:text-white text-3xl font-semibold font-mono tracking-tighter">
                                        {daysUntilOpen}
                                    </Text>
                                    <Text className="text-amber-700 dark:text-amber-300 text-[10px] font-bold uppercase tracking-wide">
                                        Days
                                    </Text>
                                </View>
                            </View>

                            {/* ── Footer Row: prep stats + coaching + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <View className="flex-1 gap-0.5">
                                    {hasPrepped ? (
                                        <>
                                            <View className="flex-row items-center gap-1">
                                                <Eye size={11} color={isDark ? '#C8921C' : '#B07500'} />
                                                <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold">
                                                    {reviewed} reviewed
                                                </Text>
                                            </View>
                                            <View className="flex-row items-center gap-1">
                                                <Heart size={11} color={isDark ? '#C8921C' : '#B07500'} />
                                                <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold">
                                                    {saved} saved
                                                </Text>
                                            </View>
                                        </>
                                    ) : (
                                        <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium leading-[14px]">
                                            Cycle opens soon. Finalize your preferences and resume now.
                                        </Text>
                                    )}
                                </View>

                                {/* hasPrepped ? (
                                    <View
                                        className="bg-indigo-100 dark:bg-indigo-900/60 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700/50 ml-3"
                                    >
                                        <CTAText color="text-indigo-800 dark:text-indigo-200">Review{`\n`}Picks</CTAText>
                                    </View>
                                ) : (
                                    <View
                                        className="bg-indigo-100 dark:bg-indigo-900/60 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700/50 ml-3"
                                    >
                                        <CTAText color="text-indigo-800 dark:text-indigo-200">Get{`\n`}Ready</CTAText>
                                    </View>
                                ) */}
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
            );
        }

        // ── Cycle Prep (Discovery / Default) ────────────────────────
        // Sailor is >17 months from PRD — calm, exploratory tone.
        case 'cycle-prep':
        default: {
            // Derive PRD from profile, fall back to mock
            const prdDate = currentProfile?.prd ? new Date(currentProfile.prd) : null;
            const monthsToPrd = prdDate
                ? Math.max(0, Math.round((prdDate.getTime() - Date.now()) / (30.44 * 86400000)))
                : 19;
            const monthsToMna = Math.max(0, monthsToPrd - 12);

            return (
                <TouchableOpacity onPress={() => router.push('/(career)/discovery' as any)} className="flex flex-col gap-2">
                    <GlassView
                        intensity={80}
                        tint={isDark ? 'dark' : 'light'}
                        className="border border-black/5 dark:border-white/10 rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50"
                    >
                        <View className="px-4 py-4">
                            {/* ── Header Row: icon + title | months counter ── */}
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-[#E4EAF4] dark:bg-[rgba(26,78,138,0.25)]">
                                        <Calendar size={24} color={isDark ? '#5B8FCF' : '#1A4E8A'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-blue-900 dark:text-blue-100">MNA Cycle Opens</Headline>
                                        <Detail>Your PRD is in ~{monthsToPrd} months</Detail>
                                    </View>
                                </View>

                                <View className="flex-row items-baseline gap-1">
                                    <Text className="text-blue-950 dark:text-white text-2xl font-black font-mono tracking-tighter">
                                        ~{monthsToMna}
                                    </Text>
                                    <Text className="text-[#1A4E8A] dark:text-[#5B8FCF] text-[10px] font-bold uppercase tracking-wide">
                                        Months
                                    </Text>
                                </View>
                            </View>

                            {/* ── Footer Row: coaching + CTA ── */}
                            <View className="mt-3 flex-row items-end justify-between">
                                <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium flex-1 leading-[14px]">
                                    Explore billets now — no action required yet.
                                </Text>

                                {/* <TouchableOpacity
                                    onPress={() => router.push('/(career)/discovery' as any)}
                                    className="bg-blue-50 dark:bg-[#1A4E8A] px-3 py-2 rounded-xl border border-blue-900/10 dark:border-[#5B8FCF] ml-3"
                                >
                                    <CTAText color="text-[#1A4E8A] dark:text-white">Start{`\n`}Exploring</CTAText>
                                </TouchableOpacity> */}
                            </View>
                        </View>
                    </GlassView>
                </TouchableOpacity>
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
                className={`border border-black/5 dark:border-white/10 pl-4 pr-3 py-4 rounded-[24px] overflow-hidden flex-col shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/50`}
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
        <Text className={`text-[10px] font-semibold ${color} uppercase tracking-wider`}>
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
