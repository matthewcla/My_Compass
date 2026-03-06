import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { usePCSPhase, usePCSStore, useSubPhase } from '@/store/usePCSStore';
import { useUserDependents } from '@/store/useUserStore';
import { AssignmentPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Anchor, Calendar, ChevronRight, FileCheck, Package, Plane, Star, Timer, Users } from 'lucide-react-native';
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

    // Canonical data from PCS Store
    const activeOrder = usePCSStore((state) => state.activeOrder);
    const obliserv = usePCSStore((state) => state.financials.obliserv);
    const checklist = usePCSStore((state) => state.checklist);
    const financials = usePCSStore((state) => state.financials);
    const pcsPhase = usePCSPhase();
    const pcsSubPhase = useSubPhase();

    // Assignment Store
    const applications = useAssignmentStore((s) => s.applications);
    const userApplicationIds = useAssignmentStore((s) => s.userApplicationIds);
    const realDecisions = useAssignmentStore((s) => s.realDecisions);
    const currentProfile = useCurrentProfile();
    const dependentCount = useUserDependents() ?? 0;

    const variant = deriveVariant(assignmentPhase, pcsPhase, pcsSubPhase);

    // Days on station (welcome-aboard only)
    const daysOnStation = useMemo(() => {
        if (isDemoMode && demoTimeline && demoTimeline.daysOnStation > 0) return demoTimeline.daysOnStation;
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
        if (isDemoMode && demoTimeline && demoTimeline.daysToReport > 0) return demoTimeline.daysToReport;
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
        // ── Phase 4: Welcome Aboard ────────────────────────────────
        case 'welcome-aboard': {
            const phase4Items = checklist.filter(i => i.uctPhase === 4);
            const completedPhase4 = phase4Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase4 = phase4Items.length;
            const nextAction = checklist.find(i => i.uctPhase === 4 && i.status === 'NOT_STARTED');
            const targetRoute = nextAction?.actionRoute || '/(tabs)/(pcs)/pcs';

            return (
                <TouchableOpacity onPress={() => router.push(targetRoute as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(22,163,74,0.15)', 'transparent'] : ['rgba(22,163,74,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-green-100 dark:bg-green-900/60" border="border-green-200 dark:border-green-800">
                                        <Anchor size={26} color={isDark ? '#4ade80' : '#16A34A'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-green-900 dark:text-green-100">Welcome Aboard</Headline>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase 2: Plan Move (Orders & Logistics) ─────────────────────
        case 'plan-move': {
            const planItems = checklist.filter(i => i.uctPhase === 1 || i.uctPhase === 2);
            const completedPlanItems = planItems.filter(i => i.status === 'COMPLETE').length;
            const totalPlanItems = planItems.length;
            const nextAction = checklist.find(i => (i.uctPhase === 1 || i.uctPhase === 2) && i.status === 'NOT_STARTED');
            const targetRoute = nextAction?.actionRoute || '/(tabs)/(pcs)/pcs';

            const urgencyColor = daysToReport !== null
                ? daysToReport < 30
                    ? { num: 'text-red-600 dark:text-red-400', label: 'text-red-500 dark:text-red-400', gradDark: ['rgba(239,68,68,0.1)', 'transparent'] as const, gradLight: ['rgba(239,68,68,0.05)', 'transparent'] as const }
                    : daysToReport <= 60
                        ? { num: 'text-orange-600 dark:text-orange-400', label: 'text-orange-500 dark:text-orange-400', gradDark: ['rgba(249,115,22,0.1)', 'transparent'] as const, gradLight: ['rgba(249,115,22,0.05)', 'transparent'] as const }
                        : { num: 'text-slate-900 dark:text-white', label: 'text-[#1A4E8A] dark:text-[#5B8FCF]', gradDark: ['rgba(26,78,138,0.1)', 'transparent'] as const, gradLight: ['rgba(26,78,138,0.05)', 'transparent'] as const }
                : { num: 'text-slate-900 dark:text-white', label: 'text-[#1A4E8A] dark:text-[#5B8FCF]', gradDark: ['rgba(26,78,138,0.1)', 'transparent'] as const, gradLight: ['rgba(26,78,138,0.05)', 'transparent'] as const };

            return (
                <TouchableOpacity onPress={() => router.push(targetRoute as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? urgencyColor.gradDark : urgencyColor.gradLight}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-[#E4EAF4] dark:bg-[#1A4E8A]/50" border="border-[#1A4E8A]/10 dark:border-[#5B8FCF]/30">
                                        <Package size={26} color={isDark ? '#5B8FCF' : '#1A4E8A'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-slate-900 dark:text-slate-100">Plan Your Move</Headline>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase 3: En Route ──────────────────
        case 'en-route': {
            const phase3Items = checklist.filter(i => i.uctPhase === 3);
            const completedPhase3 = phase3Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase3 = phase3Items.length;
            const enNextAction = checklist.find(i => i.uctPhase === 3 && i.status === 'NOT_STARTED');
            const targetRoute = enNextAction?.actionRoute || '/(tabs)/(pcs)/pcs';

            return (
                <TouchableOpacity onPress={() => router.push(targetRoute as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-blue-100 dark:bg-blue-900/60" border="border-blue-200 dark:border-blue-800">
                                        <Plane size={26} color={isDark ? '#60A5FA' : '#2563EB'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-slate-900 dark:text-slate-100">En Route</Headline>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase 1: Orders Received ──────────────────────────
        case 'orders-received': {
            const phase1Items = checklist.filter(i => i.uctPhase === 1);
            const completedPhase1 = phase1Items.filter(i => i.status === 'COMPLETE').length;
            const totalPhase1 = phase1Items.length;
            const ordNextAction = checklist.find(i => i.uctPhase === 1 && i.status === 'NOT_STARTED');
            const targetRoute = ordNextAction?.actionRoute || '/(tabs)/(pcs)/pcs';

            return (
                <TouchableOpacity onPress={() => router.push(targetRoute as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(245,158,11,0.15)', 'transparent'] : ['rgba(245,158,11,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/60" border="border-amber-200 dark:border-amber-700/50">
                                        <FileCheck size={26} color={isDark ? '#fbbf24' : '#d97706'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-amber-900 dark:text-amber-100">Orders Received</Headline>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase: Orders Processing ───────────────────────────────────────
        case 'processing': {
            const procEstDate = useDemoStore.getState().selectionDetails?.estimatedOrdersDate;

            return (
                <TouchableOpacity onPress={() => router.push('/(tabs)/(assignment)' as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(168,162,158,0.1)', 'transparent'] : ['rgba(168,162,158,0.05)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-stone-100 dark:bg-stone-800/60" border="border-stone-200 dark:border-stone-700">
                                        <FileCheck size={26} color={isDark ? '#a8a29e' : '#57534e'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline>Orders Processing</Headline>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase: Selected ────────────────────
        case 'selected': {

            return (
                <TouchableOpacity onPress={() => router.push('/(tabs)/(assignment)' as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <View className="px-5 py-5">
                            <View className="flex-row items-center gap-4">
                                <View className="w-[52px] h-[52px] rounded-full overflow-hidden items-center justify-center border-[1.5px] border-black/5 dark:border-white/10 shadow-inner">
                                    <LinearGradient colors={['#3AAE6C', '#1B6A3B']} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
                                    <Star size={26} color="#FFFFFF" fill="#FFFFFF" />
                                </View>
                                <View className="flex-1">
                                        <Headline color="text-green-900 dark:text-white">Selection Confirmed</Headline>
                                    </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase: MNA Negotiation ─────────────────────────────────────────
        case 'negotiation': {
            return (
                <TouchableOpacity onPress={() => router.push('/(career)/cycle' as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(245,158,11,0.15)', 'transparent'] : ['rgba(245,158,11,0.08)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/60" border="border-amber-200 dark:border-amber-700/50">
                                        <Users size={26} color={isDark ? '#fbbf24' : '#d97706'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-amber-900 dark:text-amber-100">MNA Negotiation</Headline>
                                        <Detail>Submit your ranked slate</Detail>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase: Cycle Open (On-Ramp) ────────────────────────────────────
        case 'cycle-open': {
            const prdLabel = currentProfile?.prd ? new Date(currentProfile.prd).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : null;
            const reviewed = Object.keys(realDecisions).length;
            const hasPrepped = reviewed > 0;

            return (
                <TouchableOpacity onPress={() => router.push(hasPrepped ? '/(career)/discovery' as any : '/(tabs)/(profile)/preferences' as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(245,158,11,0.1)', 'transparent'] : ['rgba(245,158,11,0.05)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/40" border="border-amber-200 dark:border-amber-800">
                                        <Timer size={26} color={isDark ? '#C8921C' : '#B07500'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-amber-900 dark:text-amber-100">Cycle {nextCycle}</Headline>
                                        {prdLabel && <Detail>PRD {prdLabel}</Detail>}
                                    </View>
                                </View>
                                <View className="flex-row items-baseline gap-1">
                                    <Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">{daysUntilOpen}</Text>
                                    <Text className="text-amber-700 dark:text-amber-400 text-[11px] font-bold uppercase tracking-wider">Days</Text>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }

        // ── Phase: Cycle Prep (Discovery / Default) ────────────────────────
        case 'cycle-prep':
        default: {
            const prdDate = currentProfile?.prd ? new Date(currentProfile.prd) : null;
            const monthsToPrd = prdDate ? Math.max(0, Math.round((prdDate.getTime() - Date.now()) / (30.44 * 86400000))) : 19;
            const monthsToMna = Math.max(0, monthsToPrd - 12);

            return (
                <TouchableOpacity onPress={() => router.push('/(career)/discovery' as any)} className="flex flex-col gap-2">
                    <CardShell>
                        <LinearGradient
                            colors={isDark ? ['rgba(59,130,246,0.1)', 'transparent'] : ['rgba(59,130,246,0.05)', 'transparent']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                        />
                        <View className="px-5 py-5">
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-blue-100 dark:bg-blue-900/40" border="border-blue-200 dark:border-blue-800/60">
                                        <Calendar size={26} color={isDark ? '#60A5FA' : '#1D4ED8'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline color="text-blue-900 dark:text-blue-100">MNA Cycle</Headline>
                                        <Detail>Your PRD is in ~{monthsToPrd} months</Detail>
                                    </View>
                                </View>
                                <View className="flex-row items-baseline gap-1">
                                    <Text className="text-blue-950 dark:text-white text-3xl font-black font-mono tracking-tighter">~{monthsToMna}</Text>
                                    <Text className="text-blue-700 dark:text-blue-400 text-[11px] font-bold uppercase tracking-wider">Months</Text>
                                </View>
                            </View>
                        </View>
                    </CardShell>
                </TouchableOpacity>
            );
        }
    }
}

// ── Shared Primitives ────────────────────────────────────────────────────────

function CardShell({ children }: { children: React.ReactNode }) {
    const isDark = useColorScheme() === 'dark';
    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
        >
            {children}
        </GlassView>
    );
}

function IconBubble({ bg, border, children }: { bg: string; border?: string; children: React.ReactNode }) {
    return (
        <View className={`${bg} w-[52px] h-[52px] rounded-full items-center justify-center border-[1.5px] shadow-sm ${border || 'border-transparent'}`}>
            {children}
        </View>
    );
}

function Headline({ children, color }: { children: React.ReactNode; color?: string }) {
    return (
        <Text className={`${color || 'text-slate-900 dark:text-slate-100'} text-[22px] font-[800] tracking-[-0.5px] leading-tight mb-0.5`}>
            {children}
        </Text>
    );
}

function Detail({ children }: { children: React.ReactNode }) {
    return (
        <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>
            {children}
        </Text>
    );
}

function Pill({ bg, border, children }: { bg: string; border: string; children: React.ReactNode }) {
    return (
        <View className={`${bg} px-3 py-1.5 rounded-full border-[1.5px] ${border}`}>
            {children}
        </View>
    );
}

function PillText({ color, children }: { color: string; children: React.ReactNode }) {
    return (
        <Text className={`text-[11px] font-[700] ${color} uppercase tracking-[0.5px]`}>
            {children}
        </Text>
    );
}
