import DetailerContactWidget from '@/components/assignment/DetailerContactWidget';
import MNAProcessWidget from '@/components/assignment/MNAProcessWidget';
import ReadinessWidget from '@/components/assignment/ReadinessWidget';
import SelectionChecklistWidget from '@/components/assignment/SelectionChecklistWidget';
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
import { usePCSStore } from '@/store/usePCSStore';
import { AssignmentPhase, OrdersPipelineStatus } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    AlertTriangle,
    Anchor,
    BookOpen,
    CheckCircle2,
    Compass,
    FileSearch,
    Layers,
    Rocket,
    ShieldCheck,
    Star
} from 'lucide-react-native';
import React, { useCallback, useRef } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';

// ── Pipeline Step Config ─────────────────────────────────────────────────────

const PIPELINE_STEPS: { key: OrdersPipelineStatus; label: string; short: string; context: string }[] = [
    { key: 'MATCH_ANNOUNCED', label: 'Match Announced', short: 'Matched', context: 'Your match has been announced.' },
    { key: 'CO_ENDORSEMENT', label: 'CO Endorsement', short: 'CO', context: 'Your current command is reviewing your transfer.' },
    { key: 'PERS_PROCESSING', label: 'PERS Processing', short: 'PERS', context: 'Detailers are finalizing your assignment details.' },
    { key: 'ORDERS_DRAFTING', label: 'Orders Drafting', short: 'Drafting', context: 'Your official orders are currently being written.' },
    { key: 'ORDERS_RELEASED', label: 'Orders Released', short: 'Released', context: 'Your orders have been officially released.' },
];

function getStepIndex(status: OrdersPipelineStatus): number {
    return PIPELINE_STEPS.findIndex(s => s.key === status);
}

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
        ctaRoute: any;
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
                    ctaRoute: { pathname: '/(career)/discovery', params: { returnPath: '/(tabs)/(assignment)' } },
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

        case 'ORDERS_PROCESSING': {
            const procSel = useDemoStore.getState().selectionDetails;
            const activeIndex = procSel ? getStepIndex(procSel.pipelineStatus) : -1;
            const activeStepInfo = activeIndex >= 0 ? PIPELINE_STEPS[activeIndex] : null;

            return {
                icon: <FileSearch size={28} color={isDark ? '#fbbf24' : '#d97706'} />,
                hero: 'Routing Orders',
                explainer: activeStepInfo
                    ? activeStepInfo.context
                    : 'Your orders are processing normally through the pipeline. No action is required from you at this time.',
                accentColors: {
                    gradient: isDark
                        ? ['rgba(251,191,36,0.10)', 'rgba(251,191,36,0.02)']
                        : ['rgba(251,191,36,0.14)', 'rgba(251,191,36,0.04)'],
                    border: 'border-amber-500 dark:border-amber-400',
                    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
                    text: 'text-amber-900 dark:text-amber-100',
                    ctaLabel: '', // No CTA needed, pipeline is inline
                    ctaRoute: '',
                    ctaBg: '',
                },
            };
        }

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
                    ctaRoute: { pathname: '/(career)/discovery', params: { returnPath: '/(tabs)/(assignment)' } },
                    ctaBg: 'bg-blue-600 dark:bg-blue-700',
                },
            };
    }
}

// ── Component ────────────────────────────────────────────────────────────────

const SLOT_INDICES = Array.from({ length: MAX_SLATE_SIZE }, (_, i) => i);

export default function AssignmentDashboard() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const scrollRef = useRef<any>(null);

    // Scroll to top whenever this tab gains focus
    useFocusEffect(
        useCallback(() => {
            scrollRef.current?.scrollTo?.({ y: 0, animated: false });
        }, [])
    );
    const assignmentPhase = useDemoStore(state => state.assignmentPhaseOverride);
    const negotiationDetails = useDemoStore(state => state.negotiationDetails);
    const selectionDetails = useDemoStore(state => state.selectionDetails);

    // OBLISERV state
    const obliserv = usePCSStore(state => state.financials.obliserv);
    const obliservBlocked = obliserv.required && obliserv.status !== 'COMPLETE';

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
    const isProcessing = assignmentPhase === 'ORDERS_PROCESSING';

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
    const showDetailer = isNegotiation;
    const showDiscoveryStats = assignmentPhase === 'DISCOVERY'
        || assignmentPhase === 'ON_RAMP'
        || assignmentPhase === 'ORDERS_RELEASED'
        || isNegotiation;
    const showSelectionDetail = assignmentPhase === 'SELECTION' || assignmentPhase === 'ORDERS_PROCESSING';
    const isOnRamp = assignmentPhase === 'ON_RAMP';

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
                        ref={scrollRef}
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
                        <View style={{ height: 8 }} />
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

                                {/* ── Selection: OBLISERV Gate ── */}
                                {assignmentPhase === 'SELECTION' && obliservBlocked ? (
                                    <View className="bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 border border-red-200 dark:border-red-800/40">
                                        <View className="flex-row items-center gap-2 mb-1.5">
                                            <AlertTriangle size={14} color={isDark ? '#fca5a5' : '#dc2626'} />
                                            <Text className="text-red-800 dark:text-red-200 text-xs font-black uppercase tracking-wider">
                                                Action Required
                                            </Text>
                                        </View>
                                        <Text className="text-red-700 dark:text-red-300 text-xs leading-relaxed mb-4">
                                            Your service obligation doesn't cover this assignment. Extend or reenlist before orders can be processed.
                                        </Text>
                                        <TouchableOpacity
                                            onPress={() => router.push('/pcs-wizard/obliserv-check' as any)}
                                            className="bg-red-600 dark:bg-red-700 py-2.5 px-4 rounded-lg self-start"
                                        >
                                            <Text className="text-white text-xs font-bold">Extend to Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : assignmentPhase === 'SELECTION' && obliserv.required ? (
                                    <View className="flex-row items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2.5 border border-green-100 dark:border-green-800/30">
                                        <ShieldCheck size={14} color={isDark ? '#4ade80' : '#16a34a'} />
                                        <Text className="text-green-800 dark:text-green-300 text-xs font-bold">
                                            Service Obligation Met — orders can proceed
                                        </Text>
                                    </View>
                                ) : null}

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

                                {/* ── Orders Processing: Inline Pipeline Tracker ── */}
                                {isProcessing && selectionDetails && (
                                    <View className="mb-4 mt-2">
                                        <Text className="text-xs font-bold text-amber-700/70 dark:text-amber-400/70 uppercase tracking-wider mb-4">
                                            Orders Pipeline
                                        </Text>
                                        <View className="flex-row items-center mb-5">
                                            {PIPELINE_STEPS.map((step, i) => {
                                                const activeIndex = getStepIndex(selectionDetails.pipelineStatus);
                                                const isComplete = i < activeIndex;
                                                const isActive = i === activeIndex;

                                                return (
                                                    <React.Fragment key={step.key}>
                                                        {/* Step dot + label */}
                                                        <View className="items-center flex-1">
                                                            <View
                                                                className={`w-7 h-7 rounded-full items-center justify-center border-2 ${isComplete
                                                                    ? 'bg-amber-500 border-amber-500 dark:bg-amber-600 dark:border-amber-600'
                                                                    : isActive
                                                                        ? 'bg-white border-amber-500 dark:bg-slate-800 dark:border-amber-500'
                                                                        : 'bg-slate-100 border-slate-200 dark:bg-slate-800/50 dark:border-slate-700'
                                                                    }`}
                                                            >
                                                                {isComplete ? (
                                                                    <CheckCircle2 size={14} color="#FFFFFF" />
                                                                ) : (
                                                                    <Text className={`text-[10px] font-black ${isActive
                                                                        ? 'text-amber-600 dark:text-amber-400'
                                                                        : 'text-slate-400 dark:text-slate-500'
                                                                        }`}>
                                                                        {i + 1}
                                                                    </Text>
                                                                )}
                                                            </View>
                                                            <Text
                                                                className={`text-[9px] font-bold mt-1.5 text-center ${isActive
                                                                    ? 'text-amber-800 dark:text-amber-300'
                                                                    : isComplete
                                                                        ? 'text-amber-700/70 dark:text-amber-400/70'
                                                                        : 'text-slate-400 dark:text-slate-500'
                                                                    }`}
                                                                numberOfLines={1}
                                                            >
                                                                {step.short}
                                                            </Text>
                                                        </View>
                                                        {/* Connector line */}
                                                        {i < PIPELINE_STEPS.length - 1 && (
                                                            <View
                                                                className={`h-[2px] flex-1 -mx-2 mt-[-16px] ${isComplete
                                                                    ? 'bg-amber-400 dark:bg-amber-600'
                                                                    : 'bg-amber-200/50 dark:bg-slate-700'
                                                                    }`}
                                                            />
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </View>

                                        {/* Timeline Estimate */}
                                        {selectionDetails.estimatedOrdersDate && (
                                            <View className="bg-white/60 dark:bg-black/20 rounded-xl px-4 py-3 border border-amber-200 dark:border-amber-800/30">
                                                <Text className="text-amber-900 dark:text-amber-100 text-xs font-semibold leading-relaxed">
                                                    Orders typically release 4–6 weeks after selection.{' '}
                                                    <Text className="font-black">
                                                        Est. {new Date(selectionDetails.estimatedOrdersDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                    </Text>
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                )}

                                {/* CTA — hidden for SELECTION, PROCESSING and NEGOTIATION (inline above) */}
                                {assignmentPhase !== 'SELECTION' && !isNegotiation && !isProcessing && (
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

                        {/* On-Ramp Coaching Widgets */}
                        {isOnRamp && <MNAProcessWidget />}

                        {showDiscoveryStats && (
                            <DiscoveryStatusCard
                                onStartExploring={() => router.push({ pathname: '/(career)/discovery', params: { returnPath: '/(tabs)/(assignment)' } } as any)}
                                onBadgeTap={(category: DiscoveryBadgeCategory, count: number) => {
                                    if (count === 0) return;
                                    router.push({ pathname: '/(career)/discovery', params: { filter: category, returnPath: '/(tabs)/(assignment)' } } as any);
                                }}
                            />
                        )}

                        {isOnRamp && <ReadinessWidget />}

                        {showDetailer && (
                            <DetailerContactWidget />
                        )}


                        {showSelectionDetail && (
                            <SelectionDetailWidget />
                        )}

                        {/* Interactive Verification Widget for Selection & Processing phases */}
                        {(assignmentPhase === 'SELECTION' || assignmentPhase === 'ORDERS_PROCESSING') && (
                            <SelectionChecklistWidget />
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
        case 'ORDERS_PROCESSING':
            return []; // Plain text replaced by the interactive SelectionChecklistWidget
        case 'ORDERS_RELEASED':
            return [
                'Review your orders and report-by date.',
                'Head to the PCS Roadmap to begin planning your move.',
                'Start exploring billets for your next tour—bookmark jobs to build your smart bench early.',
            ];
        default:
            return [
                'Browse and bookmark billets that interest you.',
                'Your saves help CNPC understand where sailors want to go.',
            ];
    }
}
