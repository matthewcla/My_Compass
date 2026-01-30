import { DiscoveryCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { QuickLeaveTicket } from '@/components/leave/QuickLeaveTicket';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useSession } from '@/lib/ctx';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useUserStore } from '@/store/useUserStore';
import { LeaveRequest } from '@/types/schema';
import { formatRate } from '@/utils/format';
import { FlashList } from '@shopify/flash-list';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useUserStore(useShallow(state => state.user));
    const generateQuickDraft = useLeaveStore(state => state.generateQuickDraft);
    const fetchUserDefaults = useLeaveStore(state => state.fetchUserDefaults);
    const insets = useSafeAreaInsets();
    const { data, loading, error } = useDashboardData();

    const [quickDraft, setQuickDraft] = useState<LeaveRequest | null>(null);

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Hydrate defaults on mount
    React.useEffect(() => {
        if (user?.id) {
            fetchUserDefaults(user.id);
        }
    }, [user?.id, fetchUserDefaults]);

    // Header Logic: Display personalized welcome or generic fallback
    const renderGreeting = () => {
        if (!user) return "Welcome";
        const isPrivacyMode = user.privacyMode ?? true;
        if (isPrivacyMode) return "Welcome, Sailor";

        const lastName = user.displayName.split(' ').pop();
        // Use formatRate to handle "Rate" (Enlisted) vs "Rank" (Officer)
        const formattedRank = formatRate(user.rating, user.rank);
        return `Welcome, ${formattedRank} ${lastName}`.trim();
    };

    // Hoist Header State
    useScreenHeader("HUB", renderGreeting());

    // Navigation Handlers
    const handleStartExploring = () => {
        router.push('/(assignment)/assignments' as any);
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

    const handleSuperLikedPress = () => {
        // Navigate to saved billets filtered by super-liked
        router.push('/(assignment)/assignments' as any);
    };

    // Loading state
    if (loading && !data) {
        return (
            <LinearGradient
                colors={['#0f172a', '#1e293b']} // Slate-900 to Slate-800
                style={{ flex: 1 }}
            >
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <HubSkeleton />
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
            </LinearGradient>
        );
    }



    const sections = ['status', 'discovery', 'stats', 'leave'];

    const renderItem = ({ item }: { item: string }) => {
        switch (item) {
            case 'status':
                return (
                    <StatusCard
                        nextCycle={data?.cycle?.cycleId ?? '24-02'}
                        daysUntilOpen={data?.cycle?.daysRemaining ?? 12}
                    />
                );
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
                        pendingRequest={
                            data?.leave?.pendingRequestsCount
                                ? { dates: 'Mar 15-22', status: 'Pending' }
                                : undefined
                        }
                        onPress={handleLeavePress}
                        onQuickRequest={handleQuickLeavePress}
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
            <FlashList
                data={sections}
                renderItem={renderItem}
                ItemSeparatorComponent={() => <View style={{ height: 24 }} />}
                // @ts-expect-error: estimatedItemSize is missing in the type definition of @shopify/flash-list v2.2.0 despite being mandatory
                estimatedItemSize={150}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 16,
                    paddingTop: 10,
                    paddingBottom: 100 + insets.bottom,
                }}
            />

            {/* Quick Leave Modal Overlay */}
            <Modal
                visible={!!quickDraft}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setQuickDraft(null)}
            >
                <View className="flex-1 justify-center items-center bg-black/60 relative">
                    <Pressable
                        className="absolute inset-0"
                        onPress={() => setQuickDraft(null)}
                    />

                    {quickDraft && (
                        <QuickLeaveTicket
                            draft={quickDraft}
                            onSubmit={handleQuickLeaveSubmit}
                            onEdit={handleQuickLeaveEdit}
                        />
                    )}
                </View>
            </Modal>
        </LinearGradient>
    );
}
