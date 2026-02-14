import { GlassView } from '@/components/ui/GlassView';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { ChevronRight, MapPin, Zap } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * PCS Hero Banner — "Where Am I?"
 *
 * Glanceable card answering a Sailor's three key PCS questions:
 * 1. Where am I going and when do I report?
 * 2. Am I on track? (progress %)
 * 3. What's my next action?
 */
export function PCSHeroBanner() {
    const activeOrder = useActiveOrder();
    const checklist = usePCSStore((s) => s.checklist);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const stats = useMemo(() => {
        if (!activeOrder || checklist.length === 0) return null;

        const completed = checklist.filter((c) => c.status === 'COMPLETE').length;
        const total = checklist.length;
        const progress = total > 0 ? completed / total : 0;

        // Days until report NLT
        const reportDate = new Date(activeOrder.reportNLT);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        reportDate.setHours(0, 0, 0, 0);
        const diffMs = reportDate.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

        // Format report date
        const reportFormatted = reportDate.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });

        // Next action: first incomplete item (prefer items with actionRoute)
        const nextAction = checklist
            .filter((c) => c.status !== 'COMPLETE')
            .sort((a, b) => {
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            })[0] ?? null;

        return { completed, total, progress, daysRemaining, reportFormatted, nextAction };
    }, [activeOrder, checklist]);

    if (!stats || !activeOrder) return null;

    const { completed, total, progress, daysRemaining, reportFormatted, nextAction } = stats;

    // Urgency color: green → amber → red
    const urgencyColor =
        daysRemaining > 60
            ? isDark ? '#4ADE80' : '#16A34A'
            : daysRemaining > 21
                ? isDark ? '#FBBF24' : '#D97706'
                : isDark ? '#F87171' : '#DC2626';

    return (
        <Animated.View entering={FadeIn.duration(400).delay(100)}>
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="mx-4 mb-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden"
            >
                {/* ── Top section: Destination + Countdown ── */}
                <View className="bg-[#0A1628] p-5 pb-4">
                    <View className="flex-row items-center mb-2">
                        <MapPin size={16} color="#C9A227" />
                        <Text className="text-xs font-semibold uppercase tracking-widest text-slate-400 ml-2">
                            PCS Destination
                        </Text>
                    </View>

                    <Text className="text-xl font-black text-white mb-1" numberOfLines={1}>
                        {activeOrder.gainingCommand.name}
                    </Text>

                    <View className="flex-row items-center justify-between">
                        <Text className="text-sm text-slate-400 font-medium">
                            Report NLT {reportFormatted}
                        </Text>
                        <View
                            className="px-3 py-1 rounded-full"
                            style={{ backgroundColor: `${urgencyColor}20` }}
                        >
                            <Text style={{ color: urgencyColor }} className="text-sm font-bold">
                                {daysRemaining} days
                            </Text>
                        </View>
                    </View>
                </View>

                {/* ── Progress bar section ── */}
                <View className="px-5 pt-4 pb-3">
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
                        className="mx-5 mb-4 mt-1 flex-row items-center bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3 border border-blue-100 dark:border-blue-800/50"
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
