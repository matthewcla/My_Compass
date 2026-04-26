import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { ScalePressable } from '@/components/ScalePressable';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareerEvents } from '@/hooks/useCareerEvents';
import { CareerEvent } from '@/types/career';
import { getShadow } from '@/utils/getShadow';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { Clock, MapPin } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SectionList, SectionListProps, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList) as unknown as React.ComponentClass<
    SectionListProps<CareerEvent, { title: string; data: CareerEvent[] }>
>;

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const EventCard = React.memo(({ event }: { event: CareerEvent }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // 1. Determine Date Bubble Styling
    let bgTint = 'bg-white dark:bg-[#1c1b1b]';
    let dateClass = 'text-slate-900 dark:text-[#e5e2e1]';
    let monthClass = 'text-slate-500 dark:text-[#8e909a]';
    let borderTint = 'border-slate-200 dark:border-[#44474f]';

    if (event.eventType === 'ADVANCEMENT_EXAM') {
        bgTint = 'bg-blue-50 dark:bg-[#00204e]';
        dateClass = 'text-blue-800 dark:text-[#aec6fe]';
        monthClass = 'text-blue-600 dark:text-[#7189bc]';
        borderTint = 'border-blue-200 dark:border-[#aec6fe]/30';
    } else if (event.eventType === 'STATUTORY_BOARD') {
        bgTint = 'bg-slate-50 dark:bg-[#c6c6c7]/10'; // Tertiary Dim
        dateClass = 'text-slate-700 dark:text-[#e2e2e2]'; // Tertiary Fixed
        monthClass = 'text-slate-500 dark:text-[#888989]'; // On-Tertiary Container
        borderTint = 'border-slate-200 dark:border-[#c6c6c7]/30';
    }

    const isCritical = event.priority === 'CRITICAL';
    const cardBorder = isCritical ? 'border-t-4 border-t-amber-500 dark:border-t-[#fdc400] border-x border-b border-slate-200 dark:border-[#44474f]' : 'border border-slate-200 dark:border-[#44474f]';

    // 2. Format Date
    const dateObj = new Date(event.date);
    const day = format(dateObj, 'd');
    const month = format(dateObj, 'MMM').toUpperCase();
    const time = format(dateObj, 'HH:mm');

    return (
        <ScalePressable
            className={`bg-white dark:bg-[#1c1b1b] rounded-none mb-4 flex-row items-center p-4 ${cardBorder}`}
        >
            {/* Left Box: Date Bubble */}
            <View className={`w-14 h-14 rounded-none items-center justify-center mr-4 border ${borderTint} ${bgTint}`}>
                <Text className={`text-xl font-black leading-tight ${dateClass}`}>
                    {day}
                </Text>
                <Text className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${monthClass}`}>
                    {month}
                </Text>
            </View>

            {/* Right Box: Details */}
            <View className="flex-1 justify-center">
                <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-[10px] font-bold text-slate-500 dark:text-[#8e909a] uppercase tracking-wider">
                        {event.eventType.replace('_', ' ')}
                    </Text>
                    {isCritical && (
                        <View className="px-1.5 py-0.5 border border-amber-400 dark:border-[#fdc400]/50 rounded-none bg-amber-50 dark:bg-[#fdc400]/5">
                            <Text className="text-[9px] font-bold text-amber-700 dark:text-[#fdc400] uppercase tracking-widest">
                                Critical
                            </Text>
                        </View>
                    )}
                </View>

                <Text className="text-base font-bold text-slate-900 dark:text-[#e5e2e1] mb-2 leading-tight" numberOfLines={2}>
                    {event.title}
                </Text>

                <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1.5">
                        <Clock size={12} color={isDark ? "#8e909a" : "#64748b"} />
                        <Text className="text-xs font-medium text-slate-600 dark:text-[#c4c6d0]">{time}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 flex-1">
                        <MapPin size={12} color={isDark ? "#8e909a" : "#64748b"} />
                        <Text className="text-xs font-medium text-slate-600 dark:text-[#c4c6d0]" numberOfLines={1}>{event.location}</Text>
                    </View>
                </View>
            </View>
        </ScalePressable>
    );
});

// =============================================================================
// MAIN SCREEN
// =============================================================================

// PERFORMANCE FIX: Stable List components
const ScopeToggle = ({ scope, setScope }: { scope: 'personal' | 'command', setScope: (s: 'personal' | 'command') => void }) => (
    <View className="px-5 py-4">
        <View className="flex-row border-b border-slate-200 dark:border-[#353534]">
            <Pressable 
                onPress={() => setScope('personal')}
                className={`flex-1 py-3 items-center justify-center ${scope === 'personal' ? 'border-b-2 border-amber-500 dark:border-[#fdc400]' : ''}`}
            >
                <Text className={`text-xs font-bold uppercase tracking-wider ${scope === 'personal' ? 'text-slate-900 dark:text-[#e5e2e1]' : 'text-slate-500 dark:text-[#8e909a]'}`}>
                    My Events
                </Text>
            </Pressable>
            <Pressable 
                onPress={() => setScope('command')}
                className={`flex-1 py-3 items-center justify-center ${scope === 'command' ? 'border-b-2 border-amber-500 dark:border-[#fdc400]' : ''}`}
            >
                <Text className={`text-xs font-bold uppercase tracking-wider ${scope === 'command' ? 'text-slate-900 dark:text-[#e5e2e1]' : 'text-slate-500 dark:text-[#8e909a]'}`}>
                    All Events
                </Text>
            </Pressable>
        </View>
    </View>
);

// PERFORMANCE FIX: Extract renderSectionHeader to prevent inline reallocation
const renderSectionHeader = ({ section: { title } }: { section: { title: string } | any }) => (
    <View className="bg-slate-50/95 dark:bg-[#131313]/95 px-5 py-2 z-10 border-b border-slate-200 dark:border-[#201f1f] mb-3">
        <Text className="text-sm font-bold text-slate-600 dark:text-[#8e909a] uppercase tracking-widest">
            {title}
        </Text>
    </View>
);

export default function CalendarScreen() {
    const { groupedEvents, loading, refresh, eventScope, setEventScope } = useCareerEvents();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const [searchQuery, setSearchQuery] = useState('');
    const listRef = useRef<any>(null);

    // Scroll to top whenever this tab gains focus
    useFocusEffect(
        useCallback(() => {
            listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        }, [])
    );

    const searchConfig = {
        visible: true,
        onChangeText: setSearchQuery,
        placeholder: 'Search events...',
        value: searchQuery
    };


    // PERFORMANCE FIX: Stable keyExtractor and renderItem
    const keyExtractor = useCallback((item: CareerEvent) => item.eventId, []);
    const renderItem = useCallback(({ item }: { item: CareerEvent }) => (
        <View className="px-5">
            <EventCard event={item} />
        </View>
    ), []);

    return (
        <>
            <Stack.Screen options={{ headerShown: false }} />

            <ScreenGradient>
                <CollapsibleScaffold
                    statusBarShimBackgroundColor={isDark ? "#131313" : "#ffffff"}
                    topBar={
                        <ScreenHeader
                            title="Events"
                            subtitle=""
                            withSafeArea={false}
                            searchConfig={searchConfig}
                            showWebMenu={true}
                        />
                    }
                >
                    {({
                        onScroll,
                        onScrollBeginDrag,
                        onScrollEndDrag,
                        onLayout,
                        onContentSizeChange,
                        scrollEnabled,
                        scrollEventThrottle,
                        contentContainerStyle
                    }) => (
                        loading && groupedEvents.length === 0 ? (
                            <View className="flex-1 items-center justify-center">
                                <ActivityIndicator size="large" />
                            </View>
                        ) : (
                            <AnimatedSectionList
                                ref={listRef}
                                sections={groupedEvents}
                                initialNumToRender={10}
                                windowSize={5}
                                keyExtractor={keyExtractor}
                                renderItem={renderItem}
                                renderSectionHeader={renderSectionHeader}
                                contentContainerStyle={contentContainerStyle}
                                ListHeaderComponent={<ScopeToggle scope={eventScope} setScope={setEventScope} />}
                                stickySectionHeadersEnabled={true}
                                refreshing={loading}
                                onRefresh={refresh}
                                showsVerticalScrollIndicator={false}
                                onScroll={onScroll}
                                onScrollBeginDrag={onScrollBeginDrag}
                                onScrollEndDrag={onScrollEndDrag}
                                onLayout={onLayout}
                                onContentSizeChange={onContentSizeChange}
                                scrollEnabled={scrollEnabled}
                                scrollEventThrottle={scrollEventThrottle}
                            />
                        )
                    )}
                </CollapsibleScaffold>

            </ScreenGradient>
        </>
    );
}
