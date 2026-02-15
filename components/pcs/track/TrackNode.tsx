import { useColorScheme } from '@/components/useColorScheme';
import { UCTNodeStatus, UCTPhase } from '@/types/pcs';
import * as Haptics from 'expo-haptics';
import { CheckCircle, Lock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Animated, {
    FadeIn,
    LinearTransition,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface TrackNodeProps {
    phase: UCTPhase;
    title: string;
    dateRange?: string;
    daysIndicator?: string;
    status: UCTNodeStatus;
    isLast?: boolean;
    children?: React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const ICON_SIZE = 40;

function StatusIcon({ status, isDark }: { status: UCTNodeStatus; isDark: boolean }) {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle size={20} color="white" />;
        case 'ACTIVE':
            return <MapPin size={18} color="#C5A455" />;
        case 'LOCKED':
            return <Lock size={16} color={isDark ? '#94a3b8' : '#9ca3af'} />;
    }
}

function iconContainerStyle(status: UCTNodeStatus, isDark: boolean) {
    switch (status) {
        case 'COMPLETED':
            return { backgroundColor: '#22c55e' }; // green-500
        case 'ACTIVE':
            return {
                backgroundColor: isDark ? '#2563eb' : '#1d4ed8', // blue-600 / blue-700
                borderWidth: 2,
                borderColor: '#bfdbfe', // blue-200
            };
        case 'LOCKED':
            return { backgroundColor: isDark ? '#334155' : '#e2e8f0' }; // slate-700 / slate-200
    }
}

function lineColorStyle(status: UCTNodeStatus, isDark: boolean) {
    return status === 'COMPLETED'
        ? { backgroundColor: '#22c55e' } // green-500
        : { backgroundColor: isDark ? '#334155' : '#e2e8f0' }; // slate-700 / slate-200
}

function titleColorValue(status: UCTNodeStatus, isDark: boolean): string {
    if (status === 'LOCKED') {
        return isDark ? '#64748b' : '#94a3b8'; // slate-500 / slate-400
    }
    return isDark ? '#ffffff' : '#0f172a'; // white / slate-900
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function TrackNode({
    phase,
    title,
    dateRange,
    daysIndicator,
    status,
    isLast = false,
    children,
}: TrackNodeProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // ── Local expand state ──────────────────────────────────────────────────
    const [expanded, setExpanded] = useState(status === 'ACTIVE');

    // Sync expanded state when status changes (e.g. demo override)
    useEffect(() => {
        setExpanded(status === 'ACTIVE');
    }, [status]);

    // ── Locked toast message ────────────────────────────────────────────────
    const [lockedToast, setLockedToast] = useState<string | null>(null);

    // Auto-dismiss locked toast
    useEffect(() => {
        if (!lockedToast) return;
        const t = setTimeout(() => setLockedToast(null), 2500);
        return () => clearTimeout(t);
    }, [lockedToast]);

    // ── Shake animation ────────────────────────────────────────────────────
    const shakeX = useSharedValue(0);

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }],
    }));

    const triggerShake = useCallback(() => {
        shakeX.value = withSequence(
            withTiming(-10, { duration: 50 }),
            withTiming(10, { duration: 50 }),
            withTiming(-5, { duration: 50 }),
            withTiming(0, { duration: 50 }),
        );
    }, [shakeX]);

    // ── Press handler ──────────────────────────────────────────────────────
    const handlePress = useCallback(() => {
        if (status === 'LOCKED') {
            triggerShake();
            if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            setLockedToast(
                phase > 1
                    ? `Complete Phase ${phase - 1} to unlock`
                    : 'Complete previous requirements to unlock',
            );
            return;
        }

        if (status === 'COMPLETED') {
            if (Platform.OS !== 'web') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            setExpanded((prev) => !prev);
        }
        // ACTIVE is always expanded — press does nothing extra
    }, [status, phase, triggerShake]);

    // ── Opacity per state ──────────────────────────────────────────────────
    const nodeOpacity =
        status === 'COMPLETED' ? 0.6 : status === 'LOCKED' ? 0.5 : 1;

    // ── Show content? ──────────────────────────────────────────────────────
    const showContent =
        status === 'ACTIVE' || (status === 'COMPLETED' && expanded);

    // ── Title color ────────────────────────────────────────────────────────
    const titleStyle = { color: titleColorValue(status, isDark) };

    return (
        <Animated.View
            layout={LinearTransition.duration(300)}
            style={{ opacity: nodeOpacity }}
            className="px-4"
        >
            <View className="flex-row relative">
                {/* ──── LEFT COLUMN: Track Line + Icon ──── */}
                <View className="mr-4 items-center z-10" style={{ width: ICON_SIZE }}>
                    {/* Icon Circle */}
                    <View
                        className="rounded-full items-center justify-center"
                        style={[{ width: ICON_SIZE, height: ICON_SIZE }, iconContainerStyle(status, isDark)]}
                    >
                        <StatusIcon status={status} isDark={isDark} />
                    </View>

                    {/* Vertical Connecting Line */}
                    {!isLast && (
                        <View
                            className="w-1 flex-1 mt-2"
                            style={[{ minHeight: 24 }, lineColorStyle(status, isDark)]}
                        />
                    )}
                </View>

                {/* ──── RIGHT COLUMN: Content ──── */}
                <Animated.View style={[shakeStyle, { flex: 1 }]}>
                    <Pressable onPress={handlePress} className="pb-6">
                        {/* Title */}
                        <Text className="text-xl font-black" style={titleStyle}>{title}</Text>

                        {/* Date Range + Days Indicator */}
                        {(dateRange || daysIndicator) && (
                            <View className="flex-row items-center mt-0.5 flex-wrap">
                                {dateRange && (
                                    <Text className="text-sm text-slate-500 font-medium mr-2">
                                        {dateRange}
                                    </Text>
                                )}
                                {daysIndicator && status !== 'COMPLETED' && (
                                    <View className="bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                                        <Text className="text-xs font-semibold text-blue-700 dark:text-blue-300">
                                            {daysIndicator}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {/* Locked Toast */}
                        {lockedToast && (
                            <Animated.View entering={FadeIn.duration(200)}>
                                <Text className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-2">
                                    {lockedToast}
                                </Text>
                            </Animated.View>
                        )}

                        {/* ──── Expandable Content ──── */}
                        {showContent && children && (
                            <Animated.View
                                entering={FadeIn.delay(150).duration(300)}
                                className="mt-4"
                            >
                                {status === 'ACTIVE' ? (
                                    /* Glass card for active state */
                                    <View className="bg-white/95 dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                                        {children}
                                    </View>
                                ) : (
                                    /* Read-only receipt for completed state */
                                    <View className="rounded-xl p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                                        {children}
                                    </View>
                                )}
                            </Animated.View>
                        )}
                    </Pressable>
                </Animated.View>
            </View>
        </Animated.View>
    );
}
