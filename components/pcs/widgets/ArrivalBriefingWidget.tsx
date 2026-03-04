import { GlassView } from '@/components/ui/GlassView';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import type { LucideIcon } from 'lucide-react-native';
import {
    CalendarClock,
    CheckCircle2,
    ClipboardCheck,
    FileText,
    Home,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View, useColorScheme } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

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
        label: 'Establish housing & update profile',
        timeframe: 'Weeks 1–2',
        icon: Home,
        checklistLabel: 'Confirm Updated Profile',
    },
];

// ─── Component ─────────────────────────────────────────────────

export function ArrivalBriefingWidget() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const activeOrder = useActiveOrder();
    const checklist = usePCSStore((s) => s.checklist);

    const isDemoMode = useDemoStore((s) => s.isDemoMode);
    const demoTimeline = useDemoStore((s) => s.demoTimelineOverride);

    // Derive arrival day count — use demo timeline when available
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
        return Math.max(1, diff + 1); // Day 1 = report date
    }, [activeOrder?.reportNLT, isDemoMode, demoTimeline]);

    // Check which timeline steps are completed via matching checklist items
    const completedSteps = useMemo(() => {
        const done = new Set<string>();
        for (const step of TIMELINE_STEPS) {
            if (!step.checklistLabel) continue;
            const item = checklist.find((c) => c.label === step.checklistLabel);
            if (item?.status === 'COMPLETE') done.add(step.id);
        }
        return done;
    }, [checklist]);

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
                <View className="bg-white/40 dark:bg-slate-900/60 p-5">
                    {/* Header */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                        <View className="flex-row items-center" style={{ gap: 8 }}>
                            <View className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 items-center justify-center border border-blue-500/20">
                                <CalendarClock size={20} color={isDark ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <Text className="text-[15px] font-extrabold text-slate-900 dark:text-white">
                                Arrival Briefing
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

                    {/* Timeline */}
                    <View className="bg-white/60 dark:bg-slate-950/40 rounded-xl p-4 border border-slate-200/50 dark:border-slate-700/50">
                        {TIMELINE_STEPS.map((step, index) => {
                            const isLast = index === TIMELINE_STEPS.length - 1;
                            const Icon = step.icon;
                            const done = completedSteps.has(step.id);

                            return (
                                <Animated.View
                                    key={step.id}
                                    entering={FadeIn.delay(200 + index * 80)}
                                >
                                    <View style={{ flexDirection: 'row' }}>
                                        {/* Left: dot + line */}
                                        <View style={{ alignItems: 'center', width: 24, marginRight: 12 }}>
                                            <View className="w-8 h-8 rounded-full items-center justify-center -ml-2" style={{ backgroundColor: done ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                                                <View
                                                    className={`w-3 h-3 rounded-full ${done ? 'bg-green-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                    style={{ marginTop: 4 }}
                                                />
                                            </View>
                                            {!isLast && (
                                                <View
                                                    className="w-[2px] flex-1 bg-slate-200 dark:bg-slate-700"
                                                    style={{ marginVertical: 2, marginRight: 8 }}
                                                />
                                            )}
                                        </View>

                                        {/* Right: content */}
                                        <View style={{ flex: 1, paddingBottom: isLast ? 0 : 20 }}>
                                            <Text
                                                className={`text-[11px] font-bold tracking-[0.5px] mb-1 ${done ? 'text-green-600 dark:text-green-500' : 'text-blue-600 dark:text-blue-400'}`}
                                                style={{ textTransform: 'uppercase' }}
                                            >
                                                {step.timeframe}
                                            </Text>
                                            <Text
                                                className={`text-[13.5px] font-semibold ${done ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}
                                            >
                                                {step.label}
                                            </Text>
                                        </View>
                                    </View>
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>
            </GlassView>
        </Animated.View>
    );
}
