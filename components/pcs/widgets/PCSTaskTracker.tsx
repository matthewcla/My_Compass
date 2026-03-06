import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CheckCircle2, ChevronRight, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * PCS Task Tracker — "Am I on track?"
 *
 * Standalone progress summary widget:
 * 1. Progress bar with task count + percentage
 * 2. Next action CTA with navigation
 */
export function PCSTaskTracker() {
    const checklist = usePCSStore((s) => s.checklist);
    const activeOrder = useActiveOrder();
    const router = useRouter();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const stats = useMemo(() => {
        if (!activeOrder || checklist.length === 0) return null;

        const completed = checklist.filter((c) => c.status === 'COMPLETE').length;
        const total = checklist.length;
        const progress = total > 0 ? completed / total : 0;

        // Next action: first incomplete item (prefer items with actionRoute)
        const nextAction = checklist
            .filter((c) => c.status !== 'COMPLETE')
            .sort((a, b) => {
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            })[0] ?? null;

        return { completed, total, progress, nextAction };
    }, [activeOrder, checklist]);

    if (!stats) return null;

    const { completed, total, progress, nextAction } = stats;

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
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5">Task Tracker</Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>{completed} of {total} Complete</Text>
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
                            <Pressable
                                onPress={() => {
                                    if (nextAction.actionRoute) {
                                        router.push(nextAction.actionRoute as any);
                                    }
                                }}
                                className="flex-row items-center bg-blue-500/10 rounded-[16px] px-4 py-3.5 border border-blue-500/20 shadow-sm"
                            >
                                <Zap size={16} color={isDark ? '#60A5FA' : '#2563EB'} fill={isDark ? '#60A5FA30' : '#2563EB30'} />
                                <Text
                                    className="flex-1 text-[14px] font-bold text-blue-700 dark:text-blue-300 ml-2.5"
                                    numberOfLines={1}
                                >
                                    {nextAction.label}
                                </Text>
                                {nextAction.actionRoute && (
                                    <View className="w-8 h-8 rounded-full bg-blue-500/10 dark:bg-blue-500/20 items-center justify-center ml-2 border border-blue-500/20">
                                        <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.5} />
                                    </View>
                                )}
                            </Pressable>
                        )}
                    </View>
                </View>
            </GlassView>
        </Animated.View>
    );
}
