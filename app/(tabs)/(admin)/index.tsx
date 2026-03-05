import AdminFeedWidget from '@/components/admin/AdminFeedWidget';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { DigitalSeaBagWidget } from '@/components/pcs/widgets/DigitalSeaBagWidget';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useLeaveStore } from '@/store/useLeaveStore';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

export default function AdminDashboard() {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const [minHeaderHeight, setMinHeaderHeight] = useState(82);
    const listRef = useRef<any>(null);

    const { data } = useDashboardData();
    const userLeaveRequestIds = useLeaveStore(useShallow(state => state.userLeaveRequestIds));
    const leaveRequestsMap = useLeaveStore(useShallow(state => state.leaveRequests));
    const leaveBalance = useLeaveStore(state => state.leaveBalance);

    const leaveRequests = React.useMemo(() => {
        return userLeaveRequestIds
            .map(id => leaveRequestsMap[id])
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [userLeaveRequestIds, leaveRequestsMap]);

    const sections = ['adminFeed', 'digitalSeaBag', 'leave'];

    const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
        const delay = index * 60;
        switch (item) {
            case 'adminFeed':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <AdminFeedWidget />
                    </Animated.View>
                );
            case 'digitalSeaBag':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DigitalSeaBagWidget />
                    </Animated.View>
                );
            case 'leave':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <LeaveCard
                            balance={data?.leave?.currentBalance ?? 0}
                            leaveBalance={leaveBalance}
                            requests={leaveRequests}
                            allRequests={leaveRequests}
                            onPressRequest={(req) => {
                                if (req.status === 'draft') {
                                    router.push({ pathname: '/leave/request', params: { draftId: req.id } } as any);
                                } else {
                                    router.push(`/leave/${req.id}` as any);
                                }
                            }}
                            onQuickRequest={() => router.push('/leave/request' as any)}
                            onFullRequest={() => router.push('/leave/request' as any)}
                            onExpand={(expanded) => {
                                if (expanded) {
                                    setTimeout(() => {
                                        listRef.current?.scrollToEnd({ animated: true });
                                    }, 300);
                                }
                            }}
                        />
                    </Animated.View>
                );
            default:
                return null;
        }
    }, [data?.leave?.currentBalance, leaveBalance, leaveRequests, router]);


    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                minTopBarHeight={minHeaderHeight}
                topBar={
                    <BlurView intensity={isDark ? 80 : 60} tint={isDark ? "dark" : "light"}>
                        <View className="pt-2 pb-2" onLayout={(e) => setMinHeaderHeight(Math.round(e.nativeEvent.layout.height))}>
                            <ScreenHeader
                                title="My Admin"
                                subtitle="COMMAND CENTER"
                                withSafeArea={false}
                            />
                        </View>
                    </BlurView>
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
                    <AnimatedFlashList
                        ref={listRef}
                        data={sections}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => (
                            <View style={{ height: 24 }} />
                        )}
                        ListHeaderComponent={<View style={{ height: 24 }} />}
                        ListFooterComponent={<View style={{ height: 250 }} />}
                        estimatedItemSize={250}
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
                )}
            </CollapsibleScaffold>
        </ScreenGradient>
    );
}
