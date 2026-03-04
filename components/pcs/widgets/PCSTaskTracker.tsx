import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { ChevronRight, Zap } from 'lucide-react-native';
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
                className="mx-4 mb-6 rounded-2xl overflow-hidden"
                style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
            >
                <View className="bg-white/40 dark:bg-slate-950/40">
                    {/* ── Progress bar section ── */}
                    <View className="px-5 pt-5 pb-4">
                        <View className="flex-row items-center justify-between mb-3">
                            <Text className="text-[13px] font-bold tracking-tight text-slate-800 dark:text-white uppercase">
                                {completed} of {total} tasks complete
                            </Text>
                            <Text className="text-[15px] font-black tracking-tight text-blue-600 dark:text-blue-400">
                                {Math.round(progress * 100)}%
                            </Text>
                        </View>

                        {/* Track */}
                        <View className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 overflow-hidden">
                            <View
                                className="h-full rounded-full bg-blue-600 dark:bg-blue-500"
                                style={{ width: `${Math.round(progress * 100)}%` }}
                            />
                        </View>
                    </View>

                    {/* ── Next Action CTA ── */}
                    {nextAction && (
                        <Pressable
                            onPress={() => {
                                if (nextAction.actionRoute) {
                                    router.push(nextAction.actionRoute as any);
                                }
                            }}
                            className="mx-5 mb-5 flex-row items-center bg-blue-500/10 rounded-xl px-4 py-3.5 border border-blue-500/20"
                        >
                            <Zap size={16} color={isDark ? '#60A5FA' : '#2563EB'} fill={isDark ? '#60A5FA30' : '#2563EB30'} />
                            <Text
                                className="flex-1 text-[13px] font-bold text-blue-700 dark:text-blue-300 ml-2.5"
                                numberOfLines={1}
                            >
                                {nextAction.label}
                            </Text>
                            {nextAction.actionRoute && (
                                <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} strokeWidth={2.5} />
                            )}
                        </Pressable>
                    )}
                </View>
            </GlassView>
        </Animated.View>
    );
}
