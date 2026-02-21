/**
 * ProfileTimelineTab
 *
 * Chronological audit trail of all changes to a sailor's digital profile.
 * Renders as a tab within My Profile alongside Professional and Personal.
 *
 * Design Standards Compliance:
 * - §1.1 Glass Cockpit: Dense, scannable entries
 * - §3.4 Glass Card Style: Standard card container
 * - §4.2 Enter/Exit: FadeInUp stagger
 * - §4.4 Haptics: Light impact on filter tap
 * - §2.2.5 Touch Targets: 44pt chips, 56pt rows
 * - §6.2 Styling: NativeWind className + useColorScheme
 * - §6.4 No HTML: React Native primitives only
 */

import { ControlPill } from '@/components/profile/ProfileHelpers';
import {
    useFilteredTimelineEvents,
    useProfileTimelineStore,
    useTimelineCategoryCounts,
} from '@/store/useProfileTimelineStore';
import { CATEGORY_CONFIG, ProfileEventCategory } from '@/types/profileTimeline';
import * as Haptics from 'expo-haptics';
import {
    Anchor,
    Award,
    Baby,
    ChevronUp,
    Flag,
    GraduationCap,
    Hash,
    Heart,
    Home,
    Phone,
    Shield,
    Truck,
} from 'lucide-react-native';
import React, { memo, useCallback, useMemo } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

// ─── Icon Resolver ───────────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
    Anchor, Award, Baby, ChevronUp, Flag, GraduationCap,
    Hash, Heart, Home, Phone, Shield, Truck,
};

function resolveIcon(name: string, size: number, color: string): React.ReactNode {
    const IconComponent = ICON_MAP[name];
    if (!IconComponent) return null;
    return <IconComponent size={size} color={color} />;
}

// ─── Filter Chips ────────────────────────────────────────────

const FILTER_OPTIONS: Array<{ key: ProfileEventCategory | 'ALL'; label: string }> = [
    { key: 'ALL', label: 'All' },
    { key: 'ASSIGNMENT', label: 'Assignments' },
    { key: 'DEPENDENT', label: 'Dependents' },
    { key: 'CREDENTIAL', label: 'Credentials' },
    { key: 'TRAINING', label: 'Training' },
    { key: 'NEC', label: 'NECs' },
    { key: 'MILESTONE', label: 'Milestones' },
    { key: 'RANK', label: 'Advancement' },
];

// ─── Timeline Event Row ─────────────────────────────────────

interface TimelineEventRowProps {
    event: {
        id: string;
        date: string;
        category: ProfileEventCategory;
        title: string;
        subtitle: string;
        detail?: string;
        iconName: string;
        accentColor: string;
        isFuture?: boolean;
    };
    isDark: boolean;
    isLast: boolean;
    index: number;
}

const TimelineEventRow = memo(function TimelineEventRow({
    event, isDark, isLast, index,
}: TimelineEventRowProps) {
    const formattedDate = useMemo(() => {
        try {
            const d = new Date(event.date);
            return d.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
            });
        } catch {
            return event.date;
        }
    }, [event.date]);

    const categoryLabel = CATEGORY_CONFIG[event.category]?.label ?? event.category;

    return (
        <Animated.View
            entering={FadeIn.delay(Math.min(index * 40, 400)).duration(300)}
        >
            <View style={{
                flexDirection: 'row',
                opacity: event.isFuture ? 0.55 : 1,
                minHeight: 56,
            }}>
                {/* ── Left column: dot + line ── */}
                <View style={{ width: 32, alignItems: 'center' }}>
                    {/* Dot */}
                    <View style={{
                        width: event.isFuture ? 10 : 12,
                        height: event.isFuture ? 10 : 12,
                        borderRadius: 6,
                        backgroundColor: event.accentColor,
                        marginTop: 5,
                        borderWidth: event.isFuture ? 2 : 0,
                        borderColor: event.isFuture ? (isDark ? '#475569' : '#CBD5E1') : 'transparent',
                        borderStyle: 'solid',
                    }} />
                    {/* Connecting line */}
                    {!isLast && (
                        <View style={{
                            width: 2,
                            flex: 1,
                            backgroundColor: isDark ? '#334155' : '#E2E8F0',
                            marginTop: 4,
                            ...(event.isFuture ? { borderStyle: 'dashed' as any } : {}),
                        }} />
                    )}
                </View>

                {/* ── Right column: content ── */}
                <View style={{
                    flex: 1,
                    paddingBottom: isLast ? 0 : 16,
                    marginLeft: 10,
                }}>
                    {/* Category badge + date */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                        <View style={{
                            backgroundColor: event.accentColor + '1A',
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 4,
                        }}>
                            <Text style={{
                                color: event.accentColor,
                                fontSize: 10,
                                fontWeight: '800',
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                            }}>
                                {categoryLabel}
                            </Text>
                        </View>
                        <Text style={{
                            color: isDark ? '#64748B' : '#94A3B8',
                            fontSize: 11,
                            fontWeight: '500',
                        }}>
                            {formattedDate}
                        </Text>
                        {event.isFuture && (
                            <View style={{
                                backgroundColor: isDark ? '#7C3AED20' : '#7C3AED15',
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                borderRadius: 4,
                            }}>
                                <Text style={{ color: '#7C3AED', fontSize: 9, fontWeight: '700' }}>
                                    UPCOMING
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Title */}
                    <Text style={{
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        fontSize: 15,
                        fontWeight: '600',
                    }}>
                        {event.title}
                    </Text>

                    {/* Subtitle */}
                    <Text style={{
                        color: isDark ? '#94A3B8' : '#64748B',
                        fontSize: 13,
                        marginTop: 1,
                    }} numberOfLines={2}>
                        {event.subtitle}
                    </Text>

                    {/* Detail (if present) */}
                    {event.detail && (
                        <Text style={{
                            color: isDark ? '#64748B' : '#94A3B8',
                            fontSize: 12,
                            marginTop: 2,
                        }}>
                            {event.detail}
                        </Text>
                    )}
                </View>
            </View>
        </Animated.View>
    );
});

// ─── Main Component ──────────────────────────────────────────

interface ProfileTimelineTabProps {
    isDark: boolean;
}

export const ProfileTimelineTab = memo(function ProfileTimelineTab({
    isDark,
}: ProfileTimelineTabProps) {
    const events = useFilteredTimelineEvents();
    const activeFilter = useProfileTimelineStore((s) => s.activeFilter);
    const setFilter = useProfileTimelineStore((s) => s.setFilter);
    const counts = useTimelineCategoryCounts();

    const handleFilterPress = useCallback((key: ProfileEventCategory | 'ALL') => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setFilter(key);
    }, [setFilter]);

    return (
        <View style={{ paddingHorizontal: 16 }}>
            {/* ── Filter Chips ──────────────────────────────── */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        alignItems: 'center',
                        height: 44,
                    }}
                >
                    {FILTER_OPTIONS.map((opt) => {
                        const count = counts[opt.key] || 0;
                        const isActive = activeFilter === opt.key;
                        return (
                            <ControlPill
                                key={opt.key}
                                label={`${opt.label}${count > 0 ? ` (${count})` : ''}`}
                                isActive={isActive}
                                onPress={() => handleFilterPress(opt.key)}
                                isDark={isDark}
                            />
                        );
                    })}
                </ScrollView>
            </View>

            {/* spacer between filter chips and timeline body */}
            <View style={{ height: 12 }} />

            {/* ── Timeline Body ─────────────────────────────── */}
            <View style={{
                backgroundColor: isDark
                    ? 'rgba(30, 41, 59, 0.95)'   // bg-slate-800/95
                    : 'rgba(255, 255, 255, 0.95)', // bg-white/95
                borderWidth: 1,
                borderColor: isDark
                    ? 'rgba(51, 65, 85, 0.5)'     // border-slate-700/50
                    : 'rgba(226, 232, 240, 0.5)',  // border-slate-200/50
                borderRadius: 16,
                padding: 20,
                marginBottom: 12,
            }}>
                {events.length === 0 ? (
                    /* ── Empty State ── */
                    <View style={{
                        alignItems: 'center',
                        paddingVertical: 32,
                    }}>
                        <Text style={{
                            color: isDark ? '#64748B' : '#94A3B8',
                            fontSize: 15,
                            fontWeight: '500',
                            textAlign: 'center',
                        }}>
                            No profile changes match this filter.
                        </Text>
                    </View>
                ) : (
                    /* ── Event List ── */
                    events.map((event, index) => (
                        <TimelineEventRow
                            key={event.id}
                            event={event}
                            isDark={isDark}
                            isLast={index === events.length - 1}
                            index={index}
                        />
                    ))
                )}
            </View>
        </View>
    );
});
