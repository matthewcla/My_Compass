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
            return <MapPin size={18} color="#0A1628" />;
        case 'LOCKED':
            return <Lock size={16} color={isDark ? '#94a3b8' : '#64748b'} />;
    }
}

function iconContainerStyle(status: UCTNodeStatus, isDark: boolean) {
    switch (status) {
        case 'COMPLETED':
            return { backgroundColor: '#16A34A', borderRadius: 0 }; // green-600, square
        case 'ACTIVE':
            return {
                backgroundColor: '#C9A227', // Athletic Gold
                borderWidth: 2,
                borderColor: '#0A1628', // Navy Border
                borderRadius: 0, // square
            };
        case 'LOCKED':
            return { backgroundColor: isDark ? '#334155' : '#E2E8F0', borderRadius: 0 }; // slate-700 / slate-200, square
    }
}

function lineColorStyle(status: UCTNodeStatus, isDark: boolean) {
    return status === 'COMPLETED'
        ? { backgroundColor: '#16A34A' } // green-600
        : { backgroundColor: isDark ? '#334155' : '#E2E8F0' }; // slate-700 / slate-200
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
                    <Pressable onPress={handlePress} className="pb-8">
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
                                    <View className="bg-primary dark:bg-blue-900/40 px-2 py-0.5 rounded-none border border-secondary dark:border-blue-400">
                                        <Text className="text-xs font-bold text-secondary dark:text-blue-300">
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
                                className="mt-5"
                            >
                                {status === 'ACTIVE' ? (
                                    /* Solid card for active state */
                                    <View className="bg-white dark:bg-slate-800 rounded-none p-5 border-2 border-slate-200 dark:border-slate-700"
                                        style={{ shadowColor: '#0A1628', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}
                                    >
                                        {children}
                                    </View>
                                ) : (
                                    /* Read-only receipt for completed state */
                                    <View className="rounded-none p-3 bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700">
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
