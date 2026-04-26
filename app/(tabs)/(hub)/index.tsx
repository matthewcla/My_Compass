import { CollapsibleScaffold } from '@/components/CollapsibleScaffold';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
import { PCSDevPanel } from '@/components/pcs/PCSDevPanel';
import { ScreenGradient } from '@/components/ScreenGradient';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useHubPriority } from '@/hooks/useHubPriority';
import { useSession } from '@/lib/ctx';
import { useDemoStore, useCurrentProfile } from '@/store/useDemoStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { Bell, Menu } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { Alert, Modal, Platform, Pressable, Text, View, ScrollView } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { useShallow } from 'zustand/react/shallow';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';

const AnimatedScrollView = (Platform.OS === 'web'
    ? ScrollView
    : Animated.createAnimatedComponent(ScrollView)) as React.ComponentType<any>;

// Bento Grid Components
const ActionRequiredWidget = () => {
    const actions = useHubPriority();
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const topActions = actions;

    return (
        <View className="flex-1 bg-white dark:bg-[#1c1b1b] rounded-sm p-5 border border-slate-200 dark:border-[#ffffff1a] shadow-sm">
            <View className="flex-row items-center justify-between mb-4">
                <Text className="font-headline text-lg font-bold text-on-surface dark:text-white">Action Required</Text>
                {topActions.length > 0 && (
                    <View className="bg-error/10 dark:bg-[#93000a] px-2 py-1 rounded-sm">
                        <Text className="text-error dark:text-white font-bold text-xs">{topActions.length}</Text>
                    </View>
                )}
            </View>
            
            {topActions.length === 0 ? (
                <View className="flex-1 items-center justify-center py-4">
                    <MaterialIcons name="check-circle" size={40} color="#10B981" />
                    <Text className="mt-3 font-medium text-slate-500 dark:text-slate-400 text-center">All Caught Up!</Text>
                </View>
            ) : (
                <View className="flex-col gap-3">
                    {topActions.map((action, i) => (
                        <Pressable 
                            key={action.id} 
                            onPress={() => router.push(action.route as any)}
                            className="bg-slate-50 dark:bg-[#0e0e0e] p-4 rounded-sm flex-row items-start border border-slate-200 dark:border-white/10"
                        >
                            <View className="bg-primary/10 dark:bg-white/5 p-2 rounded-sm mr-3">
                                <MaterialIcons name={action.icon} size={20} color={isDark ? '#fdc400' : Colors.light.primary} />
                            </View>
                            <View className="flex-1">
                                <Text className="font-bold text-on-surface dark:text-white mb-1">{action.title}</Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-xs mb-2">{action.description}</Text>
                                <View className="flex-col gap-1 items-start mt-1">
                                    {action.dueText && (
                                        <Text className="text-error dark:text-red-400 font-bold text-[10px] uppercase tracking-wider">{action.dueText}</Text>
                                    )}
                                    <Text className="text-primary dark:text-[#fdc400] font-semibold text-sm">{action.actionText}</Text>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </View>
            )}
        </View>
    );
};

const CareerSnapshotWidget = () => {
    return (
        <View className="flex-1 bg-white dark:bg-[#1c1b1b] rounded-sm p-5 border border-slate-200 dark:border-[#ffffff1a] shadow-sm justify-between">
            <View>
                <Text className="font-headline text-lg font-bold text-on-surface dark:text-white mb-4">Career Snapshot</Text>
                <View className="items-center justify-center mb-4">
                    <View className="w-16 h-16 bg-slate-50 dark:bg-[#0e0e0e] rounded-sm items-center justify-center mb-2 border border-slate-200 dark:border-white/10">
                        <Text className="font-black text-2xl text-slate-800 dark:text-white">E5</Text>
                    </View>
                    <Text className="font-bold text-slate-800 dark:text-slate-200 text-center">Petty Officer 2nd Class</Text>
                </View>
            </View>
            <View className="bg-slate-50 dark:bg-[#0e0e0e] p-3 rounded-sm border border-slate-200 dark:border-white/10">
                <Text className="text-slate-500 dark:text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Next Advancement Cycle</Text>
                <Text className="text-on-surface dark:text-white font-semibold">Mar 2026</Text>
            </View>
        </View>
    );
};

const QuickLinksWidget = () => {
    const router = useRouter();
    const isDark = useColorScheme() === 'dark';
    const links = [
        { icon: 'flight-land', label: 'Check-In', route: '/pcs/check-in' },
        { icon: 'receipt', label: 'Travel Claim', route: '/travel-claim/request' },
        { icon: 'event', label: 'Leave', route: '/leave/request' },
        { icon: 'admin-panel-settings', label: 'Admin', route: '/(tabs)/(admin)' }
    ];

    return (
        <View className="flex-1 bg-white dark:bg-[#1c1b1b] rounded-sm p-5 border border-slate-200 dark:border-[#ffffff1a] shadow-sm">
            <Text className="font-headline text-lg font-bold text-on-surface dark:text-white mb-4">Quick Links</Text>
            <View className="flex-row flex-wrap justify-between gap-y-4">
                {links.map((link, i) => (
                    <Pressable 
                        key={i} 
                        onPress={() => router.push(link.route as any)}
                        className="w-[48%] items-center bg-slate-50 dark:bg-[#0e0e0e] p-3 rounded-sm border border-slate-200 dark:border-white/10"
                    >
                        <View className="bg-primary/10 dark:bg-white/5 p-3 rounded-sm mb-2">
                            <MaterialIcons name={link.icon as any} size={24} color={isDark ? '#fdc400' : Colors.light.primary} />
                        </View>
                        <Text className="font-semibold text-xs text-center text-slate-700 dark:text-slate-300">{link.label}</Text>
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const HubLeaveItem = React.memo(({ 
    onQuickRequest 
}: { 
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
            onExpand={() => {}}
        />
    );
});

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useCurrentProfile();
    const generateQuickDraft = useLeaveStore(state => state.generateQuickDraft);
    const fetchUserDefaults = useLeaveStore(state => state.fetchUserDefaults);
    const { data, loading, error } = useDashboardData();

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

    // Hydrate defaults on mount
    React.useEffect(() => {
        if (user?.id) {
            fetchUserDefaults(user.id);
        }
    }, [user?.id, fetchUserDefaults]);

    // Loading state
    if (loading && !data) {
        return (
            <ScreenGradient>
                <HubSkeleton />
            </ScreenGradient>
        );
    }

    // Error state with fallback
    if (error && !data) {
        return (
            <ScreenGradient>
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
                    <View className="overflow-hidden bg-surface-container-lowest dark:bg-[#0A0A0A]">
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }} />
                        <View className="flex-row items-center justify-between px-5 pt-3 pb-3">
                            <View className="flex-row items-center gap-3">
                                {Platform.OS === 'web' && (
                                    <Pressable
                                        onPress={() => {
                                            const { toggleDrawer } = require('@/store/useUIStore').useUIStore.getState();
                                            toggleDrawer();
                                        }}
                                        hitSlop={12}
                                        className="p-2 hover:bg-surface-variant active:scale-95 transition-transform duration-100"
                                    >
                                        <Menu color={isDark ? '#aec6fe' : '#0F172A'} size={24} />
                                    </Pressable>
                                )}
                                <Text className="text-xl font-black font-headline tracking-tighter text-primary dark:text-primary">
                                    MyCompass
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
                                height: 1,
                                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
                            }}
                        />
                    </View>
                }
                contentContainerStyle={{ paddingHorizontal: 0 }}
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
                    <AnimatedScrollView
                        onScroll={onScroll}
                        onScrollBeginDrag={onScrollBeginDrag}
                        onScrollEndDrag={onScrollEndDrag}
                        onLayout={onLayout}
                        onContentSizeChange={onContentSizeChange}
                        scrollEnabled={scrollEnabled}
                        scrollEventThrottle={scrollEventThrottle}
                        contentContainerStyle={[contentContainerStyle, { paddingBottom: 150 }]}
                        showsVerticalScrollIndicator={false}
                        className="flex-1"
                    >
                        {/* Header Image Area */}
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
                                <Text className="font-label text-secondary-container font-bold tracking-widest text-sm mb-1 uppercase">MyNavy HR</Text>
                                <Text className="font-display text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase leading-none">FEED</Text>
                            </View>
                        </View>

                        {/* Bento Grid Layout */}
                        <View className="px-4 md:px-6 pb-6 flex-col gap-4">
                            {/* Top Row */}
                            <View className="flex-col md:flex-row gap-4 w-full">
                                <Animated.View entering={FadeInUp.delay(0).duration(350).springify()} className="flex-1 md:flex-[2]">
                                    <ActionRequiredWidget />
                                </Animated.View>
                                <Animated.View entering={FadeInUp.delay(50).duration(350).springify()} className="flex-1 md:flex-[1]">
                                    <CareerSnapshotWidget />
                                </Animated.View>
                            </View>
                            
                            {/* Bottom Row */}
                            <View className="flex-col md:flex-row gap-4 w-full">
                                <Animated.View entering={FadeInUp.delay(100).duration(350).springify()} className="flex-1 md:flex-[2]">
                                    <HubLeaveItem onQuickRequest={handleQuickRequest} />
                                </Animated.View>
                                <Animated.View entering={FadeInUp.delay(150).duration(350).springify()} className="flex-1 md:flex-[1]">
                                    <QuickLinksWidget />
                                </Animated.View>
                            </View>
                            {/* Spacer to clear bottom pill */}
                            <View className="h-24 w-full" />
                        </View>
                    </AnimatedScrollView>
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
