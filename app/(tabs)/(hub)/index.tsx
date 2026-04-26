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
        <View className="flex-1 bg-surface-container-low rounded-sm p-5 border border-outline-variant border-l-[4px] border-l-secondary-container shadow-apple-sm">
            <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                    <MaterialIcons name="warning" size={20} color={isDark ? Colors.dark.status.warning : Colors.light.status.warning} />
                    <Text className="font-headline text-lg text-on-surface">Action Required</Text>
                </View>
                {topActions.length > 0 && (
                    <View className="bg-error px-2 py-1 rounded-sm">
                        <Text className="font-headline text-on-error text-xs">{topActions.length} Pending</Text>
                    </View>
                )}
            </View>
            
            {topActions.length === 0 ? (
                <View className="flex-1 items-center justify-center py-4">
                    <MaterialIcons name="check-circle" size={40} color={isDark ? Colors.dark.status.success : Colors.light.status.success} />
                    <Text className="mt-3 font-label text-on-surface-variant text-center">All Caught Up!</Text>
                </View>
            ) : (
                <View className="flex-col gap-3">
                    {topActions.map((action, i) => (
                        <Pressable 
                            key={action.id} 
                            onPress={() => router.push(action.route as any)}
                            className="bg-surface-container-lowest active:bg-surface-container-high active:scale-[0.99] transition-transform p-4 rounded-sm border border-outline-variant shadow-sm"
                        >
                            {/* Eyebrow Badge Placement */}
                            {action.dueText && (
                                <View className="bg-error self-start px-2 py-0.5 rounded-sm mb-2">
                                    <Text className="font-headline text-on-error text-[9px] uppercase tracking-wider">{action.dueText}</Text>
                                </View>
                            )}
                            
                            <View className="mb-2">
                                <Text className="font-headline text-on-surface mb-1">{action.title}</Text>
                                <Text className="text-on-surface-variant text-xs leading-relaxed">{action.description}</Text>
                            </View>
                            
                            <View className="flex-row items-center mt-2">
                                {/* Explicit text-white for contrast safety */}
                                <View className="bg-primary dark:bg-primary-container px-4 py-1.5 rounded-sm shadow-sm">
                                    <Text className="font-headline text-white dark:text-on-primary-container text-xs">{action.actionText}</Text>
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
        <View className="flex-1 bg-primary dark:bg-surface-container-low rounded-sm p-5 border border-primary dark:border-outline-variant shadow-apple-sm justify-between overflow-hidden">
            <View className="absolute right-[-30px] top-[10px] opacity-10">
                <MaterialIcons name="star" size={180} color={Colors.dark.labelPrimary} />
            </View>
            <View className="z-10">
                <Text className="font-label text-xs tracking-widest uppercase text-white dark:text-on-surface mb-4">Career Snapshot</Text>
                <View className="flex-row items-center justify-start mb-4 gap-4">
                    <View className="w-14 h-14 bg-surface-container-lowest shadow-sm rounded-sm items-center justify-center border border-outline-variant">
                        <Text className="font-display text-xl text-primary">E5</Text>
                    </View>
                    <View className="flex-1">
                        {/* Explicit text-white for contrast safety */}
                        <Text className="font-headline text-lg text-white dark:text-on-surface">Petty Officer 2nd Class</Text>
                        <Text className="font-label text-xs text-white/80 dark:text-on-surface-variant mt-0.5">Time in Rate: 2y 4m</Text>
                    </View>
                </View>
            </View>
            <View className="z-10 mt-6">
                <View className="flex-row justify-between items-end mb-2">
                    <Text className="font-label text-white/80 dark:text-on-surface-variant text-[10px] uppercase tracking-wider">Next Advancement Cycle</Text>
                    <Text className="font-headline text-white dark:text-on-surface text-sm">Mar 2026</Text>
                </View>
                <View className="h-1.5 w-full bg-white/20 dark:bg-surface-container-highest rounded-full overflow-hidden mb-2">
                    <View className="h-full bg-inverse-primary dark:bg-primary w-[60%] rounded-full" />
                </View>
                <View className="flex-row justify-between">
                    <Text className="font-label text-white/80 dark:text-on-surface-variant text-[9px]">Evals Complete</Text>
                    <Text className="font-label text-white/80 dark:text-on-surface-variant text-[9px]">Exam Prep</Text>
                </View>
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
        <View className="flex-1 bg-surface-container-low rounded-sm p-5 border border-outline-variant shadow-apple-sm">
            <Text className="font-headline text-lg text-on-surface mb-4">Quick Links</Text>
            <View className="flex-row flex-wrap justify-between gap-y-4">
                {links.map((link, i) => (
                    <Pressable 
                        key={i} 
                        onPress={() => router.push(link.route as any)}
                        className="w-[48%] items-center bg-surface-container-lowest active:bg-surface-container-high active:scale-[0.97] transition-transform p-3 rounded-sm border border-outline-variant shadow-sm"
                    >
                        <View className="bg-surface-container p-3 rounded-sm mb-2">
                            <MaterialIcons name={link.icon as any} size={24} color={isDark ? Colors.dark.secondaryContainer : Colors.light.primary} />
                        </View>
                        <Text className="font-label text-xs text-center text-on-surface-variant">{link.label}</Text>
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
                    <View className="overflow-hidden bg-surface-container-lowest">
                        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: isDark ? Colors.dark.surfaceBorder : Colors.light.surfaceBorder }} />
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
                                        <Menu color={isDark ? Colors.dark.primary : Colors.light.text} size={24} />
                                    </Pressable>
                                )}
                                <Text className="text-2xl font-display tracking-tighter text-primary dark:text-primary">
                                    MyCompass
                                </Text>
                            </View>
                            <View className="flex items-center">
                                <Pressable
                                    onPress={() => Alert.alert('Notifications', 'No new notifications at this time.')}
                                    hitSlop={12}
                                    className="p-2 hover:bg-surface-variant active:scale-95 transition-transform duration-100"
                                >
                                    <Bell color={isDark ? Colors.dark.primary : Colors.light.text} size={24} />
                                </Pressable>
                            </View>
                        </View>
                        <View
                            className="w-full"
                            style={{
                                height: 1,
                                backgroundColor: isDark ? Colors.dark.surfaceBorder : Colors.light.surfaceBorder
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
                        <View className="relative w-full h-48 md:h-64 bg-black overflow-hidden border-b-4 border-secondary-container mb-6">
                            <LinearGradient
                                colors={['rgba(0,0,0,0.8)', 'transparent']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0.66, y: 0 }}
                                style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', zIndex: 10 }}
                            />
                            <Image
                                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDlk0EQB3AeeQZRB_5FtVwpVzBeqCT1W0966Y_uc6miRy4RCqlHyN9u54wBUvBVHYSZRT4jH_YTMJBVtfzeOFakU7hnZeBDqDQc4kr75YMTipBs1Q-HH3H_CLaPpMIHeQAKyvdSp7yqWaR97VxVKNC2goiGrKZUb3eKHO3sYi9P4Bit9Zm5XVJPzd744sVbF4gk13iIY5aFsSs-Yl0VPPeMoJ5IILKO0levwWL_ggbVRUN-lfLGR_OIlDWX1XhwAsFq_JerR59KS3o' }}
                                style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.5 }}
                                contentFit="cover"
                            />
                            <View className="absolute bottom-6 left-5 z-20">
                                <Text className="font-label text-secondary-container tracking-widest text-sm mb-1 uppercase">MyNavy HR</Text>
                                <Text className="font-display text-4xl md:text-5xl text-white tracking-tighter uppercase leading-none">FEED</Text>
                            </View>
                        </View>

                        {/* Bento Grid Layout */}
                        <View className="px-4 md:px-6 pb-6 flex-col gap-4">
                            {/* Greeting Section */}
                            <View className="mb-2 mt-2">
                                <Text className="font-display text-2xl text-primary dark:text-on-surface mb-1">Good Morning, Petty Officer</Text>
                                <Text className="font-headline text-on-surface-variant text-sm">Here is your daily briefing and required actions.</Text>
                            </View>

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
                <View className="flex-1 justify-center px-4 bg-slate-900 dark:bg-black/80 shadow-none">
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
