import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { ScalePressable } from '@/components/ScalePressable';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ScannerModal } from '@/components/ui/ScannerModal';
import { useColorScheme } from '@/components/useColorScheme';
import { useCareerEvents } from '@/hooks/useCareerEvents';
import { CareerEvent } from '@/types/career';
import { getShadow } from '@/utils/getShadow';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Stack, useFocusEffect } from 'expo-router';
import { Clock, MapPin, QrCode } from 'lucide-react-native';
import React, { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, SectionList, SectionListProps, Text, TouchableOpacity, View } from 'react-native';
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
    let bgTint = 'bg-slate-100 dark:bg-slate-700/50';
    let dateClass = 'text-slate-900 dark:text-white';
    let monthClass = 'text-slate-500 dark:text-slate-400';

    if (event.eventType === 'ADVANCEMENT_EXAM') {
        bgTint = 'bg-blue-50 dark:bg-blue-900/30';
        dateClass = 'text-[#0A1628] dark:text-blue-400';
        monthClass = 'text-blue-800/70 dark:text-blue-400/80';
    } else if (event.eventType === 'STATUTORY_BOARD') {
        bgTint = 'bg-[#C9A227]/10 dark:bg-[#C9A227]/20';
        dateClass = 'text-[#96781D] dark:text-[#C9A227]';
        monthClass = 'text-[#96781D]/80 dark:text-[#C9A227]/80';
    }

    // 2. Format Date
    const dateObj = new Date(event.date);
    const day = format(dateObj, 'd');
    const month = format(dateObj, 'MMM').toUpperCase();
    const time = format(dateObj, 'HH:mm');

    return (
        <ScalePressable
            className="bg-white/95 dark:bg-slate-800/90 rounded-2xl mb-4 border border-slate-200/50 dark:border-slate-700/50 flex-row items-center p-4"
            style={getShadow({ shadowColor: isDark ? '#000000' : '#64748b', shadowOpacity: isDark ? 0.3 : 0.08, shadowRadius: 12, elevation: 3 })}
        >
            {/* Left Box: Date Bubble */}
            <View className={`w-14 h-14 rounded-xl items-center justify-center mr-4 ${bgTint}`}>
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
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {event.eventType.replace('_', ' ')}
                    </Text>
                    {event.priority === 'CRITICAL' && (
                        <View className="px-1.5 py-0.5 bg-red-500/10 dark:bg-red-500/20 rounded-full border border-red-500/20">
                            <Text className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase">
                                Critical
                            </Text>
                        </View>
                    )}
                </View>

                <Text className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight" numberOfLines={2}>
                    {event.title}
                </Text>

                <View className="flex-row items-center gap-4">
                    <View className="flex-row items-center gap-1.5">
                        <Clock size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text className="text-xs font-medium text-slate-500 dark:text-slate-400">{time}</Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 flex-1">
                        <MapPin size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text className="text-xs font-medium text-slate-500 dark:text-slate-400" numberOfLines={1}>{event.location}</Text>
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
const ListHeader = () => <View style={{ height: 8 }} />;

// PERFORMANCE FIX: Extract renderSectionHeader to prevent inline reallocation
const renderSectionHeader = ({ section: { title } }: { section: { title: string } | any }) => (
    <View className="bg-slate-50/95 dark:bg-black/95 px-5 py-2 z-10">
        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {title}
        </Text>
    </View>
);

export default function CalendarScreen() {
    const { groupedEvents, loading, refresh } = useCareerEvents();
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

    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    // Mock Handler
    const handleScan = (data: string) => {
        // 1. Close Scanner
        setIsScannerOpen(false);

        // 2. Feedback
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // 3. Mock Validation Logic (In real app, parse JSON: { eventId, token })

        // Show Success
        if (data) {
            Alert.alert("Check-in Complete", "You have successfully mustered for this event.");
        }
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
                    statusBarShimBackgroundColor={isDark ? '#0f172a' : '#f8fafc'}
                    topBar={
                        <ScreenHeader
                            title=""
                            subtitle=""
                            withSafeArea={false}
                            searchConfig={searchConfig}
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
                                ListHeaderComponent={ListHeader}
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

                {/* FAB: Scan QR Code */}
                <View className="absolute bottom-28 right-6">
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setIsScannerOpen(true)}
                        accessibilityRole="button"
                        accessibilityLabel="Open Scanner"
                        className="w-14 h-14 bg-white/95 dark:bg-slate-800/95 border border-slate-200/60 dark:border-slate-700/60 rounded-full items-center justify-center shadow-lg transform active:scale-95"
                        style={getShadow({ shadowColor: isDark ? '#000' : '#64748b', shadowOpacity: isDark ? 0.4 : 0.2, shadowRadius: 12, elevation: 8 })}
                    >
                        <QrCode size={24} color={isDark ? '#e2e8f0' : '#0f172a'} />
                    </TouchableOpacity>
                </View>

                {/* Scanner Modal */}
                <ScannerModal
                    visible={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScan={handleScan}
                />
            </ScreenGradient>
        </>
    );
}
