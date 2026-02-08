import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { DiscoveryCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
import GlobalTabBar from '@/components/navigation/GlobalTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useGlobalSpotlightHeaderSearch } from '@/hooks/useGlobalSpotlightHeaderSearch';
import { useSession } from '@/lib/ctx';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useUserStore } from '@/store/useUserStore';
import { LeaveRequest } from '@/types/schema';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
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

    const leaveRequests = React.useMemo(() => {
        return userLeaveRequestIds
            .map(id => leaveRequestsMap[id])
            .filter(Boolean)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }, [userLeaveRequestIds, leaveRequestsMap]);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Hydrate defaults on mount
    React.useEffect(() => {
        if (user?.id) {
            fetchUserDefaults(user.id);
        }
    }, [user?.id, fetchUserDefaults]);



    const globalSearchConfig = useGlobalSpotlightHeaderSearch();

    // Navigation Handlers
    const handleStartExploring = () => {
        router.push('/(career)/discovery' as any);
    };

    const handleJobPreferencesPress = () => {
        router.push('/(profile)/preferences' as any);
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

    const handleSuperLikedPress = React.useCallback(() => {
        // Navigate to saved billets filtered by super-liked
        router.push('/(assignment)' as any);
    }, [router]);

    // Loading state
    if (loading && !data) {
        return (
            <LinearGradient
                colors={['#0f172a', '#1e293b']} // Slate-900 to Slate-800
                style={{ flex: 1 }}
            >
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <HubSkeleton />
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <GlobalTabBar activeRoute="home" />
                </View>
            </LinearGradient>
        );
    }

    // Error state with fallback
    if (error && !data) {
        return (
            <LinearGradient
                colors={['#0f172a', '#1e293b']}
                style={{ flex: 1 }}
            >
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-slate-400 text-center">{error}</Text>
                </View>
                <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
                    <GlobalTabBar activeRoute="home" />
                </View>
            </LinearGradient>
        );
    }

    const sections = ['discovery', 'stats', 'leave'];

    const renderItem = ({ item }: { item: any }) => {
        switch (item) {
            case 'discovery':
                return (
                    <DiscoveryCard
                        matchingBillets={data?.cycle?.matchingBillets ?? 0}
                        onStartExploring={handleStartExploring}
                        onJobPreferencesPress={handleJobPreferencesPress}
                    />
                );
            case 'stats':
                return (
                    <StatsCard
                        liked={data?.stats?.liked ?? 0}
                        superLiked={data?.stats?.superLiked ?? 0}
                        passed={data?.stats?.passed ?? 0}
                        onPressSuperLiked={handleSuperLikedPress}
                    />
                );
            case 'leave':
                return (
                    <LeaveCard
                        balance={data?.leave?.currentBalance ?? 0}
                        requests={leaveRequests}
                        onPressRequest={(req) => {
                            if (req.status === 'draft') {
                                router.push({ pathname: '/leave/request', params: { draftId: req.id } } as any);
                            } else {
                                router.push(`/leave/${req.id}` as any);
                            }
                        }}
                        onQuickRequest={handleQuickLeavePress}
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
        <LinearGradient
            colors={isDark ? ['#0f172a', '#020617'] : ['#f8fafc', '#e2e8f0']} // Dark: Slate-900 -> Slate-950, Light: Slate-50 -> Slate-200
            style={{ flex: 1 }}
        >
            <CollapsibleScaffold
                statusBarShimBackgroundColor={isDark ? '#0f172a' : '#f8fafc'}
                topBar={
                    <View className="bg-slate-50 dark:bg-slate-950 pb-2">
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
                bottomBar={<GlobalTabBar activeRoute="home" />}
                contentContainerStyle={{ paddingHorizontal: 16 }}
            >
                {({ onScroll, contentContainerStyle }) => (
                    <AnimatedFlashList
                        ref={listRef}
                        data={sections}
                        renderItem={renderItem}
                        ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
                        ListHeaderComponent={<View style={{ height: 16 }} />}

                        estimatedItemSize={150}
                        style={{ flex: 1 }}
                        onScroll={onScroll}
                        contentContainerStyle={contentContainerStyle}
                    />
                )}
            </CollapsibleScaffold>

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
                    />
                </View>
            )}
        </LinearGradient>
    );
}
