import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { usePCSPhase, usePCSStore } from '@/store/usePCSStore';
import { AssignmentPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Anchor, Calendar, Eye, FileCheck, Heart, Map as MapIcon, Star, Timer, Users } from 'lucide-react-native';
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
    | 'welcome-aboard';

function deriveVariant(
    assignmentPhase: AssignmentPhase | null,
    pcsPhase: string | null,
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
            return pcsPhase === 'CHECK_IN' ? 'welcome-aboard' : 'orders-received';
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
    const pcsPhase = usePCSPhase();

    // Always call — needed for negotiation/on-ramp variants but hooks must be unconditional
    const applications = useAssignmentStore((s) => s.applications);
    const userApplicationIds = useAssignmentStore((s) => s.userApplicationIds);
    const realDecisions = useAssignmentStore((s) => s.realDecisions);
    const currentProfile = useCurrentProfile();

    const variant = deriveVariant(assignmentPhase, pcsPhase);

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

    switch (variant) {
        // ── Welcome Aboard (Phase 4) ────────────────────────────────
        case 'welcome-aboard': {
            const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
            const uniformOfDay = activeOrder?.gainingCommand.uniformOfDay?.trim() || null;

            return (
                <CardShell borderColor="border-green-500 dark:border-green-400" isDark={isDark}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4 flex-1">
                            <IconBubble bg="bg-green-100 dark:bg-green-900/30">
                                <Anchor size={24} color={isDark ? '#4ade80' : '#15803d'} />
                            </IconBubble>
                            <View className="flex-1">
                                <Headline>Welcome Aboard</Headline>
                                <Detail>{gainingCommand}</Detail>
                                {uniformOfDay && (
                                    <Text className="text-green-700 dark:text-green-300 text-[11px] font-semibold mt-1">
                                        👔 {uniformOfDay}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <View className="items-end gap-2.5">
                            <Pill bg="bg-green-100 dark:bg-green-900/40" border="border-green-200 dark:border-green-700/50">
                                <PillText color="text-green-800 dark:text-green-200">Day {daysOnStation}</PillText>
                            </Pill>
                            <TouchableOpacity
                                onPress={() => router.push('/pcs/check-in' as any)}
                                className="bg-green-600 dark:bg-green-700 px-3 py-2 rounded-lg border border-green-500 dark:border-green-600"
                            >
                                <CTAText>Check In</CTAText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </CardShell>
            );
        }

        // ── Orders Received (PCS Phases 1–3) ────────────────────────
        case 'orders-received': {
            const destination = activeOrder?.segments.find(s => s.type === 'DESTINATION');
            const nltDate = destination?.dates.nlt ? new Date(destination.dates.nlt).toLocaleDateString() : 'TBD';
            const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';

            return (
                <CardShell borderColor="border-amber-400 dark:border-amber-400" isDark={isDark}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4 flex-1">
                            <IconBubble bg="bg-amber-100 dark:bg-amber-900/30">
                                <MapIcon size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                            </IconBubble>
                            <View className="flex-1">
                                <Headline>Orders Received</Headline>
                                <Detail>Report to {gainingCommand} by {nltDate}.</Detail>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/(pcs)/pcs')}
                            className="bg-amber-100 dark:bg-amber-900/40 px-3 py-2 rounded-lg ml-1 border border-amber-200 dark:border-amber-700/50"
                        >
                            <CTAText color="text-amber-800 dark:text-amber-200">View{'\n'}Roadmap</CTAText>
                        </TouchableOpacity>
                    </View>
                </CardShell>
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
                <View className="flex flex-col gap-2 my-2">
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
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <IconBubble bg="bg-amber-100 dark:bg-amber-900/30">
                                        <FileCheck size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                                    </IconBubble>
                                    <View className="flex-1">
                                        <Headline>Orders Processing</Headline>
                                        <Detail>{procGainingCommand}</Detail>
                                        {procBilletTitle && (
                                            <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold" numberOfLines={1}>
                                                {procBilletTitle}
                                            </Text>
                                        )}
                                        {procPipelineLabel && (
                                            <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                                                ⏱ {procPipelineLabel}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View className="items-end gap-2">
                                    <Pill bg="bg-amber-100 dark:bg-amber-900/40" border="border-amber-200 dark:border-amber-700/50">
                                        <PillText color="text-amber-800 dark:text-amber-200">
                                            {procEstDate ? `Est. ${procEstDate}` : 'Pending'}
                                        </PillText>
                                    </Pill>
                                    <TouchableOpacity
                                        onPress={() => router.push('/(tabs)/(assignment)' as any)}
                                        className="bg-amber-100 dark:bg-amber-900/40 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700/50"
                                    >
                                        <CTAText color="text-amber-800 dark:text-amber-200">Track{'\n'}Progress</CTAText>
                                    </TouchableOpacity>
                                </View>
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

            // Derive human-readable pipeline label
            const pipelineLabel = (() => {
                switch (selectionDetails?.pipelineStatus) {
                    case 'MATCH_ANNOUNCED': return 'Match Announced';
                    case 'CO_ENDORSEMENT': return 'Awaiting CO Endorsement';
                    case 'PERS_PROCESSING': return 'PERS Processing';
                    case 'ORDERS_DRAFTING': return 'Orders Being Drafted';
                    case 'ORDERS_RELEASED': return 'Orders Released';
                    default: return null;
                }
            })();

            return (
                <View className="flex flex-col gap-2 my-2">
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
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-4 flex-1">
                                    <View className="w-12 h-12 rounded-full overflow-hidden items-center justify-center">
                                        <LinearGradient
                                            colors={['#FDE68A', '#F59E0B']}
                                            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                                        />
                                        <Star size={24} color={isDark ? '#78350F' : '#FFFFFF'} fill={isDark ? '#78350F' : '#FFFFFF'} />
                                    </View>
                                    <View className="flex-1">
                                        <Text className="text-amber-900 dark:text-amber-100 text-lg font-black leading-tight mb-0.5">
                                            You've Been Selected!!!
                                        </Text>
                                        <Detail>{selGainingCommand}</Detail>
                                        {selBilletTitle && (
                                            <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold" numberOfLines={1}>
                                                {selBilletTitle}
                                            </Text>
                                        )}
                                        {selReportNLT && (
                                            <Text className="text-amber-700 dark:text-amber-300 text-[11px] font-semibold mt-0.5">
                                                Report by {selReportNLT}
                                            </Text>
                                        )}
                                        {pipelineLabel && (
                                            <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider mt-1">
                                                ⏱ {pipelineLabel}
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                {obliservBlocked ? (
                                    <TouchableOpacity
                                        onPress={() => router.push('/pcs-wizard/obliserv-check' as any)}
                                        className="bg-red-600 dark:bg-red-700 px-3 py-2.5 rounded-lg border border-red-500 dark:border-red-600 ml-3"
                                    >
                                        <CTAText>Extend{'\n'}to Accept</CTAText>
                                    </TouchableOpacity>
                                ) : (
                                    <View className="items-end gap-2">
                                        <Pill bg="bg-green-100 dark:bg-green-900/40" border="border-green-200 dark:border-green-700/50">
                                            <PillText color="text-green-800 dark:text-green-200">✓ Ready</PillText>
                                        </Pill>
                                        <TouchableOpacity
                                            onPress={() => router.push('/(tabs)/(assignment)' as any)}
                                            className="bg-amber-100 dark:bg-amber-900/40 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700/50"
                                        >
                                            <CTAText color="text-amber-800 dark:text-amber-200">View{'\n'}Details</CTAText>
                                        </TouchableOpacity>
                                    </View>
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
                <CardShell borderColor="border-amber-500 dark:border-amber-400" isDark={isDark}>
                    <View className="flex-row items-start justify-between">
                        <View className="flex-row items-start gap-4 flex-1">
                            <IconBubble bg="bg-amber-100 dark:bg-amber-900/50">
                                <Users size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                            </IconBubble>
                            <View className="flex-1">
                                <Headline color="text-amber-900 dark:text-amber-100">MNA Negotiation</Headline>
                                <View className="flex-row items-baseline gap-1.5">
                                    <Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">
                                        {daysUntilOpen}
                                    </Text>
                                    <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                                        Days to Slate Lock
                                    </Text>
                                </View>

                                {/* Slate Status */}
                                <View className="flex-row items-center gap-1 mt-0.5">
                                    <Text className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                        {allSubmitted
                                            ? `✅ Slate Submitted`
                                            : hasAnyApps
                                                ? `⚠️ ${slateCount} of ${MAX_SLATE_SIZE} drafted`
                                                : `⚠️ No billets on slate`}
                                    </Text>
                                    {allSubmitted && (
                                        <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                            ({submittedCount} of {MAX_SLATE_SIZE})
                                        </Text>
                                    )}
                                </View>

                                {/* Deadline Date */}
                                {closeDate && (
                                    <Text className="text-amber-700 dark:text-amber-300 text-[11px] font-semibold mt-0.5">
                                        Window closes {closeDate}
                                    </Text>
                                )}

                                {/* Detailer Line */}
                                {detailerName && (
                                    <Text
                                        className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mt-1"
                                        numberOfLines={1}
                                    >
                                        ⏳ {detailerName}{detailerOffice ? ` · ${detailerOffice}` : ''}
                                    </Text>
                                )}
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(career)/discovery' as any)}
                            className="bg-amber-100 dark:bg-amber-900/60 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700/50"
                        >
                            <CTAText color="text-amber-800 dark:text-amber-200">My{'\n'}Slate</CTAText>
                        </TouchableOpacity>
                    </View>
                </CardShell>
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
                <CardShell borderColor="border-amber-500 dark:border-amber-400" isDark={isDark}>
                    {/* ── Header: icon + title + PRD ── */}
                    <View className="flex-row items-center gap-2 w-full">
                        <Timer size={16} color={isDark ? '#fbbf24' : '#d97706'} />
                        <Text className="text-amber-900 dark:text-amber-100 text-sm font-extrabold flex-shrink">
                            Cycle {nextCycle} Opening Soon
                        </Text>
                        {prdLabel && (
                            <Text className="text-amber-600 dark:text-amber-400 text-[10px] font-bold ml-auto">
                                PRD {prdLabel}
                            </Text>
                        )}
                    </View>

                    {/* ── Hero: countdown + prep stats ── */}
                    <View className="flex-row items-center mt-3 w-full">
                        <View className="flex-row items-baseline gap-1.5">
                            <Text className="text-amber-950 dark:text-white text-4xl font-black font-mono tracking-tighter">
                                {daysUntilOpen}
                            </Text>
                            <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                                Days
                            </Text>
                        </View>

                        {/* Compact prep stats — right side */}
                        <View className="ml-auto items-end gap-0.5">
                            {hasPrepped ? (
                                <>
                                    <View className="flex-row items-center gap-1">
                                        <Eye size={11} color={isDark ? '#fbbf24' : '#92400e'} />
                                        <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold">
                                            {reviewed} reviewed
                                        </Text>
                                    </View>
                                    <View className="flex-row items-center gap-1">
                                        <Heart size={11} color={isDark ? '#fbbf24' : '#92400e'} />
                                        <Text className="text-amber-800 dark:text-amber-200 text-[11px] font-semibold">
                                            {saved} saved
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <Text className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
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
                            className="bg-amber-100 dark:bg-amber-900/60 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-700/50"
                        >
                            <CTAText color="text-amber-800 dark:text-amber-200">Get Ready</CTAText>
                        </TouchableOpacity>
                    </View>
                </CardShell>
            );
        }

        // ── Cycle Prep (Discovery / Default) ────────────────────────
        // Sailor is >17 months from PRD — calm, exploratory tone.
        // PRD and months-out are mocked; will be driven by profile later.
        case 'cycle-prep':
        default: {
            // TODO: Replace with real PRD from user profile
            const prdLabel = 'Oct 2027';
            const monthsOut = 19;

            return (
                <CardShell borderColor="border-blue-500 dark:border-blue-400" isDark={isDark}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4 flex-1">
                            <IconBubble bg="bg-blue-100 dark:bg-blue-900/30">
                                <Calendar size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                            </IconBubble>
                            <View className="flex-1">
                                <Headline color="text-blue-900 dark:text-blue-100">MNA Cycle Opens</Headline>
                                <Text className="text-slate-700 dark:text-slate-300 text-xs font-bold mt-0.5">
                                    ~{monthsOut} months · PRD {prdLabel}
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium mt-0.5">
                                    Explore billets now — no action required yet.
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push('/(career)/discovery' as any)}
                            className="bg-blue-600 dark:bg-blue-700 px-4 py-3 rounded-lg border border-blue-500 dark:border-blue-600 ml-2"
                            style={{ minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'center' }}
                        >
                            <CTAText>Explore</CTAText>
                        </TouchableOpacity>
                    </View>
                </CardShell>
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
        <View className="flex flex-col gap-2 my-2">
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
