import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import type { DiscoveryBadgeCategory } from '@/components/dashboard/DiscoveryCard';
import { DiscoveryStatusCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
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
import { LeaveRequest } from '@/types/schema';
import { getShadow } from '@/utils/getShadow';
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    Zap
} from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Alert, Platform, Pressable, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInUp, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useCurrentProfile();
    const generateQuickDraft = useLeaveStore(state => state.generateQuickDraft);
    const fetchUserDefaults = useLeaveStore(state => state.fetchUserDefaults);
    const insets = useSafeAreaInsets();
    const { data, loading, error } = useDashboardData();

    type FilterTab = 'HUB' | 'CAREER' | 'ADMIN';
    const [activeFilter, setActiveFilter] = useState<FilterTab>('HUB');

    const [quickDraft, setQuickDraft] = useState<LeaveRequest | null>(null);
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
                            onQuickRequest={handleQuickLeavePress}
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

    // Navigation Handlers
    const handleQuickLeavePress = () => {
        if (!user) return;
        const draft = generateQuickDraft('weekend', user.id);
        setQuickDraft(draft);
    };

    const handleQuickLeaveSubmit = () => {
        setQuickDraft(null);
        Alert.alert("Success", "Leave request submitted successfully!");
    };

    const handleQuickLeaveEdit = () => {
        setQuickDraft(null);
        // Ideally pass draft params to wizard, but for now just navigate to leave root
        router.push('/leave' as any);
    };

    const sections = React.useMemo(() => {
        const feed: string[] = ['menu'];

        if (activeFilter === 'HUB') {
            // Priority 0: Critical Action Items
            feed.push('obliserv');

            // Priority 1: PCS Active Window Navigation
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

                // Spotlight Pattern: Halt execution here to preserve pure focus
                return feed;
            }

            // Priority 2: Mission Brief (Active Orders)
            if (['ORDERS_PROCESSING', 'ORDERS_RELEASED'].includes(assignmentPhase ?? '') && (pcsPhase === 'ORDERS_NEGOTIATION' || pcsPhase === 'TRANSIT_LEAVE')) {
                feed.push('missionBrief');
            }
            if (assignmentPhase === 'ORDERS_RELEASED' && (pcsPhase === 'ORDERS_NEGOTIATION' || pcsPhase === 'TRANSIT_LEAVE')) {
                feed.push('digitalOrdersWallet');
                if (dependentCount > 0 || hasShipments) {
                    feed.push('hhgWeightGauge');
                }
                feed.push('leaveImpact');
                feed.push('pcsTaskTracker');

                // Spotlight Pattern: Halt execution here
                return feed;
            }

            // Priority 3: Career Discovery & Selection Details
            let isMNAActive = false;
            if (assignmentPhase === 'SELECTION') {
                feed.push('selectionDetail');
                feed.push('selectionChecklist');
                isMNAActive = true;
            } else if (assignmentPhase === 'ON_RAMP') {
                feed.push('careerReadiness');
                feed.push('discoveryStatus');
                isMNAActive = true;
            } else if (assignmentPhase === 'NEGOTIATION') {
                feed.push('slateSummary');
                isMNAActive = true;
            }

            // Priority 4: Peacetime Promotion ("The Garrison State")
            // Only show these general admin tools if we aren't in intense MNA/PCS phases
            if (!isMNAActive && !pcsPhase) {
                feed.push('tierThisWeek');
                feed.push('digitalSeaBag');
                feed.push('tierTracking');
                feed.push('leave');
            }
        }
        else if (activeFilter === 'CAREER') {
            // Priority 0: Critical Action Items
            feed.push('obliserv');

            // In the CAREER tab, we exclusively show Career-focused widgets.
            if (!assignmentPhase || assignmentPhase === 'DISCOVERY' || assignmentPhase === 'ON_RAMP') {
                feed.push('mnaProcess');
                feed.push('careerReadiness');
                feed.push('discoveryStatus');
            }
            if (assignmentPhase === 'NEGOTIATION') {
                feed.push('slateSummary');
                feed.push('discoveryStatus');
                feed.push('detailerContact');
            }
            if (assignmentPhase === 'SELECTION') {
                feed.push('slateSummary');
                feed.push('selectionDetail');
                feed.push('selectionChecklist');
            }
            if (['SELECTION', 'ORDERS_PROCESSING', 'ORDERS_RELEASED'].includes(assignmentPhase ?? '') && (pcsPhase === 'ORDERS_NEGOTIATION' || pcsPhase === 'TRANSIT_LEAVE')) {
                feed.push('missionBrief');
            }
            if (pcsPhase === 'CHECK_IN' || subPhase === 'ACTIVE_TRAVEL') {
                feed.push('baseWelcomeKit');
            }
            // Once we migrate the BilletSwipeCard and NegotiationStatus, they will go here.
        }
        else if (activeFilter === 'ADMIN') {
            // In the ADMIN tab, we exclusively show administrative paperwork.
            feed.push('adminFeed');

            // Priority Admin elements
            if (subPhase === 'ACTIVE_TRAVEL' || (pcsPhase === 'CHECK_IN' && (!liquidationStatus || liquidationStatus === 'NOT_STARTED'))) {
                feed.push('travelClaimUrgency');
            }

            feed.push('tierTracking'); // Header before passive trackers
            const hasActiveLiquidation = liquidationStatus && liquidationStatus !== 'NOT_STARTED';
            if (hasActiveLiquidation && pcsPhase === 'CHECK_IN') {
                feed.push('liquidationTracker');
            }

            // leave is currently integrated into the top global nav buttons, so it may be redundant here
            // but we'll leave it for now until a user asks to remove it.
            feed.push('leave');
            // Once we migrate Eval widgets, they will go here.
        }

        return feed;
    }, [activeFilter, assignmentPhase, pcsPhase, subPhase, liquidationStatus, hasShipments, dependentCount]);

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
                            {/* NEW: Filter Chips below the hidden header */}
                            <Animated.View
                                className="w-full mb-1"
                                entering={FadeInUp.duration(400).delay(100)}
                            >
                                <Animated.ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}
                                >
                                    {/* Leave Quick Action */}
                                    <TouchableOpacity
                                        onPress={() => router.push('/leave' as any)}
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                                        }}
                                        className="h-10 w-10 rounded-full flex-row items-center justify-center border border-black/5 dark:border-white/10"
                                    >
                                        <Zap size={18} color={isDark ? '#e2e8f0' : '#475569'} />
                                    </TouchableOpacity>

                                    {/* Active Hub Chip */}
                                    <TouchableOpacity
                                        onPress={() => setActiveFilter('HUB')}
                                        style={{
                                            backgroundColor: activeFilter === 'HUB' ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)') : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                                            borderColor: activeFilter === 'HUB' ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)') : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                            borderWidth: 1
                                        }}
                                        className={`h-10 px-4 rounded-full flex-row items-center justify-center`}
                                    >
                                        <Text style={{ color: activeFilter === 'HUB' ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B') }} className={`${activeFilter === 'HUB' ? 'font-semibold' : 'font-medium'} text-[15px]`}>Hub</Text>
                                    </TouchableOpacity>

                                    {/* Career Chip */}
                                    <TouchableOpacity
                                        onPress={() => setActiveFilter('CAREER')}
                                        style={{
                                            backgroundColor: activeFilter === 'CAREER' ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)') : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                                            borderColor: activeFilter === 'CAREER' ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)') : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                            borderWidth: 1
                                        }}
                                        className={`h-10 px-4 rounded-full flex-row items-center justify-center`}
                                    >
                                        <Text style={{ color: activeFilter === 'CAREER' ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B') }} className={`${activeFilter === 'CAREER' ? 'font-semibold' : 'font-medium'} text-[15px]`}>My Career</Text>
                                    </TouchableOpacity>

                                    {/* Admin Chip */}
                                    <TouchableOpacity
                                        onPress={() => setActiveFilter('ADMIN')}
                                        style={{
                                            backgroundColor: activeFilter === 'ADMIN' ? (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)') : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'),
                                            borderColor: activeFilter === 'ADMIN' ? (isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.15)') : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'),
                                            borderWidth: 1
                                        }}
                                        className={`h-10 px-4 rounded-full flex-row items-center justify-center`}
                                    >
                                        <Text style={{ color: activeFilter === 'ADMIN' ? (isDark ? '#FFFFFF' : '#0F172A') : (isDark ? '#94A3B8' : '#64748B') }} className={`${activeFilter === 'ADMIN' ? 'font-semibold' : 'font-medium'} text-[15px]`}>My Admin</Text>
                                    </TouchableOpacity>
                                </Animated.ScrollView>
                            </Animated.View>
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
                        ListHeaderComponent={
                            <View className="pb-6 pt-2">
                                <View style={getShadow({ shadowColor: isDark ? '#94a3b8' : '#64748b', shadowOpacity: isDark ? 0.1 : 0.12, shadowRadius: 12, elevation: 3 })}>
                                    <StatusCard
                                        nextCycle={data?.cycle?.cycleId ?? '24-02'}
                                        daysUntilOpen={isDemoMode && demoTimeline ? demoTimeline.daysUntilOpen : (data?.cycle?.daysRemaining ?? 12)}
                                    />
                                </View>
                            </View>
                        }
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

            {/* QW3: Animated Quick Leave Overlay (was static View) */}
            {quickDraft && (
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(150)}
                    className="absolute inset-0 z-50 flex-1 justify-center items-center bg-black/60"
                >
                    <Pressable
                        className="absolute inset-0"
                        onPress={() => setQuickDraft(null)}
                    />
                    <Animated.View entering={FadeInUp.duration(250).springify()} className="w-full px-5 max-w-[420px]">
                        <QuickLeaveTicket
                            draft={quickDraft}
                            onSubmit={handleQuickLeaveSubmit}
                            onEdit={handleQuickLeaveEdit}
                            onClose={() => setQuickDraft(null)}
                        />
                    </Animated.View>
                </Animated.View>
            )}
        </ScreenGradient>
    );
}
