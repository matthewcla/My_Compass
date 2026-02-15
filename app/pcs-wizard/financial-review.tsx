import { ScalePressable } from '@/components/ScalePressable';
import { AdvancePayVisualizer } from '@/components/pcs/financials/AdvancePayVisualizer';
import { EntitlementsMeter } from '@/components/pcs/financials/EntitlementsMeter';
import { MovingCostProjection } from '@/components/pcs/financials/MovingCostProjection';
import { usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    Banknote,
    ChevronLeft,
    DollarSign,
    FileCheck2,
    Gauge,
    Shield,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Section nav ──────────────────────────────────────────────

type SectionKey = 'entitlements' | 'costs' | 'dla' | 'advance';

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
    { key: 'entitlements', label: '1. Entitlements', icon: <Gauge size={16} color="#3b82f6" /> },
    { key: 'costs', label: '2. Costs', icon: <DollarSign size={16} color="#a855f7" /> },
    { key: 'dla', label: '3. DLA', icon: <Shield size={16} color="#10b981" /> },
    { key: 'advance', label: '4. Advance', icon: <Banknote size={16} color="#f59e0b" /> },
];

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

    const handleBack = () => router.replace('/(tabs)/(pcs)/pcs' as any);

    const handleSaveAndFinish = () => {
        if (saving) return;
        setSaving(true);

        // Persist DLA decision
        updateFinancials((prev) => ({
            dla: {
                ...prev.dla,
                eligible: requestDLA,
            },
        }));

        // Mark complete
        const task = checklist.find((c) => c.label === 'Financial Review & DLA Request');
        if (task) setChecklistItemStatus(task.id, 'COMPLETE');

        triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
        router.replace('/(tabs)/(pcs)/pcs' as any);
    };

    return (
        <View className="flex-1 bg-slate-950">
            {/* ── Header ───────────────────────────────────────── */}
            <View style={{ paddingTop: insets.top }} className="bg-slate-950 px-4 pb-2 pt-2">
                <View className="flex-row items-start justify-between">
                    <View className="flex-1">
                        <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }} className="text-gray-500">
                            PHASE 2
                        </Text>
                        <Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }} className="text-white">
                            Financial Review
                        </Text>
                    </View>
                    <Pressable onPress={handleBack} className="p-2 rounded-full active:bg-slate-800">
                        <ChevronLeft size={24} color="#e2e8f0" />
                    </Pressable>
                </View>
            </View>

            {/* ── Section Progress Dots ────────────────────────── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 pb-3" contentContainerStyle={{ gap: 8 }}>
                {SECTIONS.map((s) => (
                    <View key={s.key} className="flex-row items-center gap-1.5">
                        {s.icon}
                        <Text className="text-[10px] text-zinc-400 font-medium">{s.label}</Text>
                    </View>
                ))}
            </ScrollView>

            {/* ── Content ──────────────────────────────────────── */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 20) + 100 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Section 1: Entitlements Overview ───────────── */}
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

                {/* ── Section 2: Cost Projection ─────────────────── */}
                <Animated.View entering={FadeInDown.delay(100)} className="px-4 mb-6">
                    <Text className="text-lg font-bold text-white mb-3">Cost Projection</Text>
                    <MovingCostProjection />
                </Animated.View>

                {/* ── Section 3: DLA Decision ────────────────────── */}
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

                {/* ── Section 4: Advance Pay ─────────────────────── */}
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
            </ScrollView>

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
        </View>
    );
}
