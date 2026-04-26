
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import Colors from '@/constants/Colors';
import { FlashList } from '@shopify/flash-list';
import React, { useCallback, useRef, useState } from 'react';
import { Platform, View, Text } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AdminHealthBar } from '@/components/admin/AdminHealthBar';
import { AdminFilterChips } from '@/components/admin/AdminFilterChips';
import { AdminRequestCard } from '@/components/admin/AdminRequestCard';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminActionModal } from '@/components/admin/AdminActionModal';
import { useAdminStore, AdminRequest } from '@/store/useAdminStore';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

// PERFORMANCE FIX: Stable component references
const ItemSeparator = () => <View style={{ height: 16 }} />;
const ListFooter = () => <View style={{ height: 250 }} />;

export default function AdminDashboard() {
    const listRef = useRef<any>(null);
    const activeStatusFilter = useAdminStore(state => state.activeStatusFilter);
    const activeTypeFilter = useAdminStore(state => state.activeTypeFilter);
    const allRequests = useAdminStore(state => state.requests);
    const currentUserRole = useAdminStore(state => state.currentUserRole);
    
    const requests = React.useMemo(() => {
        return useAdminStore.getState().getFilteredRequests();
    }, [activeStatusFilter, activeTypeFilter, allRequests, currentUserRole]);
    const [selectedRequest, setSelectedRequest] = useState<AdminRequest | null>(null);

    // PERFORMANCE FIX: Empty dependency array ensures permanent stability
    const renderItem = useCallback(({ item, index }: { item: AdminRequest; index: number }) => {
        const delay = Math.min(index * 60, 600);
        return (
            <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                <AdminRequestCard 
                    request={item} 
                    onPress={() => setSelectedRequest(item)}
                    onAction={() => setSelectedRequest(item)}
                />
            </Animated.View>
        );
    }, []);

    // PERFORMANCE FIX: Stable key extractor
    const keyExtractor = useCallback((item: AdminRequest) => item.id, []);

    const ListHeader = useCallback(() => (
        <View className="gap-6 mb-6 pt-4">
            <AdminHealthBar lastSyncedLabel="Just now" />
            <AdminFilterChips />
        </View>
    ), []);

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={Colors.gradient.dark[0]}
                minTopBarHeight={0}
                topBar={
                    <View className="bg-black">
                        <ScreenHeader
                            title="Admin"
                            subtitle="Command Center"
                            withSafeArea={false}
                            showWebMenu={true}
                        />
                    </View>
                }
                contentContainerStyle={{ paddingHorizontal: 16 }}
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
                    <>
                        <AnimatedFlashList
                            ref={listRef}
                            data={requests}
                            renderItem={renderItem}
                            keyExtractor={keyExtractor}
                            ItemSeparatorComponent={ItemSeparator}
                            ListHeaderComponent={ListHeader}
                            ListFooterComponent={ListFooter}
                            ListEmptyComponent={<AdminEmptyState />}
                            estimatedItemSize={100}
                            style={{ flex: 1 }}
                            showsVerticalScrollIndicator={false}
                            scrollEventThrottle={scrollEventThrottle}
                            onScroll={onScroll}
                            onScrollBeginDrag={onScrollBeginDrag}
                            onScrollEndDrag={onScrollEndDrag}
                            onLayout={onLayout}
                            onContentSizeChange={onContentSizeChange}
                            scrollEnabled={scrollEnabled}
                            contentContainerStyle={contentContainerStyle}
                        />
                        <AdminActionModal 
                            request={selectedRequest}
                            onClose={() => setSelectedRequest(null)}
                        />
                    </>
                )}
            </CollapsibleScaffold>
        </ScreenGradient>
    );
}
