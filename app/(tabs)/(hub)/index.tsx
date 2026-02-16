import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
import { MenuTile } from '@/components/menu/MenuTile';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ScreenGradient } from '@/components/ScreenGradient';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { DemoPhase } from '@/constants/DemoData';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useGlobalSpotlightHeaderSearch } from '@/hooks/useGlobalSpotlightHeaderSearch';
import { useSession } from '@/lib/ctx';
import { useDemoStore } from '@/store/useDemoStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { usePCSPhase, usePCSStore, useSubPhase } from '@/store/usePCSStore';
import { useUserStore } from '@/store/useUserStore';
import { LeaveRequest } from '@/types/schema';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import {
    Briefcase,
    FileText,
    Map as MapIcon,
    User
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const AnimatedFlashList = (Platform.OS === 'web'
    ? FlashList
    : Animated.createAnimatedComponent(FlashList)) as React.ComponentType<any>;

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useUserStore(useShallow(state => state.user));
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

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const isDemoMode = useDemoStore(state => state.isDemoMode);
    const selectedPhase = useDemoStore(state => state.selectedPhase);
    const assignmentPhase = useDemoStore(state => state.assignmentPhaseOverride);
    const initializeOrders = usePCSStore(state => state.initializeOrders);
    const obliserv = usePCSStore(state => state.financials.obliserv);
    const pcsPhase = usePCSPhase();
    const subPhase = useSubPhase();

    // Hydrate defaults on mount
    React.useEffect(() => {
        if (user?.id) {
            fetchUserDefaults(user.id);
        }
    }, [user?.id, fetchUserDefaults]);

    // Initialize PCS Orders if in PCS Demo Phase
    React.useEffect(() => {
        if (isDemoMode && selectedPhase === DemoPhase.MY_PCS) {
            initializeOrders();
        }
    }, [isDemoMode, selectedPhase, initializeOrders]);



    const globalSearchConfig = useGlobalSpotlightHeaderSearch();

    // Navigation Handlers
    const handleTilePress = (route: string) => {
        router.push(route as any);
    };

    const handleLeavePress = () => {
        router.push('/leave' as any);
    };

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
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <GlobalTabBar activeRoute="home" />
                </View>
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
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <GlobalTabBar activeRoute="home" />
                </View>
            </ScreenGradient>
        );
    }

    const sections = ['menu'];
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
        // Only show liquidation widget when there's an active liquidation to track
        const liquidation = usePCSStore.getState().financials.liquidation;
        const hasActiveLiquidation = liquidation && liquidation.currentStatus !== 'NOT_STARTED';
        if (hasActiveLiquidation) {
            sections.push('tierTracking');
            sections.push('liquidationTracker');
        }
    }
    // Tracking header always visible above leave
    sections.push('tierTracking');
    sections.push('leave');

    const renderItem = ({ item }: { item: any }) => {
        const isPCSPhase = isDemoMode && selectedPhase === DemoPhase.MY_PCS;

        switch (item) {
            case 'menu':
                return (
                    <View className="mb-2">
                        {/* Row 1 */}
                        <View className="flex-row justify-between mb-4">
                            <View style={{ width: '47%', aspectRatio: 1 }}>
                                <MenuTile
                                    label="My Assignment"
                                    icon={Briefcase}
                                    onPress={() => handleTilePress('/(career)/discovery')}
                                />
                            </View>
                            <View style={{ width: '47%', aspectRatio: 1 }}>
                                <MenuTile
                                    label="My PCS"
                                    icon={MapIcon}
                                    subtitle={isPCSPhase ? "Action Required" : undefined}
                                    onPress={() => handleTilePress(isPCSPhase ? '/(tabs)/(pcs)/pcs' : '/(pcs)')}
                                    locked={!isPCSPhase}
                                    accent={isPCSPhase ? '#D97706' : undefined}
                                />
                            </View>
                        </View>
                        {/* Row 2 */}
                        <View className="flex-row justify-between">
                            <View style={{ width: '47%', aspectRatio: 1 }}>
                                <MenuTile
                                    label="My Leave & Admin"
                                    icon={FileText}
                                    onPress={() => handleTilePress('/(admin)')}
                                />
                            </View>
                            <View style={{ width: '47%', aspectRatio: 1 }}>
                                <MenuTile
                                    label="My Profile"
                                    icon={User}
                                    onPress={() => handleTilePress('/(profile)')}
                                    locked
                                />
                            </View>
                        </View>
                    </View>
                );
            case 'receiptCapture': {
                const { ReceiptScannerWidget } = require('@/components/pcs/widgets/ReceiptScannerWidget');
                return <ReceiptScannerWidget />;
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
                return <BaseWelcomeKit />;
            }
            case 'travelClaimUrgency': {
                const { TravelClaimHUDWidget } = require('@/components/pcs/widgets/TravelClaimHUDWidget');
                return <TravelClaimHUDWidget />;
            }
            case 'liquidationTracker': {
                const { LiquidationTrackerWidget } = require('@/components/pcs/widgets/LiquidationTrackerWidget');
                return <LiquidationTrackerWidget />;
            }
            case 'missionBrief': {
                const { PCSMissionBrief } = require('@/components/pcs/widgets/PCSMissionBrief');
                return <PCSMissionBrief />;
            }
            case 'obliserv':
                return <ObliservBanner variant="widget" />;
            case 'leave':
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
                );
            default:
                return null;
        }
    };

    return (
        <ScreenGradient>
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? Colors.gradient.dark[0] : Colors.gradient.light[0]}
                minTopBarHeight={70}
                topBar={
                    <View className="bg-slate-50 dark:bg-slate-950">
                        <View className="px-4 pt-2">
                            <StatusCard
                                nextCycle={data?.cycle?.cycleId ?? '24-02'}
                                daysUntilOpen={data?.cycle?.daysRemaining ?? 12}
                            />
                        </View>
                        <ScreenHeader
                            title=""
                            subtitle=""
                            withSafeArea={false}
                            searchConfig={globalSearchConfig}
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
                    <AnimatedFlashList
                        ref={listRef}
                        data={sections}
                        renderItem={renderItem}
                        ItemSeparatorComponent={({ leadingItem }: { leadingItem: string }) => (
                            <View style={{ height: typeof leadingItem === 'string' && leadingItem.startsWith('tier') ? 18 : 24 }} />
                        )}
                        ListHeaderComponent={<View style={{ height: 8 }} />}

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

            {/* Quick Leave Overlay (Replaces Native Modal to fix Navigation Context loss) */}
            {quickDraft && (
                <View className="absolute inset-0 z-50 flex-1 justify-center items-center bg-black/60">
                    <Pressable
                        className="absolute inset-0"
                        onPress={() => setQuickDraft(null)}
                    />
                    <QuickLeaveTicket
                        draft={quickDraft}
                        onSubmit={handleQuickLeaveSubmit}
                        onEdit={handleQuickLeaveEdit}
                        onClose={() => setQuickDraft(null)}
                    />
                </View>
            )}
        </ScreenGradient>
    );
}
