import { GlassView } from '@/components/ui/GlassView';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { ChevronRight, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
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
    const colorScheme = useColorScheme();
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
                className="mx-4 mb-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
            >
                {/* ── Progress bar section ── */}
                <View className="px-5 pt-5 pb-4">
                    <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                            {completed} of {total} tasks complete
                        </Text>
                        <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                            {Math.round(progress * 100)}%
                        </Text>
                    </View>

                    {/* Track */}
                    <View className="h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
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
                        className="mx-5 mb-4 mt-2 flex-row items-center bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3 border border-blue-100 dark:border-blue-800/50"
                    >
                        <Zap size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                        <Text
                            className="flex-1 text-sm font-semibold text-blue-700 dark:text-blue-300 ml-2"
                            numberOfLines={1}
                        >
                            {nextAction.label}
                        </Text>
                        {nextAction.actionRoute && (
                            <ChevronRight size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                        )}
                    </Pressable>
                )}
            </GlassView>
        </Animated.View>
    );
}
