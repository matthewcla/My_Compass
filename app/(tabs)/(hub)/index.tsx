import AdminFeedWidget from '@/components/admin/AdminFeedWidget';
import DetailerContactWidget from '@/components/assignment/DetailerContactWidget';
import MNAProcessWidget from '@/components/assignment/MNAProcessWidget';
import NegotiationWidget from '@/components/assignment/NegotiationWidget';
import ReadinessWidget from '@/components/assignment/ReadinessWidget';
import SelectionDetailWidget from '@/components/assignment/SelectionDetailWidget';
import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { PCSHeroBanner } from '@/components/pcs/PCSHeroBanner';
import { ArrivalBriefingWidget } from '@/components/pcs/widgets/ArrivalBriefingWidget';
import { BaseWelcomeKit } from '@/components/pcs/widgets/BaseWelcomeKit';
import { DigitalOrdersWallet } from '@/components/pcs/widgets/DigitalOrdersWallet';
import { DigitalSeaBagWidget } from '@/components/pcs/widgets/DigitalSeaBagWidget';
import { GainingCommandCard } from '@/components/pcs/widgets/GainingCommandCard';
import { LeaveImpactWidget } from '@/components/pcs/widgets/LeaveImpactWidget';
import { LiquidationTrackerWidget } from '@/components/pcs/widgets/LiquidationTrackerWidget';
import { OrdersProcessingWidget } from '@/components/pcs/widgets/OrdersProcessingWidget';
import { PCSFinancialSnapshot } from '@/components/pcs/widgets/PCSFinancialSnapshot';
import { PCSMissionBrief } from '@/components/pcs/widgets/PCSMissionBrief';
import { PCSSummaryWidget } from '@/components/pcs/widgets/PCSSummaryWidget';
import { PCSTaskTracker } from '@/components/pcs/widgets/PCSTaskTracker';
import { TransitSegmentWidget } from '@/components/pcs/widgets/TransitSegmentWidget';
import { TravelClaimHUDWidget } from '@/components/pcs/widgets/TravelClaimHUDWidget';
import { TravelReceiptLoggerWidget } from '@/components/pcs/widgets/TravelReceiptLoggerWidget';
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
import { Bell } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Modal, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

// P2 FIX #8/#9: Stable component references prevent FlashList re-render thrashing
const ItemSeparator = () => <View style={{ height: 24 }} />;
const ListHeader = <View style={{ height: 24 }} />;
const ListFooter = <View style={{ height: 250 }} />;

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

    // Quick Leave State
    const [showQuickLeave, setShowQuickLeave] = React.useState(false);
    const [quickLeaveDraft, setQuickLeaveDraft] = React.useState<any>(null);

    const leaveRequests = React.useMemo(() => {
        return userLeaveRequestIds
            .map(id => leaveRequestsMap[id])
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [userLeaveRequestIds, leaveRequestsMap]);

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
    const renderItem = useCallback(({ item, index }: { item: any; index: number }) => {
        const isPCSPhase = isDemoMode && selectedPhase === DemoPhase.MY_PCS;
        const delay = index * 60;

        switch (item) {
            case 'missionStatus':
                return (
                    <Animated.View entering={FadeInUp.duration(350).springify()}>
                        <View style={getShadow({ shadowColor: isDark ? '#94a3b8' : '#64748b', shadowOpacity: isDark ? 0.1 : 0.12, shadowRadius: 12, elevation: 3 })} className="px-1">
                            <StatusCard
                                nextCycle={data?.cycle?.cycleId ?? '24-02'}
                                daysUntilOpen={isDemoMode && demoTimeline ? demoTimeline.daysUntilOpen : (data?.cycle?.daysRemaining ?? 12)}
                            />
                        </View>
                    </Animated.View>
                );
            case 'negotiationWidget':
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <NegotiationWidget
                            onStartExploring={() => router.push({ pathname: '/(career)/discovery', params: { returnPath: '/(tabs)/(hub)' } } as any)}
                            onManageSlate={() => router.push('/(career)/cycle' as any)}
                        />
                    </Animated.View>
                );
            case 'transitSegmentWidget': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <TransitSegmentWidget />
                    </Animated.View>
                );
            }
            case 'travelReceiptLoggerWidget': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <TravelReceiptLoggerWidget />
                    </Animated.View>
                );
            }


            case 'digitalOrdersWallet': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DigitalOrdersWallet />
                    </Animated.View>
                );
            }
            case 'pcsFinancialSnapshot': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSFinancialSnapshot />
                    </Animated.View>
                );
            }
            case 'gainingCommandCard': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <GainingCommandCard />
                    </Animated.View>
                );
            }
            case 'leaveImpact': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <LeaveImpactWidget />
                    </Animated.View>
                );
            }
            case 'slateSummary': {
                // Return null since we removed this view, but keeping the case in case of legacy usage
                return null;
            }
            case 'digitalSeaBag': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DigitalSeaBagWidget />
                    </Animated.View>
                );
            }
            case 'adminFeed': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <AdminFeedWidget />
                    </Animated.View>
                );
            }
            case 'mnaProcess': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <MNAProcessWidget />
                    </Animated.View>
                );
            }
            case 'careerReadiness': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <ReadinessWidget />
                    </Animated.View>
                );
            }
            case 'detailerContact': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <DetailerContactWidget />
                    </Animated.View>
                );
            }
            case 'selectionDetail': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <SelectionDetailWidget />
                    </Animated.View>
                );
            }
            case 'pcsSummaryWidget': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSSummaryWidget />
                    </Animated.View>
                );
            }
            case 'ordersProcessingWidget': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <OrdersProcessingWidget />
                    </Animated.View>
                );
            }
            case 'pcsHeroBanner': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSHeroBanner />
                    </Animated.View>
                );
            }
            case 'baseWelcomeKit': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <BaseWelcomeKit />
                    </Animated.View>
                );
            }
            case 'arrivalBriefing': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <ArrivalBriefingWidget />
                    </Animated.View>
                );
            }
            case 'travelClaimHUD': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <TravelClaimHUDWidget />
                    </Animated.View>
                );
            }
            case 'travelClaimUrgency': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <TravelClaimHUDWidget />
                    </Animated.View>
                );
            }
            case 'liquidationTracker': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <LiquidationTrackerWidget />
                    </Animated.View>
                );
            }
            case 'pcsTaskTracker': {
                return (
                    <Animated.View entering={FadeInUp.delay(delay).duration(350).springify()}>
                        <PCSTaskTracker />
                    </Animated.View>
                );
            }
            case 'missionBrief': {
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
                            onQuickRequest={() => {
                                if (user?.id) {
                                    const draft = generateQuickDraft('standard', user.id);
                                    setQuickLeaveDraft(draft);
                                    setShowQuickLeave(true);
                                } else {
                                    Alert.alert('Error', 'User not found. Cannot create quick leave.');
                                }
                            }}
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
    }, [isDemoMode, selectedPhase, assignmentPhase, obliserv, pcsPhase, subPhase, data, leaveRequests, leaveBalance, activeUCTPhase]);

    const sections = React.useMemo(() => {
        const feed: string[] = [];

        // Priority 0: Core Status (Always Top)
        feed.push('missionStatus');

        // Priority 1: Critical Action Items (OBLISERV only applies during Selection before orders are released)
        if (assignmentPhase === 'SELECTION') {
            feed.push('obliserv');
        }

        // Priority 2: PCS Lifecycle Integration
        // Surface the correct Phase Core Widget based on assignment/PCS lifecycle moment
        if (assignmentPhase === 'ORDERS_PROCESSING') {
            // Focus: Tracking administrative order steps
            feed.push('ordersProcessingWidget');
        } else if (assignmentPhase === 'ORDERS_RELEASED' || pcsPhase === 'CHECK_IN' || subPhase === 'ACTIVE_TRAVEL') {
            // Focus: Active PCS Workflow
            if (activeUCTPhase === 3) {
                // Exceptional case: Operational Travel Tools trump the UCT visually
                feed.push('transitSegmentWidget');
                feed.push('travelReceiptLoggerWidget');
                // Removed redundant receiptCapture and missionBrief components to resolve conflict
            } else if (activeUCTPhase === 4) {
                // Focus: Post-Arrival reporting procedures
                feed.push('arrivalBriefing');
            } else {
                // Focus: Plan Your Move & Check-in. Summary Dashboard linking to workflows.
                feed.push('pcsSummaryWidget');
            }
            feed.push('digitalOrdersWallet');
        } else {
            // Priority 3: Career Discovery & Selection Details (if NOT in PCS processing)
            if (assignmentPhase === 'SELECTION') {
                feed.push('selectionDetail');
            } else if (assignmentPhase === 'ON_RAMP') {
                feed.push('careerReadiness');
                feed.push('discoveryStatus');
            } else if (assignmentPhase === 'NEGOTIATION') {
                feed.push('negotiationWidget'); // Consolidated Billet Explorer & Slate Summary
            }
        }

        // Anchor: Universal Utilities (Never omit these, sit at the bottom of the feed)
        feed.push('digitalSeaBag');
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

                        <View className="flex-row items-center justify-between px-4 pt-3 pb-3">
                            <View className="flex-row items-center">
                                <Text
                                    style={{
                                        textShadowColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.4)',
                                        textShadowOffset: { width: 0, height: 1 },
                                        textShadowRadius: 4,
                                        color: isDark ? '#FFFFFF' : '#0F172A'
                                    }}
                                    className="text-[28px] font-black tracking-tighter"
                                >
                                    MyCompass
                                </Text>
                            </View>

                            <Pressable
                                onPress={() => Alert.alert('Notifications', 'No new notifications at this time.')}
                                hitSlop={12}
                                className="w-10 h-10 rounded-full items-center justify-center bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 active:opacity-70"
                            >
                                <Bell color={isDark ? '#E2E8F0' : '#334155'} size={20} strokeWidth={2.5} />
                            </Pressable>
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
                        getItemType={(item: string) => item}
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
