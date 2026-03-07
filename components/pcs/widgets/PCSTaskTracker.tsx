import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronDown, ChevronRight, Lock, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withTiming } from 'react-native-reanimated';

/**
 * PCS Task Tracker — "Am I on track?"
 *
 * Standalone progress summary widget:
 * 1. Progress bar with phase-specific task count tracking
 * 2. Next action primary CTA with intuitive navigation launcher
 * 3. Expandable "Look Ahead" Accordion for remaining UCT phase tasks
 */

// Map UCT phase number → human-readable phase label (syncs with Mission Brief)
const PHASE_LABELS: Record<number, string> = {
    1: 'Profile & Screenings',
    2: 'Logistics & Finances',
    3: 'Transit & Leave',
    4: 'Check-in & Claim'
};

export function PCSTaskTracker() {
    const checklist = usePCSStore((s) => s.checklist);
    const activeOrder = useActiveOrder();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    // UI state for the "Look Ahead" accordion
    const [isExpanded, setIsExpanded] = useState(false);

    const stats = useMemo(() => {
        if (!activeOrder || checklist.length === 0) return null;

        // Global Check for Profile Confirmation block
        const profileItem = checklist.find(c => c.label === 'Profile Confirmation');
        const isProfileLocked = profileItem && profileItem.status !== 'COMPLETE';

        const completed = checklist.filter((c) => c.status === 'COMPLETE').length;
        const total = checklist.length;
        const progress = total > 0 ? completed / total : 0;
        const phaseLabel = 'PCS Mission Progress';

        // Flatten tasks, maintain UCT ordering
        const pendingItems = checklist
            .filter((c) => c.status !== 'COMPLETE')
            .sort((a, b) => {
                if (a.uctPhase !== b.uctPhase) return a.uctPhase - b.uctPhase;
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            });

        const nextAction = pendingItems[0] ?? null;
        const upcomingTasks = pendingItems.slice(1).map(task => ({
            ...task,
            // Lock Phase 2+ tasks if Profile Confirmation is not done
            isLocked: isProfileLocked && task.uctPhase > 1
        }));

        return { completed, total, progress, phaseLabel, nextAction, upcomingTasks };
    }, [activeOrder, checklist]);

    // Accordion Animation styles
    const accordionStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(isExpanded ? (stats?.upcomingTasks.length || 0) * 50 + 20 : 0, { duration: 300 }),
            opacity: withTiming(isExpanded ? 1 : 0, { duration: 250 }),
            marginTop: withTiming(isExpanded ? 12 : 0, { duration: 300 }),
        };
    });

    const chevronStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 300 }) }]
        };
    });

    if (!stats) return null;
    const { completed, total, progress, phaseLabel, nextAction, upcomingTasks } = stats;

    return (
        <Animated.View entering={FadeIn.duration(400).delay(200)}>
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
                <View className="p-5">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-4">
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-800/60 shadow-sm">
                                <CheckCircle2 size={26} color={isDark ? '#60A5FA' : '#2563EB'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={2}>{phaseLabel}</Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={2}>{completed} of {total} Tasks Complete</Text>
                            </View>
                        </View>
                        <View className="bg-blue-500/10 px-3 py-1.5 rounded-[12px] border border-blue-500/20 ml-2">
                            <Text className="text-[14px] font-black tracking-wide text-blue-700 dark:text-blue-300">
                                {Math.round(progress * 100)}%
                            </Text>
                        </View>
                    </View>

                    <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                        {/* Track */}
                        <View className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 overflow-hidden mb-5">
                            <View
                                className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                        </View>

                        {/* ── Next Action CTA ── */}
                        {nextAction && (
                            <ScalePressable
                                onPress={() => {
                                    if (nextAction.actionRoute) {
                                        router.push(nextAction.actionRoute as any);
                                    }
                                }}
                                className="flex-row items-center bg-blue-600 dark:bg-blue-500 rounded-[16px] px-5 py-4 shadow-sm"
                            >
                                <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
                                    <Zap size={16} color="#FFFFFF" fill="#FFFFFF40" />
                                </View>
                                <View className="flex-1 ml-3">
                                    <Text className="text-[11px] font-bold text-blue-200 uppercase tracking-wider mb-0.5">Next Action</Text>
                                    <Text
                                        className="text-[15px] font-bold text-white leading-tight"
                                        numberOfLines={1}
                                    >
                                        {nextAction.label}
                                    </Text>
                                </View>
                                {nextAction.actionRoute && (
                                    <View className="w-8 h-8 rounded-full bg-black/10 items-center justify-center ml-2 border border-white/10">
                                        <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                                    </View>
                                )}
                            </ScalePressable>
                        )}

                        {/* ── Expandable Upcoming Tasks ── */}
                        {upcomingTasks.length > 0 && (
                            <View className="mt-3">
                                <Pressable
                                    onPress={() => setIsExpanded(!isExpanded)}
                                    className="flex-row items-center justify-between py-2 px-1"
                                    hitSlop={10}
                                >
                                    <Text className="text-slate-500 dark:text-slate-400 text-[13px] font-bold tracking-wider uppercase">
                                        View Upcoming Tasks
                                    </Text>
                                    <Animated.View style={chevronStyle}>
                                        <ChevronDown size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                                    </Animated.View>
                                </Pressable>

                                <Animated.View style={[accordionStyle, { overflow: 'hidden' }]}>
                                    {upcomingTasks.map((task, idx) => (
                                        <ScalePressable
                                            key={task.id}
                                            disabled={task.isLocked || !task.actionRoute}
                                            onPress={() => {
                                                if (!task.isLocked && task.actionRoute) {
                                                    router.push(task.actionRoute as any);
                                                }
                                            }}
                                            className={`flex-row items-center py-3 px-3 ${idx < upcomingTasks.length - 1 ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}
                                        >
                                            <View className={`w-8 h-8 rounded-full items-center justify-center border ${task.isLocked ? 'bg-slate-100 dark:bg-slate-800 border-slate-200/50 dark:border-slate-700/50' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-700/50'}`}>
                                                {task.isLocked ? (
                                                    <Lock size={14} color={isDark ? '#64748B' : '#94A3B8'} />
                                                ) : (
                                                    <ChevronRight size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                                )}
                                            </View>
                                            <View className="flex-1 ml-3">
                                                <Text className={`text-[14px] font-semibold ${task.isLocked ? 'text-slate-500 dark:text-slate-500' : 'text-slate-700 dark:text-slate-300'}`} numberOfLines={1}>
                                                    {task.label}
                                                </Text>
                                                {!task.isLocked && task.helpText && (
                                                    <Text className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5" numberOfLines={1}>{task.helpText}</Text>
                                                )}
                                            </View>
                                        </ScalePressable>
                                    ))}
                                </Animated.View>
                            </View>
                        )}

                    </View>
                </View>
            </GlassView>
        </Animated.View>
    );
}
