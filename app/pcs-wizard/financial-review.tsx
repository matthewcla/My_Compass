import { ScalePressable } from '@/components/ScalePressable';
import { AdvancePayVisualizer } from '@/components/pcs/financials/AdvancePayVisualizer';
import { MovingCostProjection } from '@/components/pcs/financials/MovingCostProjection';
import { FinancialWizardStatusBar } from '@/components/pcs/wizard/FinancialWizardStatusBar';
import { useCurrentProfile } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    AlertTriangle,
    Banknote,
    CheckCircle,
    ChevronLeft,
    Send,
    Shield,
    Users,
} from 'lucide-react-native';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Switch,
    Text,
    useColorScheme,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────

const TOTAL_STEPS = 2;

const fmt = (n: number) => {
    const abs = Math.abs(n).toFixed(2);
    const [whole, dec] = abs.split('.');
    const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return `$${withCommas}.${dec}`;
};

// ─── Screen ───────────────────────────────────────────────────

export default function FinancialReviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const financials = usePCSStore((s) => s.financials);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);
    const updateFinancials = usePCSStore((s) => s.updateFinancials);
    const checklist = usePCSStore((s) => s.checklist);

    const [requestDLA, setRequestDLA] = useState(financials.dla.eligible);
    const [requestAdvancePay, setRequestAdvancePay] = useState(financials.advancePay.requested);
    const [advanceMonths, setAdvanceMonths] = useState(financials.advancePay.months || 1);
    const [advanceRepaymentTerm, setAdvanceRepaymentTerm] = useState(financials.advancePay.repaymentMonths || 12);
    const [saving, setSaving] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // ─── Profile (for dependents check) ──────────────────────
    const profile = useCurrentProfile();
    const hasDependentsOnProfile = (profile?.dependents || 0) > 0;
    const isGeoBachelor = financials.dependentsRelocating === false;

    // ─── Scroll Tracking (Tactical Wizard pattern) ──────────
    const [activeStep, setActiveStep] = useState(0);
    const scrollViewRef = useRef<any>(null);
    const sectionCoords = useRef<number[]>([]);

    const handleSectionLayout = (index: number, event: LayoutChangeEvent) => {
        sectionCoords.current[index] = event.nativeEvent.layout.y;
    };

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const scrollY = event.nativeEvent.contentOffset.y;
        const layoutHeight = event.nativeEvent.layoutMeasurement.height;
        const triggerPoint = scrollY + (layoutHeight * 0.3);

        let newActive = 0;
        for (let i = 0; i < TOTAL_STEPS; i++) {
            const sectionTop = sectionCoords.current[i] || 0;
            if (triggerPoint >= sectionTop) {
                newActive = i;
            }
        }
        if (newActive !== activeStep) {
            setActiveStep(newActive);
        }
    };

    const scrollToSection = (index: number) => {
        const y = sectionCoords.current[index];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
    };

    // Auto-mark in-progress when flow opens
    useEffect(() => {
        const task = checklist.find((c) => c.label === 'Financial Review & Requests');
        if (task && task.status === 'NOT_STARTED') {
            setChecklistItemStatus(task.id, 'IN_PROGRESS');
        }
    }, []);

    const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => undefined);
    };

    // ─── Dynamic CTA Label ──────────────────────────────────
    const ctaLabel = useMemo(() => {
        if (requestDLA && requestAdvancePay) return 'Submit DLA & Advance Pay Request';
        if (requestDLA) return 'Submit DLA Request';
        if (requestAdvancePay) return 'Submit Advance Pay Request';
        return 'Complete Financial Review';
    }, [requestDLA, requestAdvancePay]);

    const hasRequests = requestDLA || requestAdvancePay;

    // ─── Computed advance pay amount ───────────────────────────
    const basePay = financials.advancePay.amount > 0
        ? financials.advancePay.amount / (financials.advancePay.months || 1)
        : 3800; // fallback
    const computedAdvanceAmount = basePay * advanceMonths;

    // ─── Exit Handling ───────────────────────────────────────
    const handleExit = () => {
        setShowExitModal(true);
    };

    const confirmExit = (action: 'save' | 'discard') => {
        setShowExitModal(false);
        if (action === 'save') {
            updateFinancials((prev) => ({
                dla: { ...prev.dla, eligible: requestDLA },
                advancePay: {
                    ...prev.advancePay,
                    requested: requestAdvancePay,
                    amount: requestAdvancePay ? (prev.advancePay.amount || 0) : 0,
                    months: advanceMonths,
                    repaymentMonths: advanceRepaymentTerm,
                },
            }));
        }
        router.replace('/(tabs)/(hub)' as any);
    };

    // ─── Submit Requests ─────────────────────────────────────
    const handleSubmit = () => {
        if (saving) return;
        setSaving(true);

        // Persist DLA + Advance Pay decisions
        updateFinancials((prev) => ({
            dla: { ...prev.dla, eligible: requestDLA },
            advancePay: {
                ...prev.advancePay,
                requested: requestAdvancePay,
                amount: requestAdvancePay ? computedAdvanceAmount : 0,
                months: advanceMonths,
                repaymentMonths: advanceRepaymentTerm,
            },
        }));

        // Mark complete
        const task = checklist.find((c) => c.label === 'Financial Review & Requests');
        if (task) setChecklistItemStatus(task.id, 'COMPLETE');

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        // Success celebration
        setShowSuccess(true);
        setTimeout(() => {
            router.replace('/(tabs)/(pcs)/pcs' as any);
        }, 2500);
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* ── Header ───────────────────────────────────────── */}
            <View style={{ paddingTop: insets.top }} className="bg-slate-50 dark:bg-slate-950 px-4 pb-0 pt-2">
                <View className="flex-row items-center gap-3 mt-2 mb-1">
                    <Pressable onPress={handleExit} className="p-2 -ml-2 rounded-full active:bg-slate-200 dark:active:bg-slate-800">
                        <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                    </Pressable>
                    <View className="flex-1">
                        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-slate-500 dark:text-gray-500 mb-0">
                            PHASE 2
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-slate-900 dark:text-white mb-1">
                            Financial Review
                        </Text>
                    </View>
                </View>

                {/* ── Wizard Status Bar ──────────────────────────── */}
                <FinancialWizardStatusBar
                    currentStep={activeStep}
                    onStepPress={scrollToSection}
                />
            </View>

            {/* ── Content ──────────────────────────────────────── */}
            <Animated.ScrollView
                ref={scrollViewRef}
                className="flex-1"
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 100 }}
                showsVerticalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
            >
                {/* ═══════════════════════════════════════════════════
                    SECTION 0: YOUR ESTIMATED COSTS
                    "What you'll spend out of pocket"
                    ═══════════════════════════════════════════════════ */}
                <View onLayout={(e) => handleSectionLayout(0, e)}>
                    <Animated.View entering={FadeIn} className="px-4 mb-6">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">Your Estimated Costs</Text>
                        <Text className="text-slate-500 dark:text-zinc-500 text-xs mb-3">Enter your expected out-of-pocket expenses</Text>
                        <MovingCostProjection hideGapAnalysis />
                    </Animated.View>
                </View>

                {/* ═══════════════════════════════════════════════════
                    SECTION 1: ENTITLEMENTS & REQUESTS
                    "Geo-bach toggle → summary → DLA/Advance Pay"
                    ═══════════════════════════════════════════════════ */}
                <View onLayout={(e) => handleSectionLayout(1, e)}>
                    <Animated.View entering={FadeInDown.delay(100)} className="px-4 mb-6">
                        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-1">Your Entitlements</Text>
                        <Text className="text-slate-500 dark:text-zinc-500 text-xs mb-4">What the Navy covers — and what to request</Text>

                        {/* ── Dependent Relocation (Geo-Bachelor) ──── */}
                        {hasDependentsOnProfile && (
                            <View className="rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-4 gap-3 mb-4 shadow-sm dark:shadow-none">
                                <View className="flex-row items-center gap-3">
                                    <Users size={20} color={isDark ? '#60a5fa' : '#3b82f6'} />
                                    <View className="flex-1">
                                        <Text className="text-slate-900 dark:text-zinc-200 text-sm font-semibold">Are your dependents moving with you?</Text>
                                        <Text className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
                                            Affects DLA rate, HHG weight allowance, and per diem calculations
                                        </Text>
                                    </View>
                                </View>

                                {/* Two-option pill selector */}
                                <View className="flex-row gap-2">
                                    <Pressable
                                        onPress={() => {
                                            updateFinancials({ dependentsRelocating: true });
                                            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                        className={`flex-1 rounded-xl py-3 items-center border ${!isGeoBachelor
                                            ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-600/50'
                                            : 'bg-slate-50 border-slate-200 dark:bg-zinc-900/50 dark:border-zinc-700/30'
                                            }`}
                                        style={{ minHeight: 44 }}
                                    >
                                        <Text className={`text-sm font-semibold ${!isGeoBachelor ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-zinc-500'
                                            }`}>Yes, relocating</Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={() => {
                                            updateFinancials({ dependentsRelocating: false });
                                            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                                        }}
                                        className={`flex-1 rounded-xl py-3 items-center border ${isGeoBachelor
                                            ? 'bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-600/50'
                                            : 'bg-slate-50 border-slate-200 dark:bg-zinc-900/50 dark:border-zinc-700/30'
                                            }`}
                                        style={{ minHeight: 44 }}
                                    >
                                        <Text className={`text-sm font-semibold ${isGeoBachelor ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-zinc-500'
                                            }`}>No, geo-bachelor</Text>
                                    </Pressable>
                                </View>

                                {isGeoBachelor && (
                                    <View className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-700/30 rounded-xl px-4 py-2.5">
                                        <Text className="text-amber-700 dark:text-amber-400 text-xs">
                                            Entitlements calculated at the without-dependents rate. Your dependents' BAH continues at your current location.
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* ── Entitlement Summary Cards ──────────────── */}
                        <View className="flex-row gap-3 mb-3">
                            <View className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-3 shadow-sm dark:shadow-none">
                                <Text className="text-slate-500 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">MALT</Text>
                                <Text className="text-slate-900 dark:text-white text-lg font-black mt-0.5">{fmt(financials.totalMalt)}</Text>
                                <Text className="text-slate-400 dark:text-zinc-600 text-[10px] mt-0.5">Mileage allowance</Text>
                            </View>
                            <View className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-3 shadow-sm dark:shadow-none">
                                <Text className="text-slate-500 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Per Diem</Text>
                                <Text className="text-slate-900 dark:text-white text-lg font-black mt-0.5">{fmt(financials.totalPerDiem)}</Text>
                                <Text className="text-slate-400 dark:text-zinc-600 text-[10px] mt-0.5">Meals & lodging</Text>
                            </View>
                            <View className="flex-1 rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-3 shadow-sm dark:shadow-none">
                                <Text className="text-slate-500 dark:text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">DLA</Text>
                                <Text className="text-slate-900 dark:text-white text-lg font-black mt-0.5">{fmt(financials.dla.estimatedAmount)}</Text>
                                <Text className="text-slate-400 dark:text-zinc-600 text-[10px] mt-0.5">
                                    {isGeoBachelor ? '🏠 W/O dep rate' : 'Dislocation allowance'}
                                </Text>
                            </View>
                        </View>

                        {/* Total entitlements callout */}
                        <View className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700/30 rounded-xl px-4 py-3 flex-row items-center justify-between mb-4">
                            <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">Total Entitlements</Text>
                            <Text className="text-emerald-600 dark:text-emerald-300 text-lg font-black">
                                {fmt((financials.totalMalt || 0) + (financials.totalPerDiem || 0) + (financials.dla.estimatedAmount || 0))}
                            </Text>
                        </View>

                        {/* ── DLA Request ───────────────────────────── */}
                        <View className="rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-4 gap-3 mb-4 shadow-sm dark:shadow-none">
                            <View className="flex-row items-center gap-3">
                                <Shield size={20} color={isDark ? '#10b981' : '#059669'} />
                                <View className="flex-1">
                                    <Text className="text-slate-900 dark:text-zinc-200 text-sm font-semibold">Dislocation Allowance (DLA)</Text>
                                    <Text className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
                                        Partially reimburses mandatory relocation expenses (deposits, temporary lodging, etc.)
                                    </Text>
                                </View>
                            </View>

                            <View className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700/30 rounded-xl px-4 py-3">
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">Estimated Amount</Text>
                                    <Text className="text-emerald-600 dark:text-emerald-300 text-lg font-black">{fmt(financials.dla.estimatedAmount)}</Text>
                                </View>
                                {isGeoBachelor && (
                                    <Text className="text-amber-600 dark:text-amber-400/70 text-[10px] mt-1">🏠 Without-dependents rate</Text>
                                )}
                            </View>

                            {financials.dla.receivedFY && (
                                <View className="bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-700/30 rounded-xl px-4 py-2.5">
                                    <Text className="text-amber-700 dark:text-amber-400 text-xs font-semibold">
                                        ⚠ DLA was already received this Fiscal Year — may not be eligible for an additional payment.
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row items-center justify-between bg-slate-50 border border-slate-200 dark:bg-zinc-900/50 dark:border-zinc-700/30 rounded-xl px-4 py-3">
                                <Text className="text-slate-900 dark:text-zinc-200 text-sm font-semibold">Request DLA</Text>
                                <Switch
                                    value={requestDLA}
                                    onValueChange={(val) => {
                                        setRequestDLA(val);
                                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    trackColor={{ false: isDark ? '#3f3f46' : '#e2e8f0', true: isDark ? '#065f46' : '#10b981' }}
                                    thumbColor={requestDLA ? (isDark ? '#34d399' : '#0f766e') : (isDark ? '#a1a1aa' : '#ffffff')}
                                />
                            </View>
                        </View>

                        {/* ── Advance Pay Request ───────────────────── */}
                        <View className="rounded-2xl border border-slate-200 dark:border-zinc-700/50 bg-white dark:bg-zinc-800/50 p-4 gap-3 shadow-sm dark:shadow-none">
                            <View className="flex-row items-center gap-3">
                                <Banknote size={20} color={isDark ? '#f59e0b' : '#d97706'} />
                                <View className="flex-1">
                                    <Text className="text-slate-900 dark:text-zinc-200 text-sm font-semibold">Advance Basic Pay</Text>
                                    <Text className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
                                        Up to 3 months' base pay advanced before your PCS — repaid via payroll deduction.
                                    </Text>
                                </View>
                            </View>

                            {/* Opt-in toggle */}
                            <View className="flex-row items-center justify-between bg-slate-50 border border-slate-200 dark:bg-zinc-900/50 dark:border-zinc-700/30 rounded-xl px-4 py-3">
                                <Text className="text-slate-900 dark:text-zinc-200 text-sm font-semibold">Request Advance Pay</Text>
                                <Switch
                                    value={requestAdvancePay}
                                    onValueChange={(val) => {
                                        setRequestAdvancePay(val);
                                        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                    trackColor={{ false: '#3f3f46', true: '#92400e' }}
                                    thumbColor={requestAdvancePay ? '#f59e0b' : '#a1a1aa'}
                                />
                            </View>

                            {/* Caveat banner — always visible */}
                            <View className="flex-row items-start gap-2 bg-amber-50 border border-amber-200 dark:bg-amber-950/30 dark:border-amber-700/30 rounded-xl px-4 py-2.5">
                                <AlertTriangle size={14} color={isDark ? '#fbbf24' : '#d97706'} style={{ marginTop: 2 }} />
                                <Text className="text-amber-700 dark:text-amber-400 text-xs flex-1 leading-4">
                                    Advance pay reduces your take-home pay for up to 24 months. Review the impact below before deciding.
                                </Text>
                            </View>

                            {/* Visualizer + summary — only when opted in */}
                            {requestAdvancePay && (
                                <Animated.View entering={FadeInDown.duration(300)}>
                                    <AdvancePayVisualizer
                                        monthsRequested={advanceMonths}
                                        onMonthsRequestedChange={setAdvanceMonths}
                                        repaymentTerm={advanceRepaymentTerm}
                                        onRepaymentTermChange={setAdvanceRepaymentTerm}
                                    />

                                    {/* Confirm summary */}
                                    <View className="mt-3 bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-700/20 rounded-xl px-4 py-3">
                                        <Text className="text-slate-700 dark:text-zinc-300 text-xs font-semibold uppercase tracking-wider mb-1">
                                            Your Request
                                        </Text>
                                        <Text className="text-amber-700 dark:text-amber-300 text-base font-black">
                                            {fmt(computedAdvanceAmount)} advance
                                        </Text>
                                        <Text className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5">
                                            {advanceMonths} month{advanceMonths > 1 ? 's' : ''} base pay · repaid over {advanceRepaymentTerm} months
                                        </Text>
                                    </View>
                                </Animated.View>
                            )}
                        </View>
                    </Animated.View>
                </View>
            </Animated.ScrollView>

            {/* ── Bottom Bar: Summary + CTA ──────────────────── */}
            <PreSubmitSummary
                totalEntitlements={(financials.totalMalt || 0) + (financials.totalPerDiem || 0) + (financials.dla.estimatedAmount || 0)}
                totalCosts={financials.movingCosts?.totalEstimated || 0}
                advanceAmount={requestAdvancePay ? computedAdvanceAmount : 0}
                paddingBottom={Math.max(insets.bottom, 20)}
                ctaLabel={ctaLabel}
                hasRequests={hasRequests}
                saving={saving}
                onSubmit={handleSubmit}
            />

            {/* ── Exit Confirmation Modal ──────────────────────── */}
            {showExitModal && (
                <View className="absolute inset-0 z-50 items-center justify-center p-4">
                    {/* Backdrop */}
                    <Animated.View entering={FadeIn} className="absolute inset-0 bg-black/60">
                        <Pressable className="flex-1" onPress={() => setShowExitModal(false)} />
                    </Animated.View>

                    {/* Content */}
                    <Animated.View entering={ZoomIn.duration(200)} className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl">
                        <View className="p-6 items-center">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 text-center">
                                Save Progress?
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-center mb-6">
                                Would you like to save your selections before exiting?
                            </Text>

                            <View className="w-full gap-3">
                                {/* Save & Exit */}
                                <Pressable
                                    onPress={() => confirmExit('save')}
                                    className="w-full py-3 bg-blue-600 rounded-xl items-center active:bg-blue-700"
                                >
                                    <Text className="text-white font-semibold">Save & Exit</Text>
                                </Pressable>

                                {/* Discard */}
                                <Pressable
                                    onPress={() => confirmExit('discard')}
                                    className="w-full py-3 bg-red-50 dark:bg-red-900/20 rounded-xl items-center active:bg-red-100 dark:active:bg-red-900/30"
                                >
                                    <Text className="text-red-600 dark:text-red-400 font-semibold">Discard</Text>
                                </Pressable>

                                {/* Cancel */}
                                <Pressable
                                    onPress={() => setShowExitModal(false)}
                                    className="w-full py-3 mt-2 items-center"
                                >
                                    <Text className="text-slate-500 dark:text-slate-400 font-medium">Cancel</Text>
                                </Pressable>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* ── Success Celebration Overlay ──────────────────── */}
            {showSuccess && (
                <Animated.View
                    entering={FadeIn}
                    className="absolute inset-0 z-50 items-center justify-center"
                >
                    <BlurView
                        intensity={40}
                        tint="dark"
                        className="absolute inset-0 items-center justify-center bg-black/40"
                    >
                        <Animated.View entering={ZoomIn.delay(200).springify()}>
                            {hasRequests ? (
                                <Send size={100} color="white" strokeWidth={2.5} />
                            ) : (
                                <CheckCircle size={100} color="white" strokeWidth={2.5} />
                            )}
                        </Animated.View>
                        <Animated.Text entering={FadeInUp.delay(500)} className="text-white text-3xl font-bold mt-8 tracking-tight">
                            {hasRequests ? 'Requests Submitted!' : 'Review Complete!'}
                        </Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(600)} className="text-blue-100 text-lg mt-3 text-center px-8">
                            {hasRequests
                                ? 'Your PSD will process your request(s) within 5–7 business days.'
                                : 'Your financial review is complete.\nYou\'re on track.'}
                        </Animated.Text>
                    </BlurView>
                </Animated.View>
            )}
        </View>
    );
}

// ─── Pre-Submit Summary Strip ─────────────────────────────────
// Compact financial overview just above the CTA button, matching
// other flows' pattern of showing key data near the submit action.

interface PreSubmitSummaryProps {
    totalEntitlements: number;
    totalCosts: number;
    advanceAmount: number;
    paddingBottom: number;
    ctaLabel: string;
    hasRequests: boolean;
    saving: boolean;
    onSubmit: () => void;
}

function PreSubmitSummary({
    totalEntitlements,
    totalCosts,
    advanceAmount,
    paddingBottom,
    ctaLabel,
    hasRequests,
    saving,
    onSubmit,
}: PreSubmitSummaryProps) {
    const totalCoverage = totalEntitlements + advanceAmount;
    const net = totalCoverage - totalCosts;
    const isCovered = net >= 0;
    const coveredOnlyWithAdvance = !isCovered ? false : (totalEntitlements < totalCosts && totalCoverage >= totalCosts);

    const netColor = isCovered
        ? (coveredOnlyWithAdvance ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')
        : 'text-red-600 dark:text-red-400';
    const netBgColor = isCovered
        ? (coveredOnlyWithAdvance ? 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-700/30' : 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-700/30')
        : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-700/30';
    const netLabel = isCovered
        ? (coveredOnlyWithAdvance ? 'Covered w/ advance' : 'Covered')
        : 'Shortfall';

    return (
        <View
            style={{ paddingBottom }}
            className="absolute bottom-0 left-0 right-0 border-t border-slate-200 dark:border-zinc-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-4 shadow-sm"
        >
            {/* Summary Row */}
            <View className="flex-row items-center justify-between mb-2.5">
                <View className="flex-1 items-center">
                    <Text className="text-slate-500 dark:text-zinc-500 text-[9px] font-semibold uppercase tracking-wider">Entitlements</Text>
                    <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">{fmt(totalEntitlements)}</Text>
                </View>

                {advanceAmount > 0 && (
                    <>
                        <Text className="text-slate-400 dark:text-zinc-600 text-xs mx-1">+</Text>
                        <View className="flex-1 items-center">
                            <Text className="text-slate-500 dark:text-zinc-500 text-[9px] font-semibold uppercase tracking-wider">Advance</Text>
                            <Text className="text-amber-600 dark:text-amber-400 text-sm font-bold">{fmt(advanceAmount)}</Text>
                        </View>
                    </>
                )}

                <Text className="text-slate-400 dark:text-zinc-600 text-xs mx-1">vs</Text>

                <View className="flex-1 items-center">
                    <Text className="text-slate-500 dark:text-zinc-500 text-[9px] font-semibold uppercase tracking-wider">Costs</Text>
                    <Text className="text-slate-900 dark:text-zinc-200 text-sm font-bold">{fmt(totalCosts)}</Text>
                </View>

                <Text className="text-slate-400 dark:text-zinc-600 text-xs mx-1">=</Text>

                <View className={`items-center rounded-lg border px-2.5 py-1 ${netBgColor}`}>
                    <Text className="text-slate-500 dark:text-zinc-500 text-[9px] font-semibold uppercase tracking-wider">{netLabel}</Text>
                    <Text className={`text-sm font-black ${netColor}`}>
                        {isCovered ? '+' : '-'}{fmt(net)}
                    </Text>
                </View>
            </View>

            {/* CTA */}
            <ScalePressable
                onPress={onSubmit}
                disabled={saving}
                className={`rounded-xl px-4 py-3.5 items-center flex-row justify-center gap-2 ${saving ? 'bg-zinc-700' : hasRequests ? 'bg-blue-600' : 'bg-emerald-600'}`}
                accessibilityRole="button"
                accessibilityLabel={ctaLabel}
            >
                {hasRequests ? (
                    <Send size={18} color={saving ? '#a1a1aa' : '#fff'} />
                ) : (
                    <CheckCircle size={18} color={saving ? '#a1a1aa' : '#fff'} />
                )}
                <Text className={`text-base font-bold ${saving ? 'text-zinc-300' : 'text-white'}`}>
                    {ctaLabel}
                </Text>
            </ScalePressable>
        </View>
    );
}
