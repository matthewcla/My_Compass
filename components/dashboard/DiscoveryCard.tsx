import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { getShadow } from '@/utils/getShadow';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Heart, HelpCircle, Star, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

interface DiscoveryStatusCardProps {
    onStartExploring?: () => void;
}

/**
 * DiscoveryStatusCard — Surfaces swipe progress stats on the Home Hub.
 * Shows breakdown: Slated (super), Saved (like), Passed (nope), Remaining.
 */
export function DiscoveryStatusCard({ onStartExploring }: DiscoveryStatusCardProps) {
    const scale = useSharedValue(1);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const realDecisions = useAssignmentStore(state => state.realDecisions);
    const billets = useAssignmentStore(state => state.billets);

    const stats = useMemo(() => {
        const total = Object.keys(billets).length;
        let slated = 0;
        let saved = 0;
        let passed = 0;
        let deferred = 0;

        Object.values(realDecisions).forEach(decision => {
            if (decision === 'super') slated++;
            else if (decision === 'like') saved++;
            else if (decision === 'nope') passed++;
            else if (decision === 'defer') deferred++;
        });

        const remaining = total - (slated + saved + passed + deferred);
        return { total, slated, saved, passed, remaining };
    }, [realDecisions, billets]);

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const handlePressIn = () => {
        scale.value = withSpring(0.98);
    };

    const handlePressOut = () => {
        scale.value = withSpring(1);
    };

    return (
        <View
            className="rounded-2xl shadow-lg relative overflow-hidden"
            style={getShadow({ shadowColor: isDark ? '#3B82F6' : '#e2e8f0', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.5, shadowRadius: 10, elevation: 5 })}
        >
            <LinearGradient
                colors={isDark ? ['#1e293b', '#020617'] : ['#0f172a', '#1e293b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View className="relative z-10 flex-row justify-between items-center px-5 pt-5 pb-3">
                <View>
                    <Text className="text-lg font-bold text-white">Discovery Mode</Text>
                    <Text className="text-slate-400 text-xs font-medium mt-0.5">
                        {stats.total} billets available
                    </Text>
                </View>
            </View>

            {/* Stats Grid */}
            <View className="relative z-10 flex-row px-5 pb-4 gap-3">
                <StatBadge
                    icon={<Star size={14} color="#3B82F6" />}
                    count={stats.slated}
                    label="Slated"
                    bg="bg-blue-500/15"
                    textColor="text-blue-400"
                />
                <StatBadge
                    icon={<Heart size={14} color="#22C55E" />}
                    count={stats.saved}
                    label="Saved"
                    bg="bg-green-500/15"
                    textColor="text-green-400"
                />
                <StatBadge
                    icon={<X size={14} color="#EF4444" />}
                    count={stats.passed}
                    label="Passed"
                    bg="bg-red-500/10"
                    textColor="text-red-400/60"
                />
                <StatBadge
                    icon={<HelpCircle size={14} color="#94A3B8" />}
                    count={stats.remaining}
                    label="Left"
                    bg="bg-slate-500/10"
                    textColor="text-slate-400"
                />
            </View>

            {/* CTA */}
            <View className="relative z-10 px-5 pb-5">
                <Pressable
                    onPress={onStartExploring}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                >
                    <Animated.View style={animatedButtonStyle}>
                        <View className="w-full bg-white dark:bg-slate-200 py-3.5 rounded-xl shadow-sm flex-row items-center justify-center gap-2">
                            <Text className="font-bold text-base text-slate-900">
                                {stats.remaining > 0 ? 'Continue Exploring' : 'Review Saved'}
                            </Text>
                            <ArrowRight size={18} color="#0f172a" />
                        </View>
                    </Animated.View>
                </Pressable>
            </View>
        </View>
    );
}

/* ─── Stat Badge ───────────────────────────────────────────────────────────── */

function StatBadge({
    icon,
    count,
    label,
    bg,
    textColor,
}: {
    icon: React.ReactNode;
    count: number;
    label: string;
    bg: string;
    textColor: string;
}) {
    return (
        <View className={`flex-1 ${bg} rounded-xl py-3 items-center`}>
            {icon}
            <Text className={`text-xl font-black mt-1 ${textColor}`}>{count}</Text>
            <Text className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{label}</Text>
        </View>
    );
}
