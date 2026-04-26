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
    isLast: boolean;
    index: number;
}

const TimelineEventRow = memo(function TimelineEventRow({
    event, isLast, index,
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
            <View className={`flex-row min-h-[56px] ${event.isFuture ? 'opacity-55' : 'opacity-100'}`}>
                {/* ── Left column: dot + line ── */}
                <View className="w-8 items-center">
                    {/* Dot */}
                    <View className={`rounded-full mt-1.5 ${event.isFuture ? 'w-2.5 h-2.5 border-2 border-slate-400 dark:border-slate-500' : 'w-3 h-3 border-0'}`}
                        style={{ backgroundColor: event.accentColor }}
                    />
                    {/* Connecting line */}
                    {!isLast && (
                        <View className={`w-[2px] flex-1 bg-slate-200 dark:bg-slate-700 mt-1 ${event.isFuture ? 'border-dashed' : ''}`} />
                    )}
                </View>

                {/* ── Right column: content ── */}
                <View className={`flex-1 ml-2.5 ${isLast ? 'pb-0' : 'pb-4'}`}>
                    {/* Category badge + date */}
                    <View className="flex-row items-center gap-2 mb-[3px]">
                        <View className="px-1.5 py-0.5" style={{ backgroundColor: event.accentColor + '1A' }}>
                            <Text className="text-[10px] font-extrabold tracking-widest uppercase" style={{ color: event.accentColor }}>
                                {categoryLabel}
                            </Text>
                        </View>
                        <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                            {formattedDate}
                        </Text>
                        {event.isFuture && (
                            <View className="bg-purple-100 dark:bg-purple-500/20 px-1.5 py-[1px]">
                                <Text className="text-purple-600 dark:text-purple-400 text-[9px] font-bold">
                                    UPCOMING
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Title */}
                    <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-semibold">
                        {event.title}
                    </Text>

                    {/* Subtitle */}
                    <Text className="text-slate-500 dark:text-slate-400 text-[13px] mt-[1px]" numberOfLines={2}>
                        {event.subtitle}
                    </Text>

                    {/* Detail (if present) */}
                    {event.detail && (
                        <Text className="text-slate-600 dark:text-slate-500 text-xs mt-0.5">
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
}

export const ProfileTimelineTab = memo(function ProfileTimelineTab({
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
        <View className="px-4">
            {/* ── Filter Chips ──────────────────────────────── */}
            <View className="flex-row items-center">
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
                            />
                        );
                    })}
                </ScrollView>
            </View>

            {/* spacer between filter chips and timeline body */}
            <View className="h-3" />

            {/* ── Timeline Body ─────────────────────────────── */}
            <View className="bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700/50 p-5 mb-3">
                {events.length === 0 ? (
                    /* ── Empty State ── */
                    <View className="items-center py-8">
                        <Text className="text-slate-500 dark:text-slate-400 text-[15px] font-medium text-center">
                            No profile changes match this filter.
                        </Text>
                    </View>
                ) : (
                    /* ── Event List ── */
                    events.map((event, index) => (
                        <TimelineEventRow
                            key={event.id}
                            event={event}
                            isLast={index === events.length - 1}
                            index={index}
                        />
                    ))
                )}
            </View>
        </View>
    );
});
