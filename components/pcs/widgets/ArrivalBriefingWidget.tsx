import { GlassView } from '@/components/ui/GlassView';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
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
                className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
            >
                <LinearGradient
                    colors={isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <TouchableOpacity activeOpacity={0.7}>
                    <View className="p-5 relative overflow-hidden">
                        {/* Glow Behind the Icon */}
                        <Animated.View
                            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-400/20"
                            style={animatedGlow}
                        />

                        {/* Header */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center gap-4 flex-1">
                                <View className="w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-800/60 shadow-sm">
                                    <CalendarClock size={26} color={isDark ? '#60A5FA' : '#2563EB'} />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>Action Required</Text>
                                    <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>Arrival Briefing</Text>
                                </View>
                            </View>

                            {daysSinceArrival !== null && (
                                <View className="bg-blue-500/10 px-3 py-1.5 rounded-[12px] border border-blue-500/20 ml-2">
                                    <Text className="text-[11px] font-black tracking-wide text-blue-700 dark:text-blue-300 uppercase">
                                        Day {daysSinceArrival}
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Action Body (Smart Stack - Alert to Action) */}
                        <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                            <View className="bg-white/80 dark:bg-slate-800/80 rounded-xl p-4 border border-blue-500/30 flex-row items-center justify-between shadow-sm">
                                <View className="flex-1 flex-row items-center gap-3 pr-2">
                                    <NextIcon size={20} color={isDark ? '#93c5fd' : '#2563eb'} />
                                    <View className="flex-1">
                                        <Text className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-0.5 tracking-wider">
                                            {nextStep.timeframe}
                                        </Text>
                                        <Text className="text-[14px] font-bold text-slate-900 dark:text-white leading-tight">
                                            {nextStep.label}
                                        </Text>
                                    </View>
                                </View>
                                <View className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 items-center justify-center border border-blue-500/20">
                                    <ChevronRight size={18} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.5} />
                                </View>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </GlassView>
        </Animated.View>
    );
}
