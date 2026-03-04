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
import { FlashList } from '@shopify/flash-list';
import { BlurView } from 'expo-blur';
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
                const tierLabel = item === 'tierRightNow' ? '⚓  Right Now'
                    : item === 'tierThisWeek' ? '📋  This Week'
                        : '📡  Tracking';
                return (
                    <View className="flex-row items-center mt-1 mb-0.5">
                        <View className="bg-slate-800/60 dark:bg-slate-700/40 rounded-full px-3 py-1.5 border border-slate-600/30 dark:border-slate-500/20">
                            <Text className="text-[10px] font-black tracking-[2px] uppercase text-slate-300 dark:text-slate-300">
                                {tierLabel}
                            </Text>
                        </View>
                        <View className="flex-1 h-px bg-slate-700/30 dark:bg-slate-600/20 ml-3" />
                    </View>
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

    const sections = ['menu'];
    // Show DiscoveryStatusCard on Hub during Discovery through Negotiation phases
    if (!assignmentPhase || assignmentPhase === 'DISCOVERY' || assignmentPhase === 'ON_RAMP' || assignmentPhase === 'NEGOTIATION') {
        sections.push('discoveryStatus');
    }
    // Show standalone receipt capture on Home Hub during Phase 3 (ACTIVE_TRAVEL) only.
    // Phase 2 (PLANNING) shares TRANSIT_LEAVE but doesn't need receipt capture yet.
    // In Phase 4, receipt capture is integrated into TravelClaimHUDWidget.
    if (pcsPhase === 'TRANSIT_LEAVE' && subPhase === 'ACTIVE_TRAVEL') sections.push('receiptCapture');
    // Surface Mission Brief on Home Hub from Selection onward only
    if (['SELECTION', 'ORDERS_PROCESSING', 'ORDERS_RELEASED'].includes(assignmentPhase ?? '') && (pcsPhase === 'ORDERS_NEGOTIATION' || pcsPhase === 'TRANSIT_LEAVE')) {
        sections.push('missionBrief');
    }
    // Surface Phase 4 urgency widgets on the Home Hub — streamlined
    if (pcsPhase === 'CHECK_IN') {
        sections.push('tierThisWeek');
        sections.push('baseWelcomeKit');
        sections.push('travelClaimUrgency');
        // Reactive liquidation check (QW4: no longer uses getState())
        const hasActiveLiquidation = liquidationStatus && liquidationStatus !== 'NOT_STARTED';
        if (hasActiveLiquidation) {
            sections.push('tierTracking');
            sections.push('liquidationTracker');
        }
    }
    // Tracking header always visible above leave
    sections.push('tierTracking');
    sections.push('leave');


    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                minTopBarHeight={minHeaderHeight}
                topBar={
                    <BlurView intensity={isDark ? 80 : 60} tint={isDark ? "dark" : "light"}>
                        <View className="px-4 pt-4">
                            <StatusCard
                                nextCycle={data?.cycle?.cycleId ?? '24-02'}
                                daysUntilOpen={isDemoMode && demoTimeline ? demoTimeline.daysUntilOpen : (data?.cycle?.daysRemaining ?? 12)}
                            />
                        </View>
                        <View onLayout={(e) => setMinHeaderHeight(Math.round(e.nativeEvent.layout.height))}>
                            <ScreenHeader
                                title=""
                                subtitle=""
                                withSafeArea={false}
                            />
                            {/* NEW: Filter Chips below the hidden header */}
                            <Animated.View
                                className="w-full mt-4 mb-2"
                                entering={FadeInUp.duration(400).delay(100)}
                            >
                                <Animated.ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12, alignItems: 'center' }}
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
                                        style={{
                                            backgroundColor: '#0A84FF',
                                        }}
                                        className="h-10 px-5 rounded-full flex-row items-center justify-center"
                                    >
                                        <Text style={{ color: '#ffffff' }} className="font-semibold text-[15px]">Hub</Text>
                                    </TouchableOpacity>

                                    {/* Career Chip (Inactive) */}
                                    <TouchableOpacity
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                        }}
                                        className="h-10 px-5 rounded-full flex-row items-center justify-center border border-black/5 dark:border-white/10"
                                    >
                                        <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="font-medium text-[15px]">My Career</Text>
                                    </TouchableOpacity>

                                    {/* Admin Chip */}
                                    <TouchableOpacity
                                        onPress={() => router.push('/(admin)' as any)}
                                        style={{
                                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                                        }}
                                        className="h-10 px-5 rounded-full flex-row items-center justify-center border border-black/5 dark:border-white/10"
                                    >
                                        <Text style={{ color: isDark ? '#94A3B8' : '#64748B' }} className="font-medium text-[15px]">My Admin</Text>
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
                        ItemSeparatorComponent={({ leadingItem }: { leadingItem: string }) => (
                            <View style={{ height: typeof leadingItem === 'string' && leadingItem.startsWith('tier') ? 18 : 24 }} />
                        )}
                        // Pull the list content physically underneath the glass header
                        ListHeaderComponent={<View style={{ height: 0, marginTop: -20 }} />}
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
