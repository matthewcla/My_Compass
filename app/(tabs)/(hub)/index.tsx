import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import type { DiscoveryBadgeCategory } from '@/components/dashboard/DiscoveryCard';
import { DiscoveryStatusCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { DemoPhase } from '@/constants/DemoData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/lib/ctx';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { usePCSPhase, usePCSStore, useSubPhase } from '@/store/usePCSStore';
import { getShadow } from '@/utils/getShadow';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { Alert, Platform, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

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

    const userLeaveRequestIds = useLeaveStore(useShallow(state => state.userLeaveRequestIds));
    const leaveRequestsMap = useLeaveStore(useShallow(state => state.leaveRequests));
    const leaveBalance = useLeaveStore(state => state.leaveBalance);

    const leaveRequests = React.useMemo(() => {
        return userLeaveRequestIds
            .map(id => leaveRequestsMap[id])
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [userLeaveRequestIds, leaveRequestsMap]);

    // Track the dynamic height of the ScreenHeader so the StatusCard can perfectly flush away
    const [minHeaderHeight, setMinHeaderHeight] = React.useState(82);

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
    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
        const isPCSPhase = isDemoMode && selectedPhase === DemoPhase.MY_PCS;
        const delay = index * 60;

        switch (item) {
            case 'missionStatus':
                // Surpress the MNA StatusCard if the sailor is locked into active PCS execution
                if (pcsPhase === 'CHECK_IN' || subPhase === 'ACTIVE_TRAVEL') return null;

                return (
                    <Animated.View entering={FadeInUp.duration(350).springify()}>
                        <View style={getShadow({ shadowColor: isDark ? '#94a3b8' : '#64748b', shadowOpacity: isDark ? 0.1 : 0.12, shadowRadius: 12, elevation: 3 })} className="px-1 pb-6 pt-2">
                            <StatusCard
                                nextCycle={data?.cycle?.cycleId ?? '24-02'}
                                daysUntilOpen={isDemoMode && demoTimeline ? demoTimeline.daysUntilOpen : (data?.cycle?.daysRemaining ?? 12)}
                            />
                        </View>
                    </Animated.View>
                );
            case 'discoveryStatus':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DiscoveryStatusCard
                            onStartExploring={() => router.push({ pathname: '/(career)/discovery', params: { returnPath: '/(tabs)/(hub)' } } as any)}
                            onBadgeTap={(category: DiscoveryBadgeCategory, count: number) => {
                                if (count === 0) {
                                    const labels: Record<DiscoveryBadgeCategory, string> = {
                                        wow: 'WOW!', liked: 'Liked', passed: 'Passed', remaining: 'remaining'
                                    };
                                    Alert.alert('Nothing here yet', `You don't have any ${labels[category]} billets yet. Start exploring!`);
                                    return;
                                }
                                router.push({ pathname: '/(career)/discovery', params: { filter: category, returnPath: '/(tabs)/(hub)' } } as any);
                            }}
                        />
                    </Animated.View>
                );
            case 'receiptCapture': {
                const { ReceiptScannerWidget } = require('@/components/pcs/widgets/ReceiptScannerWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <ReceiptScannerWidget />
                    </Animated.View>
                );
            }
            case 'tierRightNow':
            case 'tierThisWeek':
            case 'tierTracking': {
                const tierLabel = item === 'tierRightNow' ? 'Right Now'
                    : item === 'tierThisWeek' ? 'This Week'
                        : 'Tracking';
                return (
                    <View className="flex-row items-center mt-3 mb-1 px-1">
                        <Text className="text-[13px] font-bold tracking-widest uppercase text-slate-500 dark:text-slate-400">
                            {tierLabel}
                        </Text>
                        <View className="flex-1 h-px bg-slate-200 dark:bg-slate-800 ml-4" />
                    </View>
                );
            }

            case 'digitalOrdersWallet': {
                const { DigitalOrdersWallet } = require('@/components/pcs/widgets/DigitalOrdersWallet');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DigitalOrdersWallet />
                    </Animated.View>
                );
            }
            case 'pcsFinancialSnapshot': {
                const { PCSFinancialSnapshot } = require('@/components/pcs/widgets/PCSFinancialSnapshot');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSFinancialSnapshot />
                    </Animated.View>
                );
            }
            case 'gainingCommandCard': {
                const { GainingCommandCard } = require('@/components/pcs/widgets/GainingCommandCard');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <GainingCommandCard />
                    </Animated.View>
                );
            }
            case 'hhgWeightGauge': {
                const { HHGWeightGaugeWidget } = require('@/components/pcs/widgets/HHGWeightGaugeWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <HHGWeightGaugeWidget />
                    </Animated.View>
                );
            }
            case 'leaveImpact': {
                const { LeaveImpactWidget } = require('@/components/pcs/widgets/LeaveImpactWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <LeaveImpactWidget />
                    </Animated.View>
                );
            }
            case 'slateSummary': {
                const SlateSummaryWidget = require('@/components/assignment/SlateSummaryWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <SlateSummaryWidget />
                    </Animated.View>
                );
            }
            case 'digitalSeaBag': {
                const { DigitalSeaBagWidget } = require('@/components/pcs/widgets/DigitalSeaBagWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DigitalSeaBagWidget />
                    </Animated.View>
                );
            }
            case 'adminFeed': {
                const AdminFeedWidget = require('@/components/admin/AdminFeedWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <AdminFeedWidget />
                    </Animated.View>
                );
            }
            case 'mnaProcess': {
                const MNAProcessWidget = require('@/components/assignment/MNAProcessWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <MNAProcessWidget />
                    </Animated.View>
                );
            }
            case 'careerReadiness': {
                const ReadinessWidget = require('@/components/assignment/ReadinessWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <ReadinessWidget />
                    </Animated.View>
                );
            }
            case 'detailerContact': {
                const DetailerContactWidget = require('@/components/assignment/DetailerContactWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DetailerContactWidget />
                    </Animated.View>
                );
            }
            case 'selectionDetail': {
                const SelectionDetailWidget = require('@/components/assignment/SelectionDetailWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <SelectionDetailWidget />
                    </Animated.View>
                );
            }
            case 'selectionChecklist': {
                const SelectionChecklistWidget = require('@/components/assignment/SelectionChecklistWidget').default;
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <SelectionChecklistWidget />
                    </Animated.View>
                );
            }
            case 'pcsHeroBanner': {
                const { PCSHeroBanner } = require('@/components/pcs/PCSHeroBanner');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSHeroBanner />
                    </Animated.View>
                );
            }
            case 'baseWelcomeKit': {
                const { BaseWelcomeKit } = require('@/components/pcs/widgets/BaseWelcomeKit');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <BaseWelcomeKit />
                    </Animated.View>
                );
            }
            case 'arrivalBriefing': {
                const { ArrivalBriefingWidget } = require('@/components/pcs/widgets/ArrivalBriefingWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <ArrivalBriefingWidget />
                    </Animated.View>
                );
            }
            case 'travelClaimHUD': {
                const { TravelClaimHUDWidget } = require('@/components/pcs/widgets/TravelClaimHUDWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <TravelClaimHUDWidget />
                    </Animated.View>
                );
            }
            case 'travelClaimUrgency': {
                const { TravelClaimHUDWidget } = require('@/components/pcs/widgets/TravelClaimHUDWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <TravelClaimHUDWidget />
                    </Animated.View>
                );
            }
            case 'liquidationTracker': {
                const { LiquidationTrackerWidget } = require('@/components/pcs/widgets/LiquidationTrackerWidget');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <LiquidationTrackerWidget />
                    </Animated.View>
                );
            }
            case 'pcsTaskTracker': {
                const { PCSTaskTracker } = require('@/components/pcs/widgets/PCSTaskTracker');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSTaskTracker />
                    </Animated.View>
                );
            }
            case 'missionBrief': {
                const { PCSMissionBrief } = require('@/components/pcs/widgets/PCSMissionBrief');
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSMissionBrief />
                    </Animated.View>
                );
            }
            case 'obliserv':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <ObliservBanner variant="widget" />
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDemoMode, selectedPhase, assignmentPhase, obliserv, pcsPhase, subPhase, data, leaveRequests, leaveBalance]);

    const sections = React.useMemo(() => {
        const feed: string[] = [];

        // Priority 0: Core Status (Always Top unless actively traveling)
        if (pcsPhase !== 'CHECK_IN' && subPhase !== 'ACTIVE_TRAVEL') {
            feed.push('missionStatus');
        }

        // Priority 1: Critical Action Items (OBLISERV only applies during Selection before orders are released)
        if (assignmentPhase === 'SELECTION') {
            feed.push('obliserv');
        }

        // Priority 2: PCS Active Window Navigation
        if (pcsPhase === 'CHECK_IN' || subPhase === 'ACTIVE_TRAVEL') {
            feed.push('baseWelcomeKit');
            feed.push('digitalOrdersWallet');

            // Contextual HHG widget
            if (dependentCount > 0 || hasShipments) {
                feed.push('hhgWeightGauge');
            }

            const hasActiveLiquidation = liquidationStatus && liquidationStatus !== 'NOT_STARTED';
            if (subPhase === 'ACTIVE_TRAVEL' || (pcsPhase === 'CHECK_IN' && !hasActiveLiquidation)) {
                feed.push('travelClaimUrgency');
            }

            // Active PCS Tasks
            if (pcsPhase !== 'CHECK_IN') {
                feed.push('pcsTaskTracker');
            }
            if (hasActiveLiquidation && pcsPhase === 'CHECK_IN') {
                feed.push('liquidationTracker');
            }
        }

        // Priority 3: Mission Brief (Active Orders)
        else if (['ORDERS_PROCESSING', 'ORDERS_RELEASED'].includes(assignmentPhase ?? '') && (pcsPhase === 'ORDERS_NEGOTIATION' || pcsPhase === 'TRANSIT_LEAVE')) {
            feed.push('missionBrief');
            if (assignmentPhase === 'ORDERS_RELEASED') {
                feed.push('digitalOrdersWallet');
                if (dependentCount > 0 || hasShipments) {
                    feed.push('hhgWeightGauge');
                }
                feed.push('leaveImpact');
                feed.push('pcsTaskTracker');
            }
        }

        // Priority 4: Career Discovery & Selection Details
        else {
            if (assignmentPhase === 'SELECTION') {
                feed.push('selectionDetail');
                feed.push('selectionChecklist');
            } else if (assignmentPhase === 'ON_RAMP') {
                feed.push('careerReadiness');
                feed.push('discoveryStatus');
            } else if (assignmentPhase === 'NEGOTIATION') {
                feed.push('slateSummary');
            } else if (!pcsPhase) {
                // Priority 5: Peacetime Promotion ("The Garrison State")
                feed.push('tierThisWeek');
                feed.push('tierTracking');
            }
        }

        // Anchor: Universal Utilities (Never omit these, sit at the bottom of the feed)
        feed.push('digitalSeaBag');
        feed.push('leave');

        return feed;
    }, [assignmentPhase, pcsPhase, subPhase, liquidationStatus, hasShipments, dependentCount]);

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
                minTopBarHeight={minHeaderHeight}
                topBar={
                    <BlurView intensity={isDark ? 80 : 60} tint={isDark ? "dark" : "light"}>
                        <View className="pt-2 pb-2" onLayout={(e) => setMinHeaderHeight(Math.round(e.nativeEvent.layout.height))}>
                            <ScreenHeader
                                title=""
                                subtitle=""
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

                        estimatedItemSize={150}
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

            {/* Bottom depth fade — suggests more content below, matches ScreenGradient end stop */}
            <View pointerEvents="none" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 }}>
                <LinearGradient
                    colors={isDark
                        ? ['transparent', 'rgba(6,14,24,0.88)']
                        : ['transparent', 'rgba(221,227,238,0.82)']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={{ flex: 1 }}
                />
            </View>

            {/* Floating demo panel — outside CollapsibleScaffold */}
            <PCSDevPanel />
        </ScreenGradient>
    );
}
