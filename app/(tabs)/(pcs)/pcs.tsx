import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { PCSChecklist } from '@/components/pcs/PCSChecklist';
import { ProfileConfirmationCard } from '@/components/pcs/ProfileConfirmationCard';
import { SegmentTimeline } from '@/components/pcs/SegmentTimeline';
import { useColorScheme } from '@/components/useColorScheme';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

export default function PcsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { initializeOrders, activeOrder } = usePCSStore();
    const resetHeader = useHeaderStore((state) => state.resetHeader);

    useEffect(() => {
        // Clear stale header store state from the previous screen
        resetHeader();
    }, [resetHeader]);

    useEffect(() => {
        if (!activeOrder) {
            initializeOrders();
        }
    }, [activeOrder, initializeOrders]);

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? '#0f172a' : '#f8fafc'}
                topBar={
                    <View className="bg-slate-50 dark:bg-slate-950 pb-2">
                        <ScreenHeader
                            title="My PCS"
                            subtitle="Relocation Manager"
                            withSafeArea={false}
                        />
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 100 }}
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
                    <Animated.ScrollView
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        scrollEventThrottle={scrollEventThrottle}
                        contentContainerStyle={contentContainerStyle}
                        showsVerticalScrollIndicator={false}
                    >
                        <View style={{ paddingTop: 24 }}>
                            <ProfileConfirmationCard />
                            <SegmentTimeline />
                            <PCSChecklist />
                        </View>
                    </Animated.ScrollView>
                )}
            </CollapsibleScaffold>
        </ScreenGradient>
    );
}
