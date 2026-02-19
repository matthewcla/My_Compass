import { useColorScheme } from '@/components/useColorScheme';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { getShadow } from '@/utils/getShadow';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Heart, HelpCircle, Star, X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type DiscoveryBadgeCategory = 'wow' | 'liked' | 'passed' | 'remaining';

interface DiscoveryStatusCardProps {
    onBadgeTap?: (category: DiscoveryBadgeCategory, count: number) => void;
    onStartExploring?: () => void;
}

/**
 * DiscoveryStatusCard — Surfaces swipe progress stats on the Home Hub.
 * Mode-aware: light blue tint in light mode, dark navy in dark mode.
 * Zero-state: inviting CTA to start exploring.
 * Active-state: tappable badge grid navigating to filtered discovery.
 */
export function DiscoveryStatusCard({ onBadgeTap, onStartExploring }: DiscoveryStatusCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const scale = useSharedValue(1);

    const realDecisions = useAssignmentStore(state => state.realDecisions);
    const billets = useAssignmentStore(state => state.billets);

    const stats = useMemo(() => {
        const total = Object.keys(billets).length;
        let slated = 0;
        let saved = 0;
        let passed = 0;

        Object.values(realDecisions).forEach(decision => {
            if (decision === 'super') slated++;
            else if (decision === 'like') saved++;
            else if (decision === 'nope') passed++;
            // 'defer' intentionally not counted — deferred billets re-appear
            // in the deck, so they count as remaining
        });

        const remaining = total - (slated + saved + passed);
        return { total, slated, saved, passed, remaining };
    }, [realDecisions, billets]);

    const hasActivity = stats.slated + stats.saved + stats.passed > 0;
    const hasBillets = stats.total > 0;

    const animatedButtonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <View
            className="rounded-2xl relative overflow-hidden"
            style={{
                borderWidth: 1,
                borderColor: isDark
                    ? 'rgba(51, 65, 85, 0.6)'
                    : 'rgba(191, 219, 254, 0.8)', // blue-200/80
                ...getShadow({
                    shadowColor: isDark ? '#3B82F6' : '#93C5FD',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDark ? 0.25 : 0.2,
                    shadowRadius: 16,
                    elevation: 6,
                }),
            }}
        >
            <LinearGradient
                colors={isDark
                    ? ['#1e293b', '#0f172a']       // slate-800 → slate-900
                    : ['#EFF6FF', '#DBEAFE']        // blue-50 → blue-100
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
            />

            {/* Header */}
            <View className="relative z-10 px-5 pt-5 pb-1">
                <Text className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Billet Explorer
                </Text>
                <Text className={`text-[11px] font-medium mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {hasActivity
                        ? 'Tap a category to review your picks.'
                        : 'Swipe through billets to build your shortlist.'}
                </Text>
            </View>

            {/* Badge Grid — always visible when billets are loaded */}
            {hasBillets && (
                <View className="relative z-10 flex-row px-5 pt-3 pb-3 gap-3">
                    <StatBadge
                        icon={<Star size={16} color={isDark ? '#60a5fa' : '#2563EB'} />}
                        count={stats.slated}
                        label="WOW!"
                        isDark={isDark}
                        bg={isDark ? 'rgba(59,130,246,0.25)' : 'rgba(59,130,246,0.1)'}
                        textColor={isDark ? '#93C5FD' : '#1D4ED8'}
                        onPress={() => onBadgeTap?.('wow', stats.slated)}
                    />
                    <StatBadge
                        icon={<Heart size={16} color={isDark ? '#4ADE80' : '#16A34A'} />}
                        count={stats.saved}
                        label="Liked"
                        isDark={isDark}
                        bg={isDark ? 'rgba(34,197,94,0.25)' : 'rgba(34,197,94,0.1)'}
                        textColor={isDark ? '#86EFAC' : '#15803D'}
                        onPress={() => onBadgeTap?.('liked', stats.saved)}
                    />
                    <StatBadge
                        icon={<X size={16} color={isDark ? '#F87171' : '#DC2626'} />}
                        count={stats.passed}
                        label="Passed"
                        isDark={isDark}
                        bg={isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.08)'}
                        textColor={isDark ? '#FCA5A5' : '#B91C1C'}
                        onPress={() => onBadgeTap?.('passed', stats.passed)}
                    />
                    <StatBadge
                        icon={<HelpCircle size={16} color={isDark ? '#94A3B8' : '#64748B'} />}
                        count={stats.remaining}
                        label="Left"
                        isDark={isDark}
                        bg={isDark ? 'rgba(148,163,184,0.2)' : 'rgba(100,116,139,0.08)'}
                        textColor={isDark ? '#CBD5E1' : '#475569'}
                        onPress={() => onBadgeTap?.('remaining', stats.remaining)}
                    />
                </View>
            )}

            {/* Start Exploring CTA — shown when no swipes yet */}
            {!hasActivity && (
                <View className="relative z-10 px-5 pb-5">
                    <Pressable
                        onPress={onStartExploring}
                        onPressIn={() => { scale.value = withSpring(0.97); }}
                        onPressOut={() => { scale.value = withSpring(1); }}
                    >
                        <Animated.View style={animatedButtonStyle}>
                            <View
                                className="w-full py-3.5 rounded-xl flex-row items-center justify-center gap-2"
                                style={{
                                    backgroundColor: isDark
                                        ? 'rgba(59, 130, 246, 0.15)'
                                        : 'rgba(37, 99, 235, 0.1)',
                                    borderWidth: 1,
                                    borderColor: isDark
                                        ? 'rgba(59, 130, 246, 0.3)'
                                        : 'rgba(37, 99, 235, 0.25)',
                                }}
                            >
                                <Text className={`font-bold text-base ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                                    Start Exploring
                                </Text>
                                <ArrowRight size={16} color={isDark ? '#60a5fa' : '#1D4ED8'} />
                            </View>
                        </Animated.View>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

/* ─── Stat Badge ───────────────────────────────────────────────────────────── */

function StatBadge({
    icon,
    count,
    label,
    isDark,
    bg,
    textColor,
    onPress,
}: {
    icon: React.ReactNode;
    count: number;
    label: string;
    isDark: boolean;
    bg: string;
    textColor: string;
    onPress?: () => void;
}) {
    const isEmpty = count === 0;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isEmpty}
            activeOpacity={0.7}
            className="flex-1 rounded-xl py-3 items-center"
            style={[
                { backgroundColor: bg },
                isEmpty ? { opacity: 0.35 } : undefined,
            ]}
        >
            {icon}
            <Text style={{ color: textColor }} className="text-xl font-black mt-1">{count}</Text>
            <Text className={`text-[10px] font-semibold uppercase tracking-wider mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}
