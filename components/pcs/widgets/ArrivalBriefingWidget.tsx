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
            <View
                style={{
                    backgroundColor: isDark ? 'rgba(30,41,59,0.6)' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 4,
                }}
            >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <CalendarClock size={18} color={isDark ? '#60A5FA' : '#2563EB'} />
                        <Text
                            style={{
                                fontSize: 15,
                                fontWeight: '800',
                                color: isDark ? '#FFFFFF' : '#0F172A',
                            }}
                        >
                            Arrival Briefing
                        </Text>
                    </View>

                    {daysSinceArrival !== null && (
                        <View
                            style={{
                                backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : '#EFF6FF',
                                paddingHorizontal: 10,
                                paddingVertical: 3,
                                borderRadius: 10,
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 12,
                                    fontWeight: '700',
                                    color: isDark ? '#60A5FA' : '#2563EB',
                                }}
                            >
                                Day {daysSinceArrival}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Timeline */}
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
                                <View style={{ alignItems: 'center', width: 20, marginRight: 10 }}>
                                    <View
                                        style={{
                                            width: 10,
                                            height: 10,
                                            borderRadius: 5,
                                            backgroundColor: done
                                                ? '#22C55E'
                                                : isDark ? '#475569' : '#CBD5E1',
                                            marginTop: 4,
                                        }}
                                    />
                                    {!isLast && (
                                        <View
                                            style={{
                                                width: 2,
                                                flex: 1,
                                                backgroundColor: isDark ? '#334155' : '#E2E8F0',
                                                marginVertical: 2,
                                            }}
                                        />
                                    )}
                                </View>

                                {/* Right: content */}
                                <View style={{ flex: 1, paddingBottom: isLast ? 0 : 16 }}>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '700',
                                            color: done
                                                ? '#22C55E'
                                                : isDark ? '#60A5FA' : '#3B82F6',
                                            letterSpacing: 0.5,
                                            marginBottom: 2,
                                        }}
                                    >
                                        {step.timeframe}
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 13,
                                            fontWeight: '600',
                                            color: done
                                                ? isDark ? '#6B7280' : '#9CA3AF'
                                                : isDark ? '#E2E8F0' : '#334155',
                                            textDecorationLine: done ? 'line-through' : 'none',
                                        }}
                                    >
                                        {step.label}
                                    </Text>
                                </View>
                            </View>
                        </Animated.View>
                    );
                })}
            </View>
        </Animated.View>
    );
}
