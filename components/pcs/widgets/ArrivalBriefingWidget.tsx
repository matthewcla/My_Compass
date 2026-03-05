import { GlassView } from '@/components/ui/GlassView';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import type { LucideIcon } from 'lucide-react-native';
import {
    CalendarClock,
    CheckCircle2,
    ChevronRight,
    ClipboardCheck,
    FileText,
    Home,
} from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

// ─── Timeline Steps ────────────────────────────────────────────

interface TimelineStep {
    id: string;
    label: string;
    timeframe: string;
    icon: LucideIcon;
    checklistLabel?: string; // If set, auto-checks when matching checklist item is COMPLETE
}

const TIMELINE_STEPS: TimelineStep[] = [
    {
        id: 'report',
        label: 'Report to quarterdeck with orders',
        timeframe: 'Day 1',
        icon: ClipboardCheck,
        checklistLabel: 'Complete Gaining Command Check-In',
    },
    {
        id: 'checkin',
        label: 'Complete department check-in',
        timeframe: 'Days 1–3',
        icon: CheckCircle2,
    },
    {
        id: 'claim',
        label: 'File travel claim',
        timeframe: 'Days 1–5',
        icon: FileText,
        checklistLabel: 'File Travel Claim',
    },
    {
        id: 'housing',
        label: 'Establish housing',
        timeframe: 'Weeks 1–2',
        icon: Home,
        checklistLabel: 'Confirm Updated Profile',
    },
];

export function ArrivalBriefingWidget() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const activeOrder = useActiveOrder();
    const checklist = usePCSStore((s) => s.checklist);

    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const demoTimeline = useDemoStore((s) => s.demoTimelineOverride);

    const daysSinceArrival = useMemo(() => {
        if (isDemoMode && demoTimeline && demoTimeline.daysOnStation > 0) {
            return demoTimeline.daysOnStation;
        }
        if (!activeOrder?.reportNLT) return null;
        const report = new Date(activeOrder.reportNLT);
        if (Number.isNaN(report.getTime())) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        report.setHours(0, 0, 0, 0);
        const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
        return Math.max(1, diff + 1);
    }, [activeOrder?.reportNLT, isDemoMode, demoTimeline]);

    const completedSteps = useMemo(() => {
        const done = new Set<string>();
        for (const step of TIMELINE_STEPS) {
            if (!step.checklistLabel) continue;
            const item = checklist.find((c) => c.label === step.checklistLabel);
            if (item?.status === 'COMPLETE') done.add(step.id);
        }
        return done;
    }, [checklist]);

    const nextStepIndex = TIMELINE_STEPS.findIndex(step => !completedSteps.has(step.id));
    const nextStep = nextStepIndex !== -1 ? TIMELINE_STEPS[nextStepIndex] : null;

    // Subtly pulsing glow for the required action
    const pulseValue = useSharedValue(0.4);
    useEffect(() => {
        pulseValue.value = withRepeat(
            withTiming(1, { duration: 1500 }),
            -1,
            true
        );
    }, []);

    const animatedGlow = useAnimatedStyle(() => ({
        opacity: pulseValue.value
    }));

    if (!nextStep) return null; // Fully complete

    const NextIcon = nextStep.icon;

    return (
        <Animated.View entering={FadeInDown.delay(100).springify()}>
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-2xl overflow-hidden mx-4 mb-8"
                style={{
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                }}
            >
                <TouchableOpacity activeOpacity={0.7}>
                    <View className="bg-white/40 dark:bg-slate-900/60 p-5 relative overflow-hidden">
                        {/* Glow Behind the Icon */}
                        <Animated.View
                            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-400/20"
                            style={animatedGlow}
                        />

                        {/* Header */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View className="flex-row items-center" style={{ gap: 8 }}>
                                <View className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 items-center justify-center border border-blue-500/20">
                                    <CalendarClock size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
                                </View>
                                <Text className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                                    Action Required
                                </Text>
                            </View>

                            {daysSinceArrival !== null && (
                                <View className="bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                    <Text className="text-xs font-bold text-blue-700 dark:text-blue-300">
                                        Day {daysSinceArrival}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Action Body (Smart Stack - Alert to Action) */}
                        <View className="bg-white/80 dark:bg-black/40 rounded-xl p-4 border border-blue-500/30 flex-row items-center justify-between shadow-sm">
                            <View className="flex-1 flex-row items-center gap-3 pr-2">
                                <NextIcon size={20} color={isDark ? '#93c5fd' : '#2563eb'} />
                                <View className="flex-1">
                                    <Text className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                                        {nextStep.timeframe}
                                    </Text>
                                    <Text className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                                        {nextStep.label}
                                    </Text>
                                </View>
                            </View>
                            <View className="w-8 h-8 rounded-full bg-blue-500 dark:bg-blue-600 items-center justify-center">
                                <ChevronRight size={18} color="#ffffff" strokeWidth={3} />
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </GlassView>
        </Animated.View>
    );
}
