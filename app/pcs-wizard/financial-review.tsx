import { ScalePressable } from '@/components/ScalePressable';
import { AdvancePayVisualizer } from '@/components/pcs/financials/AdvancePayVisualizer';
import { EntitlementsMeter } from '@/components/pcs/financials/EntitlementsMeter';
import { MovingCostProjection } from '@/components/pcs/financials/MovingCostProjection';
import { FinancialWizardStatusBar } from '@/components/pcs/wizard/FinancialWizardStatusBar';
import { usePCSStore } from '@/store/usePCSStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    Banknote,
    CheckCircle,
    ChevronLeft,
    FileCheck2,
    Shield
} from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
    LayoutChangeEvent,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    Switch,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Constants ────────────────────────────────────────────────

const TOTAL_STEPS = 4;

const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

// ─── Screen ───────────────────────────────────────────────────

export default function FinancialReviewScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const financials = usePCSStore((s) => s.financials);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);
    const updateFinancials = usePCSStore((s) => s.updateFinancials);
    const checklist = usePCSStore((s) => s.checklist);

    const [requestDLA, setRequestDLA] = useState(financials.dla.eligible);
    const [saving, setSaving] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

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
        const task = checklist.find((c) => c.label === 'Financial Review & DLA Request');
        if (task && task.status === 'NOT_STARTED') {
            setChecklistItemStatus(task.id, 'IN_PROGRESS');
        }
    }, []);

    const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
        if (Platform.OS !== 'web') Haptics.impactAsync(style).catch(() => undefined);
    };

    // ─── Exit Handling ───────────────────────────────────────
    const handleExit = () => {
        setShowExitModal(true);
    };

    const confirmExit = (action: 'save' | 'discard') => {
        setShowExitModal(false);
        if (action === 'save') {
            // Persist current DLA decision before leaving
            updateFinancials((prev) => ({
                dla: { ...prev.dla, eligible: requestDLA },
            }));
        }
        router.replace('/(tabs)/(pcs)/pcs' as any);
    };

    // ─── Save & Complete ─────────────────────────────────────
    const handleSaveAndFinish = () => {
        if (saving) return;
        setSaving(true);

        // Persist DLA decision
        updateFinancials((prev) => ({
            dla: { ...prev.dla, eligible: requestDLA },
        }));

        // Mark complete
        const task = checklist.find((c) => c.label === 'Financial Review & DLA Request');
        if (task) setChecklistItemStatus(task.id, 'COMPLETE');

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

        // Success celebration
        setShowSuccess(true);
        setTimeout(() => {
            router.replace('/(tabs)/(pcs)/pcs' as any);
        }, 2500);
    };

    return (
        <View className="flex-1 bg-slate-950">
            {/* ── Header ───────────────────────────────────────── */}
            <View style={{ paddingTop: insets.top }} className="bg-slate-950 px-4 pb-0 pt-2">
                <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-gray-500">
                            PHASE 2
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-white">
                            Financial Review
                        </Text>
                    </View>
                    <Pressable onPress={handleExit} className="p-2 rounded-full active:bg-slate-800">
                        <ChevronLeft size={24} color="#e2e8f0" />
                    </Pressable>
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
                {/* ── Section 0: Entitlements Overview ───────────── */}
                <View onLayout={(e) => handleSectionLayout(0, e)}>
                    <Animated.View entering={FadeIn} className="px-4 mb-6">
                        <Text className="text-lg font-bold text-white mb-3">Entitlements Overview</Text>

                        {/* Summary cards */}
                        <View className="flex-row gap-3 mb-3">
                            <View className="flex-1 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                                <Text className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">MALT</Text>
                                <Text className="text-white text-lg font-black mt-0.5">{fmt(financials.totalMalt)}</Text>
                            </View>
                            <View className="flex-1 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                                <Text className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">Per Diem</Text>
                                <Text className="text-white text-lg font-black mt-0.5">{fmt(financials.totalPerDiem)}</Text>
                            </View>
                            <View className="flex-1 rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-3">
                                <Text className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">DLA</Text>
                                <Text className="text-white text-lg font-black mt-0.5">{fmt(financials.dla.estimatedAmount)}</Text>
                            </View>
                        </View>

                        {/* Entitlements Meter widget (embedded) */}
                        <View className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 overflow-hidden">
                            <EntitlementsMeter />
                        </View>
                    </Animated.View>
                </View>

                {/* ── Section 1: Cost Projection ─────────────────── */}
                <View onLayout={(e) => handleSectionLayout(1, e)}>
                    <Animated.View entering={FadeInDown.delay(100)} className="px-4 mb-6">
                        <Text className="text-lg font-bold text-white mb-3">Cost Projection</Text>
                        <MovingCostProjection />
                    </Animated.View>
                </View>

                {/* ── Section 2: DLA Decision ────────────────────── */}
                <View onLayout={(e) => handleSectionLayout(2, e)}>
                    <Animated.View entering={FadeInDown.delay(200)} className="px-4 mb-6">
                        <Text className="text-lg font-bold text-white mb-3">DLA Request</Text>
                        <View className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4 gap-3">
                            <View className="flex-row items-center gap-3">
                                <Shield size={20} color="#10b981" />
                                <View className="flex-1">
                                    <Text className="text-zinc-200 text-sm font-semibold">Dislocation Allowance</Text>
                                    <Text className="text-zinc-400 text-xs mt-0.5">
                                        Partially reimburses mandatory relocation expenses (deposits, temporary lodging, etc.)
                                    </Text>
                                </View>
                            </View>

                            <View className="bg-emerald-950/30 border border-emerald-700/30 rounded-xl px-4 py-3 flex-row items-center justify-between">
                                <Text className="text-emerald-400 text-sm font-semibold">Estimated Amount</Text>
                                <Text className="text-emerald-300 text-lg font-black">{fmt(financials.dla.estimatedAmount)}</Text>
                            </View>

                            {financials.dla.receivedFY && (
                                <View className="bg-amber-950/30 border border-amber-700/30 rounded-xl px-4 py-2.5">
                                    <Text className="text-amber-400 text-xs font-semibold">
                                        ⚠ DLA was already received this Fiscal Year — may not be eligible for an additional payment.
                                    </Text>
                                </View>
                            )}

                            <View className="flex-row items-center justify-between">
                                <Text className="text-zinc-300 text-sm">Request DLA</Text>
                                <Switch
                                    value={requestDLA}
                                    onValueChange={setRequestDLA}
                                    trackColor={{ false: '#3f3f46', true: '#065f46' }}
                                    thumbColor={requestDLA ? '#34d399' : '#a1a1aa'}
                                />
                            </View>
                        </View>
                    </Animated.View>
                </View>

                {/* ── Section 3: Advance Pay ─────────────────────── */}
                <View onLayout={(e) => handleSectionLayout(3, e)}>
                    <Animated.View entering={FadeInDown.delay(300)} className="px-4 mb-6">
                        <Text className="text-lg font-bold text-white mb-3">Advance Pay</Text>

                        <View className="rounded-2xl border border-zinc-700/50 bg-zinc-800/50 p-4 gap-3">
                            <View className="flex-row items-center gap-3 mb-1">
                                <Banknote size={20} color="#f59e0b" />
                                <View className="flex-1">
                                    <Text className="text-zinc-200 text-sm font-semibold">Advance Basic Pay</Text>
                                    <Text className="text-zinc-400 text-xs mt-0.5">
                                        Up to 3 months' base pay advanced before your PCS — repaid via payroll deduction.
                                    </Text>
                                </View>
                            </View>

                            {/* Advance Pay Visualizer (embedded) */}
                            <AdvancePayVisualizer />
                        </View>
                    </Animated.View>
                </View>
            </Animated.ScrollView>

            {/* ── Bottom CTA ───────────────────────────────────── */}
            <View
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                className="absolute bottom-0 left-0 right-0 border-t border-zinc-800 bg-slate-950 p-4"
            >
                <ScalePressable
                    onPress={handleSaveAndFinish}
                    disabled={saving}
                    className={`rounded-xl px-4 py-3.5 items-center flex-row justify-center gap-2 ${saving ? 'bg-zinc-700' : 'bg-emerald-600'}`}
                    accessibilityRole="button"
                    accessibilityLabel="Save financial review"
                >
                    <FileCheck2 size={18} color={saving ? '#a1a1aa' : '#fff'} />
                    <Text className={`text-base font-bold ${saving ? 'text-zinc-300' : 'text-white'}`}>
                        Save & Complete Review
                    </Text>
                </ScalePressable>
            </View>

            {/* ── Exit Confirmation Modal ──────────────────────── */}
            {showExitModal && (
                <View className="absolute inset-0 z-50 items-center justify-center p-4">
                    {/* Backdrop */}
                    <Animated.View entering={FadeIn} className="absolute inset-0 bg-black/60">
                        <Pressable className="flex-1" onPress={() => setShowExitModal(false)} />
                    </Animated.View>

                    {/* Content */}
                    <Animated.View entering={ZoomIn.duration(200)} className="bg-slate-900 w-full max-w-sm rounded-2xl overflow-hidden border border-slate-700 shadow-2xl">
                        <View className="p-6 items-center">
                            <Text className="text-xl font-bold text-white mb-2 text-center">
                                Save Progress?
                            </Text>
                            <Text className="text-slate-400 text-center mb-6">
                                Would you like to save your DLA decision before exiting?
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
                                    className="w-full py-3 bg-red-900/20 rounded-xl items-center active:bg-red-900/30"
                                >
                                    <Text className="text-red-400 font-semibold">Discard</Text>
                                </Pressable>

                                {/* Cancel */}
                                <Pressable
                                    onPress={() => setShowExitModal(false)}
                                    className="w-full py-3 mt-2 items-center"
                                >
                                    <Text className="text-slate-400 font-medium">Cancel</Text>
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
                            <CheckCircle size={100} color="white" strokeWidth={2.5} />
                        </Animated.View>
                        <Animated.Text entering={FadeInUp.delay(500)} className="text-white text-3xl font-bold mt-8 tracking-tight">
                            Plan Saved!
                        </Animated.Text>
                        <Animated.Text entering={FadeInUp.delay(600)} className="text-blue-100 text-lg mt-3 text-center">
                            Your financial review is complete.{'\n'}You're on track.
                        </Animated.Text>
                    </BlurView>
                </Animated.View>
            )}
        </View>
    );
}
