import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { UCT_PHASES } from '@/constants/UCTPhases';
import { useActiveOrder, usePCSStore, useUCTPhaseStatus } from '@/store/usePCSStore';
import { UCTNodeStatus, UCTPhase } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight, CircleDashed, Lock, MapPin, Package } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { TaskClusterHeader, TaskClusterType } from './TaskClusterHeader';

export function PCSSummaryWidget() {
    const isDark = useColorScheme() === 'dark';
    const router = useRouter();

    const activeOrder = useActiveOrder();
    const checklist = usePCSStore(s => s.checklist);
    const uctStatus = useUCTPhaseStatus();
    const financials = usePCSStore(state => state.financials);

    // Calculate active phase
    const activePhaseNum = useMemo(() => {
        const active = Object.entries(uctStatus).find(([_, status]) => status === 'ACTIVE');
        return active ? Number(active[0]) as UCTPhase : 1;
    }, [uctStatus]);
    const activePhaseConfig = UCT_PHASES.find(p => p.phase === activePhaseNum);

    // UI state for the "Look Ahead" accordion
    const [isExpanded, setIsExpanded] = useState(false);
    const [accordionContentHeight, setAccordionContentHeight] = useState(0);

    // Get Next Action and Upcoming Tasks
    const { nextAction, groupedUpcomingTasks, upcomingTasksCount, clusterCount } = useMemo(() => {
        const profileItem = checklist.find(c => c.label === 'Profile Confirmation');
        const isProfileLocked = profileItem && profileItem.status !== 'COMPLETE';

        const pendingItems = checklist
            .filter((c) => c.status !== 'COMPLETE')
            .sort((a, b) => {
                if (a.uctPhase !== b.uctPhase) return a.uctPhase - b.uctPhase;
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            });

        const activeAction = pendingItems[0] ?? null;
        const upcoming = pendingItems.slice(1).map(task => ({
            ...task,
            isLocked: isProfileLocked && task.uctPhase > 1
        }));

        // Group upcoming tasks
        const clusteredTasks = upcoming.reduce((acc, task) => {
            let cluster: TaskClusterType = 'admin';
            if (task.category === 'SCREENING') cluster = 'medical';
            else if (task.category === 'FINANCE') cluster = 'logistics';
            else if (task.category === 'PRE_TRAVEL') cluster = 'operations';
            // Exclude CHECK_IN deliberately so it doesn't appear in the summary widget
            if (task.category === 'CHECK_IN') return acc;
            // Exclude "Update Residence" from Operations & Transit per user request
            if (task.label === 'Update Residence') return acc;

            if (!acc[cluster]) acc[cluster] = [];
            acc[cluster].push(task);
            return acc;
        }, {} as Record<TaskClusterType, typeof upcoming>);

        const clusterOrder: TaskClusterType[] = ['admin', 'medical', 'logistics', 'operations'];
        const grouped = clusterOrder
            .map(cluster => ({
                cluster,
                tasks: clusteredTasks[cluster] || []
            }))
            .filter(g => g.tasks.length > 0);

        return {
            nextAction: activeAction,
            groupedUpcomingTasks: grouped,
            upcomingTasksCount: upcoming.length,
            clusterCount: grouped.length
        };
    }, [checklist]);

    // Accordion Animation styles
    const accordionStyle = useAnimatedStyle(() => {
        return {
            height: withTiming(isExpanded ? accordionContentHeight : 0, { duration: 300 }),
            opacity: withTiming(isExpanded ? 1 : 0, { duration: 250 }),
            marginTop: withTiming(isExpanded ? 12 : 0, { duration: 300 }),
        };
    }, [isExpanded, accordionContentHeight]);

    const chevronStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: withTiming(isExpanded ? '180deg' : '0deg', { duration: 300 }) }]
        };
    });

    // Compute progress
    const { completed, total } = useMemo(() => {
        const phaseItems = checklist.filter(i => i.uctPhase === activePhaseNum);
        return {
            completed: phaseItems.filter(i => i.status === 'COMPLETE').length,
            total: phaseItems.length
        };
    }, [checklist, activePhaseNum]);

    const progressPercent = total > 0 ? (completed / total) * 100 : 0;

    // Financials
    const totalEntitlements = (financials.dla?.estimatedAmount || 0);

    return (
        <View className="flex flex-col gap-2">
            <GlassView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                className="rounded-[24px] overflow-hidden shadow-sm dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
            >
                {/* Header Area */}
                <View className="px-5 py-4 border-b border-black/5 dark:border-white/5">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <MapPin size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[12px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                My PCS Dashboard
                            </Text>
                            <Text className="text-lg font-black tracking-tight text-slate-900 dark:text-white" numberOfLines={1}>
                                {activeOrder?.gainingCommand?.name || 'Awaiting Orders'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Body Area */}
                <View className="px-5 py-5 gap-6">

                    {/* Track Progress Map */}
                    <View>
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                                Phase {activePhaseNum}: <Text className="font-semibold text-slate-600 dark:text-slate-400">{activePhaseConfig?.title}</Text>
                            </Text>
                        </View>

                        {/* Node Timeline Visual */}
                        <View className="flex-row items-center justify-between px-2">
                            {UCT_PHASES.map((config, index) => {
                                const status = uctStatus[config.phase];
                                const isLast = index === UCT_PHASES.length - 1;
                                return (
                                    <React.Fragment key={config.phase}>
                                        <NodeDot status={status} active={config.phase === activePhaseNum} />
                                        {!isLast && <NodeLine status={status} />}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    </View>

                    {/* Financial Summary */}
                    {activePhaseNum >= 2 && (
                        <View className="bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-100 dark:border-slate-800/50">
                            <View className="flex-row items-center gap-3 mb-2">
                                <Package size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                                <Text className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    Financial Snapshot
                                </Text>
                            </View>
                            <View className="flex-row justify-between items-baseline">
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium">Est. Entitlements</Text>
                                <Text className="text-slate-900 dark:text-white text-lg font-black font-mono tracking-tighter">
                                    ${totalEntitlements.toFixed(2)}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* Next Action Hook */}
                    {nextAction ? (
                        <TouchableOpacity
                            onPress={() => {
                                if (nextAction.actionRoute) {
                                    router.push(nextAction.actionRoute as any);
                                }
                            }}
                            activeOpacity={0.7}
                            className="mt-2 rounded-[20px] overflow-hidden border border-blue-500/20 dark:border-blue-400/30 shadow-sm"
                        >
                            <LinearGradient
                                colors={isDark ? ['rgba(59,130,246,0.15)', 'rgba(37,99,235,0.05)'] : ['rgba(219,234,254,0.6)', 'rgba(191,219,254,0.3)']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <View className="flex-row items-center justify-between p-4">
                                    <View className="flex-row items-center gap-4 flex-1">
                                        <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 items-center justify-center shadow-inner">
                                            <ArrowRight size={22} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.5} />
                                        </View>
                                        <View className="flex-1 pr-4">
                                            <Text className="text-blue-700 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest mb-1 opacity-80">
                                                Next Action Required
                                            </Text>
                                            <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-bold leading-tight tracking-tight" numberOfLines={2}>
                                                {nextAction.label}
                                            </Text>
                                        </View>
                                    </View>
                                    <ArrowRight size={20} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.5} />
                                </View>
                            </LinearGradient>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-4 flex-row items-center justify-center gap-2">
                            <CheckCircle2 size={16} color={isDark ? '#4ade80' : '#16a34a'} />
                            <Text className="text-slate-600 dark:text-slate-400 text-sm font-medium">All tasks complete for this phase</Text>
                        </View>
                    )}

                    {/* ── Expandable Upcoming Tasks ── */}
                    {upcomingTasksCount > 0 && (
                        <View className="mt-1">
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
                                <View
                                    onLayout={(e) => setAccordionContentHeight(e.nativeEvent.layout.height)}
                                    style={{ position: 'absolute', top: 0, left: 0, right: 0 }}
                                >
                                    {groupedUpcomingTasks.map(({ cluster, tasks }, index) => (
                                        <View key={cluster} className={index < groupedUpcomingTasks.length - 1 ? 'mb-2' : ''}>
                                            <TaskClusterHeader
                                                type={cluster}
                                                title={cluster === 'admin' ? 'Reviews & Approvals' : cluster === 'medical' ? 'Medical & Screenings' : cluster === 'logistics' ? 'Logistics & Finances' : 'Operations & Transit'}
                                                isDark={isDark}
                                            />
                                            <View className="bg-white/40 dark:bg-slate-800/40 rounded-[16px] overflow-hidden border border-black/5 dark:border-white/5">
                                                {tasks.map((task, idx) => (
                                                    <ScalePressable
                                                        key={task.id}
                                                        disabled={task.isLocked || !task.actionRoute}
                                                        onPress={() => {
                                                            if (!task.isLocked && task.actionRoute) {
                                                                router.push(task.actionRoute as any);
                                                            }
                                                        }}
                                                        className={`flex-row items-center py-3 px-3 ${idx < tasks.length - 1 ? 'border-b border-slate-200/50 dark:border-slate-700/50' : ''}`}
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
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </Animated.View>
                        </View>
                    )}

                </View>
            </GlassView>
        </View>
    );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function NodeDot({ status, active }: { status: UCTNodeStatus; active: boolean }) {
    const isDark = useColorScheme() === 'dark';

    if (active) {
        return (
            <View className="w-4 h-4 rounded-full bg-blue-500 items-center justify-center shadow-sm">
                <View className="w-1.5 h-1.5 rounded-full bg-white" />
            </View>
        );
    }
    if (status === 'COMPLETED') {
        return <CheckCircle2 size={18} color={isDark ? '#60A5FA' : '#3B82F6'} />;
    }

    return <CircleDashed size={16} color={isDark ? '#475569' : '#CBD5E1'} />;
}

function NodeLine({ status }: { status: UCTNodeStatus }) {
    const isDark = useColorScheme() === 'dark';
    const isActiveOrCompleted = status === 'COMPLETED' || status === 'ACTIVE';

    return (
        <View className={`flex-1 h-0.5 mx-2 ${isActiveOrCompleted ? 'bg-blue-500/50' : 'bg-slate-200 dark:bg-slate-700'}`} />
    );
}
