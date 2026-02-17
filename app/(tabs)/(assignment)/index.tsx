import DiscoveryEntryWidget from '@/components/assignment/DiscoveryEntryWidget';
import SlateSummaryWidget from '@/components/assignment/SlateSummaryWidget';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import type { DiscoveryBadgeCategory } from '@/components/dashboard/DiscoveryCard';
import { DiscoveryStatusCard } from '@/components/dashboard/DiscoveryCard';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDemoStore } from '@/store/useDemoStore';
import { AssignmentPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Anchor,
    BookOpen,
    Compass,
    FileSearch,
    Hourglass,
    Layers,
    Rocket,
} from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

// ── Phase Content Configuration ──────────────────────────────────────────────

interface PhaseContent {
    icon: React.ReactNode;
    hero: string;
    explainer: string;
    accentColors: {
        gradient: string[];
        border: string;
        iconBg: string;
        text: string;
        ctaLabel: string;
        ctaRoute: string;
        ctaBg: string;
    };
}

function getPhaseContent(
    phase: AssignmentPhase | null,
    isDark: boolean,
): PhaseContent {
    switch (phase) {
        case 'ON_RAMP':
            return {
                icon: <Rocket size={28} color={isDark ? '#fbbf24' : '#d97706'} />,
                hero: 'Your Window Opens Soon',
                explainer: 'The MNA cycle is approaching. Browse billets to learn about different jobs, homeports, and duty types. You\'ll build your ranked preference list once the cycle opens.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(251,191,36,0.10)', 'rgba(251,191,36,0.02)']
                        : ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.04)'],
                    border: 'border-amber-500 dark:border-amber-400',
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-900 dark:text-amber-100',
                    ctaLabel: 'Explore Billets',
                    ctaRoute: '/(career)/discovery',
                    ctaBg: 'bg-amber-600 dark:bg-amber-700',
                },
            };

        case 'NEGOTIATION':
            return {
                icon: <Layers size={28} color={isDark ? '#f97316' : '#ea580c'} />,
                hero: 'Build Your Slate',
                explainer: 'You have 3 cycles over the next 6 months to submit your ranked preferences. Billets you\'ve bookmarked are ready to promote.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(249,115,22,0.10)', 'rgba(249,115,22,0.02)']
                        : ['rgba(249,115,22,0.14)', 'rgba(249,115,22,0.04)'],
                    border: 'border-orange-500 dark:border-orange-400',
                    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-900 dark:text-orange-100',
                    ctaLabel: 'View Slate',
                    ctaRoute: '/(assignment)/cycle',
                    ctaBg: 'bg-orange-600 dark:bg-orange-700',
                },
            };

        case 'SELECTION':
            return {
                icon: <Hourglass size={28} color={isDark ? '#a78bfa' : '#7c3aed'} />,
                hero: 'Awaiting Results',
                explainer: 'Your slate has been submitted. Results will be posted after the cycle closes.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(167,139,250,0.10)', 'rgba(167,139,250,0.02)']
                        : ['rgba(167,139,250,0.14)', 'rgba(167,139,250,0.04)'],
                    border: 'border-violet-500 dark:border-violet-400',
                    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
                    text: 'text-violet-900 dark:text-violet-100',
                    ctaLabel: 'View Status',
                    ctaRoute: '/(assignment)/cycle',
                    ctaBg: 'bg-violet-600 dark:bg-violet-700',
                },
            };

        case 'ORDERS_PROCESSING':
            return {
                icon: <FileSearch size={28} color={isDark ? '#fbbf24' : '#d97706'} />,
                hero: 'Orders Being Processed',
                explainer: 'You\'ve been matched. PERS is generating your orders — hang tight.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(251,191,36,0.10)', 'rgba(251,191,36,0.02)']
                        : ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.04)'],
                    border: 'border-amber-500 dark:border-amber-400',
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-900 dark:text-amber-100',
                    ctaLabel: 'Track Progress',
                    ctaRoute: '/(assignment)/cycle',
                    ctaBg: 'bg-amber-600 dark:bg-amber-700',
                },
            };

        case 'ORDERS_RELEASED':
            return {
                icon: <Anchor size={28} color={isDark ? '#4ade80' : '#15803d'} />,
                hero: 'Orders in Hand',
                explainer: 'Your orders have been released. Time to plan your move.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(74,222,128,0.10)', 'rgba(74,222,128,0.02)']
                        : ['rgba(74,222,128,0.14)', 'rgba(74,222,128,0.04)'],
                    border: 'border-green-500 dark:border-green-400',
                    iconBg: 'bg-green-100 dark:bg-green-900/30',
                    text: 'text-green-900 dark:text-green-100',
                    ctaLabel: 'PCS Roadmap',
                    ctaRoute: '/(tabs)/(pcs)/pcs',
                    ctaBg: 'bg-green-600 dark:bg-green-700',
                },
            };

        case 'DISCOVERY':
        default:
            return {
                icon: <Compass size={28} color={isDark ? '#60a5fa' : '#2563eb'} />,
                hero: 'Explore the Market',
                explainer: 'Browse billets to see what\'s out there. Your saves help the Navy understand where sailors want to go.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(96,165,250,0.10)', 'rgba(96,165,250,0.02)']
                        : ['rgba(96,165,250,0.14)', 'rgba(96,165,250,0.04)'],
                    border: 'border-blue-500 dark:border-blue-400',
                    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
                    text: 'text-blue-900 dark:text-blue-100',
                    ctaLabel: 'Start Exploring',
                    ctaRoute: '/(career)/discovery',
                    ctaBg: 'bg-blue-600 dark:bg-blue-700',
                },
            };
    }
}

// ── Component ────────────────────────────────────────────────────────────────

export default function AssignmentDashboard() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const assignmentPhase = useDemoStore(state => state.assignmentPhaseOverride);

    const phase = getPhaseContent(assignmentPhase, isDark);
    const showSlate = assignmentPhase === 'NEGOTIATION';
    const showDiscoveryStats = assignmentPhase === 'DISCOVERY'
        || assignmentPhase === 'ON_RAMP';
    const showDiscoveryEntry = assignmentPhase === 'NEGOTIATION';

    const phaseSubtitle = (() => {
        switch (assignmentPhase) {
            case 'ON_RAMP': return 'On-Ramp Phase';
            case 'NEGOTIATION': return 'Negotiation Phase';
            case 'SELECTION': return 'Selection Phase';
            case 'ORDERS_PROCESSING': return 'Orders Processing';
            case 'ORDERS_RELEASED': return 'Orders Released';
            case 'DISCOVERY':
            default: return 'Discovery Phase';
        }
    })();

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                minTopBarHeight={0}
                topBar={
                    <ScreenHeader
                        title="MY ASSIGNMENT"
                        subtitle={phaseSubtitle}
                        withSafeArea={false}
                    />
                }
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {({
                    onScroll,
                    onScrollBeginDrag,
                    onScrollEndDrag,
                    onLayout,
                    onContentSizeChange,
                    scrollEnabled,
                    scrollEventThrottle,
                    contentContainerStyle,
                }) => (
                    <Animated.ScrollView
                        showsVerticalScrollIndicator={false}
                        scrollEventThrottle={scrollEventThrottle}
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        contentContainerStyle={[
                            contentContainerStyle,
                            { paddingBottom: 40, gap: 20 },
                        ]}
                    >
                        {/* Top spacer — don't use paddingTop here, scaffold owns it */}
                        <View style={{ height: 10 }} />
                        <GlassView
                            intensity={80}
                            tint={isDark ? 'dark' : 'light'}
                            className={`border-l-4 ${phase.accentColors.border} rounded-2xl overflow-hidden shadow-sm`}
                        >
                            <LinearGradient
                                colors={phase.accentColors.gradient as [string, string]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                                style={{ padding: 20 }}
                            >
                                {/* Icon + Title */}
                                <View className="flex-row items-center gap-3 mb-3">
                                    <View className={`${phase.accentColors.iconBg} p-3 rounded-full`}>
                                        {phase.icon}
                                    </View>
                                    <Text className={`${phase.accentColors.text} text-xl font-black leading-tight flex-1`}>
                                        {phase.hero}
                                    </Text>
                                </View>

                                {/* Explainer */}
                                <Text className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                    {phase.explainer}
                                </Text>

                                {/* CTA */}
                                <TouchableOpacity
                                    onPress={() => router.push(phase.accentColors.ctaRoute as any)}
                                    className={`${phase.accentColors.ctaBg} py-3.5 px-6 rounded-xl self-start`}
                                    style={{ minHeight: 44 }}
                                >
                                    <Text className="text-white font-bold text-sm tracking-wide">
                                        {phase.accentColors.ctaLabel}
                                    </Text>
                                </TouchableOpacity>
                            </LinearGradient>
                        </GlassView>

                        {/* ── Phase-Gated Widgets ─────────────────────────────── */}
                        {showSlate && (
                            <SlateSummaryWidget
                                onPress={() => router.push('/(assignment)/cycle' as any)}
                            />
                        )}

                        {showDiscoveryStats && (
                            <DiscoveryStatusCard
                                onStartExploring={() => router.push('/(career)/discovery' as any)}
                                onBadgeTap={(category: DiscoveryBadgeCategory, count: number) => {
                                    if (count === 0) return;
                                    router.push({ pathname: '/(career)/discovery', params: { filter: category } } as any);
                                }}
                            />
                        )}

                        {showDiscoveryEntry && (
                            <DiscoveryEntryWidget
                                onPress={() => router.push('/(career)/discovery' as any)}
                            />
                        )}

                        {/* ── What Happens Next (contextual footer) ──────────── */}
                        <PhaseNextSteps phase={assignmentPhase} isDark={isDark} />
                    </Animated.ScrollView>
                )}
            </CollapsibleScaffold>

            {/* Floating dev panel — outside CollapsibleScaffold */}
            <PCSDevPanel />
        </ScreenGradient>
    );
}

// ── "What Happens Next" Section ──────────────────────────────────────────────

function PhaseNextSteps({
    phase,
    isDark,
}: {
    phase: AssignmentPhase | null;
    isDark: boolean;
}) {
    const steps = getNextSteps(phase);
    if (steps.length === 0) return null;

    return (
        <View className="mt-2 mb-4 px-1">
            <View className="flex-row items-center gap-2 mb-3">
                <BookOpen size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    What Happens Next
                </Text>
            </View>
            {steps.map((step, i) => (
                <View key={i} className="flex-row items-start gap-3 mb-2.5">
                    <Text className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-0.5">
                        {i + 1}.
                    </Text>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed flex-1">
                        {step}
                    </Text>
                </View>
            ))}
        </View>
    );
}

function getNextSteps(phase: AssignmentPhase | null): string[] {
    switch (phase) {
        case 'DISCOVERY':
            return [
                'Browse and bookmark billets that interest you.',
                'Your saves help CNPC understand where sailors want to go.',
                'When the MNA cycle opens, you\'ll be ready to build your preference list.',
            ];
        case 'ON_RAMP':
            return [
                'Explore billets to learn about available jobs and homeports.',
                'Once the cycle opens, promote your bookmarks into a ranked slate.',
                'You\'ll have 3 cycles over 6 months to be matched.',
            ];
        case 'NEGOTIATION':
            return [
                'Rank your preferred billets on your slate.',
                'Detailers review slates and make assignments after each cycle.',
                'If unmatched after 3 cycles, you may be direct-detailed.',
            ];
        case 'SELECTION':
            return [
                'Cycle results are being finalized.',
                'You\'ll be notified once your assignment is confirmed.',
            ];
        case 'ORDERS_PROCESSING':
            return [
                'PERS is generating your official orders.',
                'Once released, your PCS roadmap will activate.',
            ];
        case 'ORDERS_RELEASED':
            return [
                'Review your orders and report-by date.',
                'Head to the PCS Roadmap to begin planning your move.',
            ];
        default:
            return [
                'Browse and bookmark billets that interest you.',
                'Your saves help CNPC understand where sailors want to go.',
            ];
    }
}
