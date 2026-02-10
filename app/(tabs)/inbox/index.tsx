import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { MessageCard } from '@/components/inbox/MessageCard';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import { useInboxStore } from '@/store/useInboxStore';
import type { InboxMessage } from '@/types/inbox';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

// Create Animated SectionList
type InboxSection = { title: string; data: InboxMessage[] };
type AnimatedInboxSectionListProps = React.ComponentProps<typeof SectionList<InboxMessage, InboxSection>>;
const AnimatedSectionList = Animated.createAnimatedComponent(
    SectionList as React.ComponentType<AnimatedInboxSectionListProps>
) as React.ComponentType<AnimatedInboxSectionListProps>;

type FilterType = 'All' | 'Official' | 'My Status' | 'Pinned';
const MAX_FILTER_MESSAGES = 500;
const MIN_FILTER_PINNED_HEIGHT = 52;

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const formatDTG = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const dd = date.getUTCDate().toString().padStart(2, '0');
        const hh = date.getUTCHours().toString().padStart(2, '0');
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const mon = MONTHS[date.getUTCMonth()];
        const yy = date.getUTCFullYear().toString().slice(-2);
        return `${dd}${hh}${mm}Z ${mon} ${yy}`;
    } catch (e) {
        return '';
    }
};

export default function InboxScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { messages, fetchMessages, isLoading, togglePin } = useInboxStore();
    const router = useRouter();
    const [, startTransition] = useTransition();
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterHeight, setFilterHeight] = useState(0);
    const lastNonZeroFilterHeight = useRef(0);

    const searchConfig = useMemo(() => ({
        visible: true,
        onChangeText: setSearchQuery,
        placeholder: 'Search messages...',
        value: searchQuery
    }), [searchQuery]);

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleRefresh = useCallback(() => {
        fetchMessages({ force: true });
    }, [fetchMessages]);

    // Performance: Use stable callback to prevent MessageCard re-renders
    const handlePress = useCallback((id: string) => {
        router.push(`/inbox/${id}`);
    }, [router]);

    const renderMessageItem = useCallback(({ item }: { item: InboxMessage }) => (
        <MessageCard
            message={item}
            // Pass stable handler to enable React.memo optimization
            onPress={handlePress}
            onTogglePin={togglePin}
        />
    ), [handlePress, togglePin]);

    const renderSectionHeader = useCallback(({ section: { title } }: { section: { title: string } }) => (
        <View className="px-4 py-2 bg-slate-100 dark:bg-slate-900">
            <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">{title}</Text>
        </View>
    ), []);

    const filterableMessages = useMemo(
        () => messages.slice(0, MAX_FILTER_MESSAGES),
        [messages]
    );

    const filteredMessages = useMemo(() => {
        return filterableMessages.filter(msg => {
            // Text Search
            if (searchQuery) {
                const query = searchQuery.toUpperCase();
                const dtg = formatDTG(msg.timestamp);
                const matchesText =
                    msg.subject.toUpperCase().includes(query) ||
                    msg.body.toUpperCase().includes(query) ||
                    dtg.includes(query);

                if (!matchesText) return false;
            }

            switch (activeFilter) {
                case 'Official':
                    return msg.type === 'NAVADMIN' || msg.type === 'ALNAV';
                case 'My Status':
                    return msg.type === 'STATUS_REPORT' || msg.type === 'GENERAL_ADMIN';
                case 'Pinned':
                    return msg.isPinned;
                default:
                    return true;
            }
        });
    }, [filterableMessages, activeFilter, searchQuery]);

    const sections = useMemo<InboxSection[]>(() => {
        // Optimized: Single pass categorization without redundant sorting.
        // Relies on filteredMessages already being sorted by date (desc) from useInboxStore.
        const pinned: typeof filteredMessages = [];
        const unread: typeof filteredMessages = [];
        const read: typeof filteredMessages = [];

        for (const m of filteredMessages) {
            if (m.isPinned) {
                pinned.push(m);
            } else if (!m.isRead) {
                unread.push(m);
            } else {
                read.push(m);
            }
        }

        const result: InboxSection[] = [];

        if (pinned.length > 0) {
            result.push({ title: 'Quick Reference', data: pinned });
        }

        if (unread.length > 0) {
            result.push({ title: 'Unread', data: unread });
        }

        if (read.length > 0) {
            result.push({ title: 'Read', data: read });
        }

        return result;
    }, [filteredMessages]);

    const renderHeader = () => (
        <View
            className="px-4 pb-3 bg-white dark:bg-black border-slate-200 dark:border-slate-800"
            onLayout={(e) => {
                const measuredHeight = Math.round(e.nativeEvent.layout.height);
                if (measuredHeight <= 0) {
                    return;
                }

                lastNonZeroFilterHeight.current = measuredHeight;
                setFilterHeight((previousHeight) =>
                    previousHeight === measuredHeight ? previousHeight : measuredHeight
                );
            }}
        >
            <View
                className="flex-row justify-between bg-slate-100 dark:bg-slate-900 p-1 rounded-lg mt-2"
                accessibilityRole="tablist"
            >
                {(['All', 'Official', 'My Status', 'Pinned'] as FilterType[]).map((filter) => (
                    <Pressable
                        key={filter}
                        onPress={() => startTransition(() => {
                            setActiveFilter(prev => (prev === filter ? prev : filter));
                        })}
                        accessibilityRole="tab"
                        accessibilityLabel={filter}
                        accessibilityState={{ selected: activeFilter === filter }}
                        style={[
                            styles.filterButton,
                            activeFilter === filter
                                ? (isDark ? styles.filterButtonActiveDark : styles.filterButtonActiveLight)
                                : null,
                        ]}
                    >
                        <Text
                            style={[
                                styles.filterText,
                                activeFilter === filter
                                    ? (isDark ? styles.filterTextActiveDark : styles.filterTextActiveLight)
                                    : (isDark ? styles.filterTextInactiveDark : styles.filterTextInactiveLight),
                            ]}
                        >
                            {filter}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? '#0f172a' : '#f8fafc'}
                topBar={
                    <View className="bg-slate-50 dark:bg-black">
                        <ScreenHeader
                            title=""
                            subtitle=""
                            withSafeArea={false}
                            searchConfig={searchConfig}
                        />
                        {renderHeader()}
                    </View>
                }
                snapBehavior="none"
                minTopBarHeight={Math.max(filterHeight || lastNonZeroFilterHeight.current, MIN_FILTER_PINNED_HEIGHT)}
            >
                {({
                    onScroll,
                    onScrollBeginDrag,
                    onScrollEndDrag,
                    onLayout,
                    onContentSizeChange,
                    scrollEnabled,
                    scrollEventThrottle,
                    contentContainerStyle,
                }) => (
                    <AnimatedSectionList
                        sections={sections}
                        initialNumToRender={10}
                        windowSize={5}
                        scrollEventThrottle={scrollEventThrottle}
                        contentInsetAdjustmentBehavior="never"
                        automaticallyAdjustContentInsets={false}
                        bounces={true}
                        alwaysBounceVertical={true}
                        overScrollMode="always"
                        renderItem={renderMessageItem}
                        renderSectionHeader={renderSectionHeader}
                        keyExtractor={item => item.id}
                        stickySectionHeadersEnabled={false} // Sticky headers with sticky list header can be tricky, verifying without first
                        contentContainerStyle={contentContainerStyle}
                        refreshing={isLoading}
                        onRefresh={handleRefresh}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        ListEmptyComponent={
                            <View className="p-8 items-center">
                                <Text className="text-slate-400 dark:text-slate-500 text-center">No messages found.</Text>
                            </View>
                        }
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                    />
                )}
            </CollapsibleScaffold>
        </ScreenGradient>
    );
}

const styles = StyleSheet.create({
    filterButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 6,
        borderRadius: 8,
    },
    filterButtonActiveLight: {
        backgroundColor: '#ffffff',
    },
    filterButtonActiveDark: {
        backgroundColor: '#475569',
    },
    filterText: {
        fontSize: 12,
        fontWeight: '600',
    },
    filterTextActiveLight: {
        color: '#0f172a',
    },
    filterTextActiveDark: {
        color: '#ffffff',
    },
    filterTextInactiveLight: {
        color: '#64748b',
    },
    filterTextInactiveDark: {
        color: '#94a3b8',
    },
});
