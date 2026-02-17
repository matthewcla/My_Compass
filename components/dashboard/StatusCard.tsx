import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { usePCSPhase, usePCSStore } from '@/store/usePCSStore';
import { AssignmentPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Anchor, Calendar, FileCheck, Map as MapIcon, Star, Timer } from 'lucide-react-native';
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
    const pcsPhase = usePCSPhase();

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
                </CardShell>
            );
        }

        // ── Orders Processing ───────────────────────────────────────
        case 'processing':
            return (
                <CardShell borderColor="border-amber-400 dark:border-amber-400" isDark={isDark}>
                    <View className="flex-row items-center gap-4 flex-1">
                        <IconBubble bg="bg-amber-100 dark:bg-amber-900/30">
                            <FileCheck size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                        </IconBubble>
                        <View className="flex-1">
                            <Headline>Orders Processing</Headline>
                            <Detail>Awaiting release from PERS</Detail>
                        </View>
                    </View>

                    <Pill bg="bg-amber-100 dark:bg-amber-900/40" border="border-amber-200 dark:border-amber-700/50">
                        <PillText color="text-amber-800 dark:text-amber-200">Pending</PillText>
                    </Pill>
                </CardShell>
            );

        // ── You've Been Selected (Celebratory) ────────────────────
        case 'selected': {
            const selGainingCommand = activeOrder?.gainingCommand.name || 'Awaiting assignment details';
            const selReportNLT = activeOrder?.reportNLT
                ? new Date(activeOrder.reportNLT).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : null;
            const obliserv = usePCSStore.getState().financials.obliserv;
            const obliservBlocked = obliserv.required && obliserv.status !== 'COMPLETE';

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
                                        {selReportNLT && (
                                            <Text className="text-amber-700 dark:text-amber-300 text-[11px] font-semibold mt-0.5">
                                                Report by {selReportNLT}
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
                                    <Pill bg="bg-green-100 dark:bg-green-900/40" border="border-green-200 dark:border-green-700/50">
                                        <PillText color="text-green-800 dark:text-green-200">✓ Obligation Met</PillText>
                                    </Pill>
                                )}
                            </View>
                        </LinearGradient>
                    </GlassView>
                </View>
            );
        }

        // ── MNA Negotiation ─────────────────────────────────────────
        case 'negotiation':
            return (
                <CardShell borderColor="border-amber-500 dark:border-amber-400" isDark={isDark}>
                    <View className="flex-row items-center gap-4 flex-1">
                        <IconBubble bg="bg-amber-100 dark:bg-amber-900/50">
                            <Timer size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                        </IconBubble>
                        <View className="flex-1">
                            <Headline color="text-amber-900 dark:text-amber-100">MNA Negotiation</Headline>
                            <View className="flex-row items-baseline gap-1.5">
                                <Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">
                                    {daysUntilOpen}
                                </Text>
                                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                                    Days Remaining
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(career)/discovery' as any)}
                        className="bg-amber-100 dark:bg-amber-900/60 px-3 py-2 rounded-lg ml-1 border border-amber-200 dark:border-amber-700/50"
                    >
                        <CTAText color="text-amber-800 dark:text-amber-200">View{'\n'}Slate</CTAText>
                    </TouchableOpacity>
                </CardShell>
            );

        // ── Cycle Open (On-Ramp) ────────────────────────────────────
        case 'cycle-open':
            return (
                <CardShell borderColor="border-amber-500 dark:border-amber-400" isDark={isDark}>
                    <View className="flex-row items-center gap-4 flex-1">
                        <IconBubble bg="bg-amber-100 dark:bg-amber-900/50">
                            <Timer size={24} color={isDark ? '#fbbf24' : '#d97706'} />
                        </IconBubble>
                        <View className="flex-1">
                            <Headline color="text-amber-900 dark:text-amber-100">Cycle Opening Soon</Headline>
                            <View className="flex-row items-baseline gap-1.5">
                                <Text className="text-amber-950 dark:text-white text-3xl font-black font-mono tracking-tighter">
                                    {daysUntilOpen}
                                </Text>
                                <Text className="text-amber-700 dark:text-amber-300 text-xs font-bold uppercase tracking-wide">
                                    Days Until Open
                                </Text>
                            </View>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(tabs)/(profile)/preferences')}
                        className="bg-amber-100 dark:bg-amber-900/60 px-3 py-2 rounded-lg ml-1 border border-amber-200 dark:border-amber-700/50"
                    >
                        <CTAText color="text-amber-800 dark:text-amber-200">Update{'\n'}Prefs</CTAText>
                    </TouchableOpacity>
                </CardShell>
            );

        // ── Cycle Prep (Discovery / Default) ────────────────────────
        case 'cycle-prep':
        default:
            return (
                <CardShell borderColor="border-blue-500 dark:border-blue-400" isDark={isDark}>
                    <View className="flex-row items-center gap-4 flex-1">
                        <IconBubble bg="bg-blue-100 dark:bg-blue-900/30">
                            <Calendar size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                        </IconBubble>
                        <View className="flex-1">
                            <Headline color="text-blue-900 dark:text-blue-100">Next Assignment Window</Headline>
                            <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium mt-0.5">
                                Opens in {daysUntilOpen} days — start exploring billets now.
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(career)/discovery' as any)}
                        className="bg-blue-600 dark:bg-blue-700 px-3 py-2 rounded-lg border border-blue-500 dark:border-blue-600 ml-2"
                    >
                        <CTAText>Explore</CTAText>
                    </TouchableOpacity>
                </CardShell>
            );
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
                className={`border-l-4 ${borderColor} pl-4 pr-3 py-4 rounded-xl overflow-hidden flex-row items-center justify-between shadow-sm bg-slate-50 dark:bg-slate-900/50`}
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
