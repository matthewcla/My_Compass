import DetailerContactWidget from '@/components/assignment/DetailerContactWidget';
import SelectionDetailWidget from '@/components/assignment/SelectionDetailWidget';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import type { DiscoveryBadgeCategory } from '@/components/dashboard/DiscoveryCard';
import { DiscoveryStatusCard } from '@/components/dashboard/DiscoveryCard';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { MAX_SLATE_SIZE, useAssignmentStore } from '@/store/useAssignmentStore';
import { useDemoStore } from '@/store/useDemoStore';
import { AssignmentPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import {
    Anchor,
    BookOpen,
    Compass,
    FileSearch,
    Layers,
    Rocket,
    Search,
    Star,
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
                explainer: '', // Dynamic — set in component body
                accentColors: {
                    gradient: isDark
                        ? ['rgba(249,115,22,0.10)', 'rgba(249,115,22,0.02)']
                        : ['rgba(249,115,22,0.14)', 'rgba(249,115,22,0.04)'],
                    border: 'border-orange-500 dark:border-orange-400',
                    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
                    text: 'text-orange-900 dark:text-orange-100',
                    ctaLabel: 'Manage Slate',
                    ctaRoute: '/(assignment)/cycle',
                    ctaBg: 'bg-orange-600 dark:bg-orange-700',
                },
            };

        case 'SELECTION':
            return {
                icon: <Star size={28} color={isDark ? '#fbbf24' : '#d97706'} />,
                hero: 'You\'ve Been Selected!',
                explainer: 'Congratulations — you\'re heading to your next command. Track your orders progress below.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(251,191,36,0.10)', 'rgba(251,191,36,0.02)']
                        : ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.04)'],
                    border: 'border-amber-500 dark:border-amber-400',
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-900 dark:text-amber-100',
                    ctaLabel: 'Track Pipeline',
                    ctaRoute: '/(assignment)/cycle',
                    ctaBg: 'bg-amber-600 dark:bg-amber-700',
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
    const negotiationDetails = useDemoStore(state => state.negotiationDetails);

    // Slate state for dynamic content during Negotiation
    const applications = useAssignmentStore(s => s.applications);
    const userApplicationIds = useAssignmentStore(s => s.userApplicationIds);
    const slateDeadline = useAssignmentStore(s => s.slateDeadline);
    const submitSlate = useAssignmentStore(s => s.submitSlate);
    const slateCount = userApplicationIds.length;
    let draftCount = 0;
    let submittedCount = 0;
    Object.values(applications).forEach(app => {
        if (app.status === 'draft') draftCount++;
        else if (['submitted', 'confirmed'].includes(app.status)) submittedCount++;
    });
    const slateSubmitted = slateCount > 0 && draftCount === 0 && submittedCount > 0;
    const slateEmpty = slateCount === 0;
    const canSubmit = draftCount > 0 && submittedCount === 0;

    // Time remaining for slate deadline
    const deadlineMs = new Date(slateDeadline).getTime() - Date.now();
    const daysRemaining = Math.ceil(deadlineMs / (1000 * 60 * 60 * 24));
    const hoursRemaining = Math.ceil(deadlineMs / (1000 * 60 * 60));
    const isUrgent = deadlineMs > 0 && hoursRemaining < 48;
    const timeLabel = deadlineMs <= 0 ? 'Closed' : hoursRemaining < 48 ? `${hoursRemaining}h Left` : `${daysRemaining}d Left`;

    const phase = getPhaseContent(assignmentPhase, isDark);
    const isNegotiation = assignmentPhase === 'NEGOTIATION';

    // Dynamic explainer for Negotiation
    const closeDate = negotiationDetails?.windowCloseDate
        ? new Date(negotiationDetails.windowCloseDate).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
        })
        : null;
    const negotiationExplainer = isNegotiation
        ? slateSubmitted
            ? `✅ Slate submitted with ${submittedCount} of ${MAX_SLATE_SIZE} billets.${closeDate ? ` Window closes ${closeDate}.` : ''}`
            : slateEmpty
                ? `⚠️ Your slate is empty. Start by exploring billets and building your ranked list.${closeDate ? ` Window closes ${closeDate}.` : ''}`
                : `⚠️ ${slateCount} of ${MAX_SLATE_SIZE} billets drafted — submit before the window closes.${closeDate ? ` Window closes ${closeDate}.` : ''}`
        : null;

    // Slot indices for the dot visualization
    const SLOT_INDICES = Array.from({ length: MAX_SLATE_SIZE }, (_, i) => i);

    const showDetailer = isNegotiation;
    const showDiscoveryStats = assignmentPhase === 'DISCOVERY'
        || assignmentPhase === 'ON_RAMP';
    const showDiscoveryEntry = isNegotiation;
    const showSelectionDetail = assignmentPhase === 'SELECTION';

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

                                {/* Explainer (dynamic for Negotiation) */}
                                <Text className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                                    {negotiationExplainer ?? phase.explainer}
                                </Text>

                                {/* ── Negotiation: Inline Slate Visualization ── */}
                                {isNegotiation && (
                                    <View className="mb-4">
                                        {/* Slot Dots + Time Pill */}
                                        <View className="flex-row items-center justify-between mb-3">
                                            <View className="flex-row items-center gap-2">
                                                {SLOT_INDICES.map((index) => (
                                                    <View
                                                        key={index}
                                                        className={`w-3.5 h-3.5 rounded-full ${index < slateCount
                                                            ? 'bg-orange-600 dark:bg-orange-400'
                                                            : 'border-2 border-orange-300 dark:border-orange-700'
                                                            }`}
                                                    />
                                                ))}
                                            </View>
                                            {timeLabel !== 'Closed' && (
                                                <View className={`px-2.5 py-1 rounded-full ${isUrgent
                                                    ? 'bg-red-100 dark:bg-red-900/30'
                                                    : 'bg-orange-100/60 dark:bg-orange-900/30'
                                                    }`}>
                                                    <Text className={`text-xs font-bold ${isUrgent
                                                        ? 'text-red-600 dark:text-red-400'
                                                        : 'text-orange-700 dark:text-orange-300'
                                                        }`}>
                                                        {timeLabel}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Status Line */}
                                        <Text className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">
                                            {draftCount} Drafts • {submittedCount} Submitted
                                        </Text>

                                        {/* Submit CTA or Confirmation */}
                                        {canSubmit && (
                                            <TouchableOpacity
                                                onPress={submitSlate}
                                                className="bg-orange-600 dark:bg-orange-700 py-3 rounded-xl"
                                                style={{ minHeight: 44 }}
                                            >
                                                <Text className="text-white text-center font-bold text-sm tracking-wide">
                                                    Submit Slate
                                                </Text>
                                            </TouchableOpacity>
                                        )}
                                        {slateSubmitted && (
                                            <View className="bg-green-50 dark:bg-green-900/20 py-2.5 rounded-xl border border-green-200 dark:border-green-800">
                                                <Text className="text-green-700 dark:text-green-400 text-center text-sm font-semibold">
                                                    ✅ Slate Submitted
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* CTA — hidden for SELECTION and NEGOTIATION (inline above) */}
                                {assignmentPhase !== 'SELECTION' && !isNegotiation && (
                                    <TouchableOpacity
                                        onPress={() => router.push(phase.accentColors.ctaRoute as any)}
                                        className={`${phase.accentColors.ctaBg} py-3.5 px-6 rounded-xl self-start`}
                                        style={{ minHeight: 44 }}
                                    >
                                        <Text className="text-white font-bold text-sm tracking-wide">
                                            {phase.accentColors.ctaLabel}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            </LinearGradient>
                        </GlassView>

                        {/* ── Phase-Gated Widgets ─────────────────────────────── */}

                        {showDiscoveryStats && (
                            <DiscoveryStatusCard
                                onStartExploring={() => router.push('/(career)/discovery' as any)}
                                onBadgeTap={(category: DiscoveryBadgeCategory, count: number) => {
                                    if (count === 0) return;
                                    router.push({ pathname: '/(career)/discovery', params: { filter: category } } as any);
                                }}
                            />
                        )}

                        {showDetailer && (
                            <DetailerContactWidget />
                        )}

                        {showDiscoveryEntry && (
                            <TouchableOpacity
                                onPress={() => router.push('/(career)/discovery' as any)}
                                className="flex-row items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 px-5 py-3.5 rounded-xl border border-indigo-200 dark:border-indigo-800"
                                style={{ minHeight: 44 }}
                            >
                                <View className="flex-row items-center gap-2.5">
                                    <Search size={16} color={isDark ? '#a5b4fc' : '#4f46e5'} />
                                    <Text className="text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                                        Browse More Billets
                                    </Text>
                                </View>
                                <Text className="text-indigo-400 dark:text-indigo-500 text-xs">→</Text>
                            </TouchableOpacity>
                        )}

                        {showSelectionDetail && (
                            <SelectionDetailWidget />
                        )}

                        {/* ── What Happens Next (contextual footer) ──────────── */}
                        <PhaseNextSteps
                            phase={assignmentPhase}
                            isDark={isDark}
                            slateState={slateEmpty ? 'empty' : slateSubmitted ? 'submitted' : 'drafted'}
                            closeDate={closeDate}
                            selectionDate={negotiationDetails?.selectionAnnouncementDate
                                ? new Date(negotiationDetails.selectionAnnouncementDate).toLocaleDateString(undefined, {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                })
                                : null
                            }
                        />
                    </Animated.ScrollView>
                )}
            </CollapsibleScaffold>

            {/* Floating dev panel — outside CollapsibleScaffold */}
            <PCSDevPanel />
        </ScreenGradient>
    );
}

// ── "What Happens Next" Section ──────────────────────────────────────────────

type SlateState = 'empty' | 'drafted' | 'submitted';

function PhaseNextSteps({
    phase,
    isDark,
    slateState = 'empty',
    closeDate = null,
    selectionDate = null,
}: {
    phase: AssignmentPhase | null;
    isDark: boolean;
    slateState?: SlateState;
    closeDate?: string | null;
    selectionDate?: string | null;
}) {
    const steps = getNextSteps(phase, slateState, closeDate, selectionDate);
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

function getNextSteps(
    phase: AssignmentPhase | null,
    slateState: SlateState = 'empty',
    closeDate: string | null = null,
    selectionDate: string | null = null,
): string[] {
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
            if (slateState === 'submitted') {
                return [
                    'Your slate is with detailers for review.',
                    selectionDate
                        ? `Selections expected around ${selectionDate}.`
                        : 'Selections are announced after each cycle closes.',
                    'If unmatched this cycle, your slate carries forward to the next.',
                ];
            } else if (slateState === 'drafted') {
                return [
                    'Review your rankings — order matters to detailers.',
                    closeDate
                        ? `Submit your slate before ${closeDate}.`
                        : 'Submit your slate before the window closes.',
                    'Contact your detailer if you have questions about specific billets.',
                ];
            } else {
                return [
                    'Start by swiping billets in the Explorer to find matches.',
                    'Promote your favorites to build a ranked slate.',
                    closeDate
                        ? `Submit before ${closeDate} to be considered this cycle.`
                        : 'Submit before the window closes to be considered this cycle.',
                ];
            }
        case 'SELECTION':
            return [
                'Research your gaining command\'s location, housing options, and local schools.',
                'If PCSing with dependents, start your EFMP screening early.',
                'Begin gathering documents for your check-out process.',
                'Contact the gaining command\'s sponsor coordinator when orders arrive.',
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
