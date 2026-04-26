import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { PCSHeroBanner } from '@/components/pcs/PCSHeroBanner';
import { ScreenGradient } from '@/components/ScreenGradient';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { DemoPhase } from '@/constants/DemoData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/lib/ctx';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { usePCSPhase, usePCSStore, useSubPhase, useUCTPhaseStatus } from '@/store/usePCSStore';
import { getShadow } from '@/utils/getShadow';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useRouter } from 'expo-router';
import { Bell, Menu } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

// P2 FIX #8/#9: Stable component references prevent FlashList re-render thrashing
const ItemSeparator = () => <View style={{ height: 24 }} />;
const ListHeader = () => (
    <View className="relative w-full h-48 md:h-64 bg-[#2a2a2a] overflow-hidden border-b-4 border-secondary-container mb-6">
        <LinearGradient
            colors={['rgba(19,19,19,1)', 'rgba(19,19,19,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.66, y: 0 }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', zIndex: 10 }}
        />
        <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlk0EQB3AeeQZRB_5FtVwpVzBeqCT1W0966Y_uc6miRy4RCqlHyN9u54wBUvBVHYSZRT4jH_YTMJBVtfzeOFakU7hnZeBDqDQc4kr75YMTipBs1Q-HH3H_CLaPpMIHeQAKyvdSp7yqWaR97VxVKNC2goiGrKZUb3eKHO3sYi9P4Bit9Zm5XVJPzd744sVbF4gk13iIY5aFsSs-Yl0VPPeMoJ5IILKO0levwWL_ggbVRUN-lfLGR_OIlDWX1XhwAsFq_JerR59KS3o' }}
            style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.4 }}
            contentFit="cover"
        />
        <View className="absolute bottom-6 left-5 z-20">
            <Text className="font-label text-secondary-container font-bold tracking-widest text-sm mb-1 uppercase">Personnel Status</Text>
            <Text className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase leading-none">DASHBOARD</Text>
        </View>
    </View>
);
const ListFooter = () => <View style={{ height: 250 }} />;
const getItemType = (item: string) => item;

const HubLeaveItem = React.memo(({ 
    listRef, 
    onQuickRequest 
}: { 
    listRef: React.RefObject<any>, 
    onQuickRequest: () => void 
}) => {
    const router = useRouter();
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

    return (
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
            onQuickRequest={onQuickRequest}
            onFullRequest={() => router.push('/leave/request' as any)}
            onExpand={(expanded) => {
                if (expanded) {
                    setTimeout(() => {
                        listRef.current?.scrollToEnd({ animated: true });
                    }, 300);
                }
            }}
        />
    );
});

type FilterTab = 'Hub' | 'My Career' | 'My Admin';

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useCurrentProfile();
    const generateQuickDraft = useLeaveStore(state => state.generateQuickDraft);
    const fetchUserDefaults = useLeaveStore(state => state.fetchUserDefaults);
    const insets = useSafeAreaInsets();
    const { data, loading, error } = useDashboardData();
    const [activeFilter, setActiveFilter] = React.useState<FilterTab>('Hub');

    const listRef = React.useRef<any>(null);

    // Quick Leave State
    const [showQuickLeave, setShowQuickLeave] = React.useState(false);
    const [quickLeaveDraft, setQuickLeaveDraft] = React.useState<any>(null);

    const handleQuickRequest = useCallback(() => {
        if (user?.id) {
            const draft = generateQuickDraft('standard', user.id);
            setQuickLeaveDraft(draft);
            setShowQuickLeave(true);
        } else {
            Alert.alert('Error', 'User not found. Cannot create quick leave.');
        }
    }, [user?.id, generateQuickDraft]);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const isDemoMode = useDemoStore(state => state.isDemoMode);
    const selectedPhase = useDemoStore(state => state.selectedPhase);
    const assignmentPhase = useDemoStore(state => state.assignmentPhaseOverride);
    const demoTimeline = useDemoStore(state => state.demoTimelineOverride);
    const initializeOrders = usePCSStore(state => state.initializeOrders);
    const obliserv = usePCSStore(state => state.financials.obliserv);
    const pcsPhase = usePCSPhase();
    const subPhase = useSubPhase();
    const uctPhaseStatus = useUCTPhaseStatus();

    const activeUCTPhase = React.useMemo(() => {
        const active = Object.entries(uctPhaseStatus).find(([_, status]) => status === 'ACTIVE');
        return active ? Number(active[0]) : 1;
    }, [uctPhaseStatus]);

    // QW4: Reactive liquidation state (must be above early returns per Rules of Hooks)
    const liquidationStatus = usePCSStore((s) => s.financials.liquidation?.currentStatus);
    const shipments = usePCSStore(state => state.financials.hhg?.shipments ?? []);
    const hasShipments = shipments.length > 0;
    const dependentCount = user?.dependents ?? 0;

    // Hydrate defaults on mount
    React.useEffect(() => {
        if (user?.id) {
            fetchUserDefaults(user.id);
        }
    }, [user?.id, fetchUserDefaults]);

    // Hydrate billets so DiscoveryStatusCard scoreboard is populated
    const fetchBillets = useAssignmentStore(state => state.fetchBillets);
    React.useEffect(() => {
        fetchBillets();
    }, [fetchBillets]);

    // Initialize PCS Orders if in PCS Demo Phase
    React.useEffect(() => {
        if (isDemoMode && selectedPhase === DemoPhase.MY_PCS) {
            initializeOrders();
        }
    }, [isDemoMode, selectedPhase, initializeOrders]);


    // Scroll to top whenever this tab gains focus
    useFocusEffect(
        useCallback(() => {
            listRef.current?.scrollToOffset?.({ offset: 0, animated: false });
        }, [])
    );


    // QW1: Wrapped in useCallback to prevent FlashList re-creating the callback on every render
    // QW2: Each widget section gets a FadeInUp stagger for polished entrance
    // IMPORTANT: Must be above early returns to satisfy Rules of Hooks
    const renderItem = useCallback(({ item, index }: { item: string; index: number }) => {
        const delay = index * 60;

        switch (item) {
            case 'leave':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <HubLeaveItem listRef={listRef} onQuickRequest={handleQuickRequest} />
                    </Animated.View>
                );
            default:
                return null;
        }
    }, [router, handleQuickRequest]);

    const sections = React.useMemo(() => {
        const feed: string[] = [];
        feed.push('leave');
        return feed;
    }, [assignmentPhase, pcsPhase, subPhase, liquidationStatus, hasShipments, dependentCount, activeUCTPhase]);

    // Loading state
    if (loading && !data) {
        return (
            <ScreenGradient>
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <HubSkeleton />
            </ScreenGradient>
        );
    }

    // Error state with fallback
    if (error && !data) {
        return (
            <ScreenGradient>
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-slate-400 text-center">{error}</Text>
                </View>
            </ScreenGradient>
        );
    }


    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                topBar={
                    <BlurView intensity={isDark ? 85 : 70} tint={isDark ? "dark" : "light"} className="overflow-hidden">
                        {/* Inner Glass Top-Glow Highlight */}
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)' }} />

                        <View className="flex-row items-center justify-between px-5 pt-3 pb-3">
                            <View className="flex-row items-center gap-3">
                                {Platform.OS === 'web' && (
                                    <Pressable
                                        onPress={() => Alert.alert('Menu', 'Menu opened')}
                                        hitSlop={12}
                                        className="p-2 hover:bg-surface-variant active:scale-95 transition-transform duration-100"
                                    >
                                        <Menu color={isDark ? '#aec6fe' : '#0F172A'} size={24} />
                                    </Pressable>
                                )}
                                <Text
                                    className="text-xl font-black font-headline uppercase tracking-tighter text-primary dark:text-primary"
                                >
                                    ANCHOR POINT
                                </Text>
                            </View>

                            <View className="flex items-center">
                                <Pressable
                                    onPress={() => Alert.alert('Notifications', 'No new notifications at this time.')}
                                    hitSlop={12}
                                    className="p-2 hover:bg-surface-variant active:scale-95 transition-transform duration-100"
                                >
                                    <Bell color={isDark ? '#aec6fe' : '#0F172A'} size={24} />
                                </Pressable>
                            </View>
                        </View>
                        <View
                            className="w-full"
                            style={{
                                height: 1, // Using integer value instead of StyleSheet.hairlineWidth for consistency
                                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                            }}
                        />
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
                        getItemType={getItemType}
                        ItemSeparatorComponent={ItemSeparator}
                        ListHeaderComponent={ListHeader}
                        ListFooterComponent={ListFooter}

                        estimatedItemSize={220}
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

            {/* Quick Leave Modal */}
            <Modal
                visible={showQuickLeave}
                transparent={true}
                animationType="fade"
                onRequestClose={() => {
                    setShowQuickLeave(false);
                    setQuickLeaveDraft(null);
                }}
            >
                <View className="flex-1 justify-center px-4 bg-slate-900/20 dark:bg-black/60 shadow-[0_0_50px_rgba(0,0,0,0.3)] dark:shadow-[0_0_50px_rgba(0,0,0,0.8)]">
                    <Pressable
                        className="absolute inset-0"
                        onPress={() => {
                            setShowQuickLeave(false);
                            setQuickLeaveDraft(null);
                        }}
                    />
                    {quickLeaveDraft && (
                        <View className="w-full">
                            <QuickLeaveTicket
                                draft={quickLeaveDraft}
                                onSubmit={() => {
                                    setShowQuickLeave(false);
                                    setQuickLeaveDraft(null);
                                    Alert.alert('Success', 'Quick leave request submitted.');
                                }}
                                onEdit={() => {
                                    setShowQuickLeave(false);
                                    router.push({ pathname: '/leave/request', params: { draftId: quickLeaveDraft.id } } as any);
                                }}
                                onClose={() => {
                                    setShowQuickLeave(false);
                                    setQuickLeaveDraft(null);
                                }}
                            />
                        </View>
                    )}
                </View>
            </Modal>

            {/* Floating demo panel — outside CollapsibleScaffold */}
            <PCSDevPanel />
        </ScreenGradient>
    );
}
