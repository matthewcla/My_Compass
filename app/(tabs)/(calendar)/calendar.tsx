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
import { ActivityIndicator, Alert, SectionList, Text, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AnimatedSectionList = Animated.createAnimatedComponent(SectionList);

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const EventCard = React.memo(({ event }: { event: CareerEvent }) => {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // 1. Determine Border Color
    let borderClass = 'border-l-4 border-l-slate-200 dark:border-l-slate-700'; // Default
    if (event.eventType === 'ADVANCEMENT_EXAM') {
        borderClass = 'border-l-4 border-l-[#0A1628]'; // Navy Blue
    } else if (event.eventType === 'STATUTORY_BOARD') {
        borderClass = 'border-l-4 border-l-[#C5B358]'; // Gold
    }

    // 2. Format Date
    const dateObj = new Date(event.date);
    const day = format(dateObj, 'd');
    const month = format(dateObj, 'MMM').toUpperCase();
    const time = format(dateObj, 'HH:mm');

    return (
        <ScalePressable
            className={`bg-white dark:bg-slate-900 rounded-xl mb-4 overflow-hidden flex-row ${borderClass}`}
            style={getShadow({ shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 })}
        >
            {/* Left Box: Date */}
            <View className="w-20 items-center justify-center bg-slate-50 dark:bg-slate-800/50 py-4 border-r border-slate-100 dark:border-slate-800">
                <Text className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {day}
                </Text>
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                    {month}
                </Text>
            </View>

            {/* Right Box: Details */}
            <View className="flex-1 p-4 justify-center">
                <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {event.eventType.replace('_', ' ')}
                    </Text>
                    {event.priority === 'CRITICAL' && (
                        <View className="px-1.5 py-0.5 bg-red-100 dark:bg-red-900/40 rounded-full">
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
                    <View className="flex-row items-center gap-1.5">
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
        console.log('[Calendar] Scanned Code:', data);

        // Show Success
        if (data) {
            Alert.alert("Check-in Complete", "You have successfully mustered for this event.");
            // TODO: Update local attendance status in useCareerEvents store
        }
    };

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
                                keyExtractor={(item: any) => item.eventId}
                                renderItem={({ item }: { item: any }) => (
                                    <View className="px-5">
                                        <EventCard event={item} />
                                    </View>
                                )}
                                renderSectionHeader={({ section: { title } }: { section: { title: string } | any }) => (
                                    <View className="bg-slate-50/95 dark:bg-black/95 px-5 py-2 z-10">
                                        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                            {title}
                                        </Text>
                                    </View>
                                )}
                                contentContainerStyle={contentContainerStyle}
                                ListHeaderComponent={<View style={{ height: 8 }} />}
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
                        className="w-14 h-14 bg-[#0A1628] dark:bg-white rounded-full items-center justify-center shadow-lg transform active:scale-95"
                        style={getShadow({ shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 6 })}
                    >
                        <QrCode size={24} color={isDark ? '#000' : '#fff'} />
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
