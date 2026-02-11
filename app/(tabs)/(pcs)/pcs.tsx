import React, { useEffect } from 'react';
import { View } from 'react-native';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { ProfileConfirmationCard } from '@/components/pcs/ProfileConfirmationCard';
import { SegmentTimeline } from '@/components/pcs/SegmentTimeline';
import { PCSChecklist } from '@/components/pcs/PCSChecklist';
import { usePCSStore } from '@/store/usePCSStore';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import Animated from 'react-native-reanimated';
import { useColorScheme } from '@/components/useColorScheme';

export default function PcsScreen() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { initializeOrders, activeOrder } = usePCSStore();

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
