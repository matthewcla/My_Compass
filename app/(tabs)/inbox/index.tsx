import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';

import { ScreenHeader } from '@/components/ScreenHeader';
import { useInboxStore } from '@/store/useInboxStore';
import type { InboxMessage } from '@/types/inbox';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Mail, AlertCircle, FileText, Bookmark } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

// Create Animated SectionList
type InboxSection = { title: string; data: InboxMessage[] };
type AnimatedInboxSectionListProps = React.ComponentProps<typeof SectionList<InboxMessage, InboxSection>> & { ref?: React.Ref<any> };
const AnimatedSectionList = Animated.createAnimatedComponent(
    SectionList as React.ComponentType<AnimatedInboxSectionListProps>
) as React.ComponentType<AnimatedInboxSectionListProps>;

type FilterType = 'All' | 'My Messages' | 'Bookmarked';
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

const ListEmpty = () => (
    <View className="p-8 items-center">
        <Text className="text-outline text-center">No messages found.</Text>
    </View>
);

export default function InboxScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { messages, fetchMessages, isLoading, togglePin } = useInboxStore();
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    const themeColors = {
        primary: isDark ? '#338EF7' : '#000A23',
        secondary: isDark ? '#F5A524' : '#785A00',
        outline: isDark ? '#8E909A' : '#747780',
        background: isDark ? '#131313' : '#FFFFFF'
    };

    const getMessageIcon = (type: string) => {
        switch(type) {
            case 'NAVADMIN':
            case 'ALNAV': return <AlertCircle size={16} color={themeColors.secondary} />;
            case 'STATUS_REPORT': return <FileText size={16} color={themeColors.primary} />;
            default: return <Mail size={16} color={themeColors.outline} />;
        }
    };

    const [, startTransition] = useTransition();
    const [activeFilter, setActiveFilter] = useState<FilterType>('My Messages');
    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef<any>(null);

    // Scroll to top whenever this tab gains focus
    useFocusEffect(
        useCallback(() => {
            listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        }, [])
    );

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

    const renderMessageItem = useCallback(({ item }: { item: InboxMessage }) => {
        const isUnread = !item.isRead;
        return (
            <Pressable 
                onPress={() => handlePress(item.id)}
                className="mx-4 mb-2 p-4 rounded-sm bg-surface-container border border-outline-variant"
                style={({ pressed }) => ({
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                })}
            >
                <View className="flex-row justify-between items-start mb-2">
                    <Text className="text-[10px] font-bold tracking-wider text-outline uppercase">
                        {formatDTG(item.timestamp)}
                    </Text>
                </View>
                <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-2">
                        <View className="flex-row items-center mb-1">
                            {isUnread && <View className="w-2 h-2 rounded-full bg-primary mr-2" />}
                            <Text className={`text-base font-semibold flex-1 ${isUnread ? 'text-on-surface' : 'text-on-surface-variant'}`} numberOfLines={1}>
                                {item.subject}
                            </Text>
                        </View>
                        <Text className="text-sm text-on-surface-variant" numberOfLines={2}>
                            {item.body}
                        </Text>
                        <View className="flex-row items-center mt-1 w-full justify-between pr-2">
                            <View className="flex-row items-center">
                                {getMessageIcon(item.type)}
                                <Text className={`text-[10px] font-bold tracking-wider uppercase ml-2 ${item.type === 'NAVADMIN' || item.type === 'ALNAV' ? 'text-secondary' : item.type === 'STATUS_REPORT' ? 'text-primary' : 'text-outline'}`} numberOfLines={1}>
                                    {item.type.replace('_', ' ')}
                                </Text>
                            </View>
                        </View>
                    </View>
                    
                    {/* Pin/Bookmark Action */}
                    <Pressable
                        onPress={() => togglePin(item.id)}
                        hitSlop={12}
                        className="mt-1 p-1"
                    >
                        {item.isPinned ? (
                            <Bookmark size={20} color={themeColors.secondary} fill={themeColors.secondary} />
                        ) : (
                            <Bookmark size={20} color={themeColors.outline} />
                        )}
                    </Pressable>
                </View>
            </Pressable>
        );
    }, [handlePress, togglePin, themeColors]);

    const renderSectionHeader = useCallback(({ section: { title } }: { section: { title: string } }) => (
        <View className="px-5 py-3 bg-transparent">
            <Text className="text-xs font-bold tracking-wider text-outline uppercase">{title}</Text>
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
                case 'My Messages':
                    return msg.type === 'STATUS_REPORT' || msg.type === 'GENERAL_ADMIN';
                case 'Bookmarked':
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
        <View className="px-4 pb-3 pt-2">
            <View className="flex-row justify-between bg-surface-container-low p-1 rounded-sm border border-outline-variant">
                {(['All', 'My Messages', 'Bookmarked'] as FilterType[]).map((filter) => (
                    <Pressable
                        key={filter}
                        onPress={() => startTransition(() => {
                            setActiveFilter(prev => (prev === filter ? prev : filter));
                        })}
                        className={`flex-1 items-center py-1.5 rounded-sm border ${
                            activeFilter === filter
                                ? 'bg-surface-container-highest border-outline-variant shadow-sm'
                                : 'border-transparent'
                        }`}
                    >
                        <Text
                            className={`text-xs font-semibold ${
                                activeFilter === filter
                                    ? 'text-on-surface'
                                    : 'text-on-surface-variant'
                            }`}
                        >
                            {filter}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-background">
            <CollapsibleScaffold
                statusBarShimBackgroundColor={themeColors.background}
                topBar={
                    <View className="bg-background">
                        <ScreenHeader
                            title="Inbox"
                            subtitle=""
                            withSafeArea={false}
                            searchConfig={searchConfig}
                            showWebMenu={true}
                        />
                    </View>
                }
                snapBehavior="none"
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
                        ref={listRef}
                        sections={sections}
                        initialNumToRender={10}
                        windowSize={5}
                        scrollEventThrottle={scrollEventThrottle}
                        contentInsetAdjustmentBehavior="never"
                        automaticallyAdjustContentInsets={false}
                        bounces={true}
                        alwaysBounceVertical={true}
                        overScrollMode="always"
                        showsVerticalScrollIndicator={false}
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
                        ListHeaderComponent={renderHeader}
                        ListEmptyComponent={ListEmpty}
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                    />
                )}
            </CollapsibleScaffold>
        </View>
    );
}

