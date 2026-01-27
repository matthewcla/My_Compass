import { DiscoveryCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { HubSkeleton } from '@/components/skeletons/HubSkeleton';
import { useColorScheme } from '@/components/useColorScheme';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useSession } from '@/lib/ctx';
import { useUserStore } from '@/store/useUserStore';
import { formatRank } from '@/utils/format';
import { useShallow } from 'zustand/react/shallow';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useUserStore(useShallow(state => state.user));
    const insets = useSafeAreaInsets();
    const { data, loading, error } = useDashboardData();

    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Header Logic: Display personalized welcome or generic fallback
    const renderGreeting = () => {
        if (!user) return "Welcome";
        const isPrivacyMode = user.privacyMode ?? true;
        if (isPrivacyMode) return "Welcome, Sailor";

        const lastName = user.displayName.split(' ').pop();
        const formattedRank = formatRank(user.rank);
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

    const handleSuperLikedPress = () => {
        // Navigate to saved billets filtered by super-liked
        router.push('/(assignment)/assignments' as any);
    };

    // Loading state
    if (loading && !data) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-slate-950">
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <HubSkeleton />
            </View>
        );
    }

    // Error state with fallback
    if (error && !data) {
        return (
            <View className="flex-1 bg-slate-50 dark:bg-slate-950">
                {/* <ScreenHeader title="HUB" subtitle={renderGreeting()} /> */}
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-slate-400 text-center">{error}</Text>
                </View>
            </View>
        );
    }



    const sections = ['status', 'discovery', 'stats', 'leave'];

    const renderItem = ({ item }: { item: string }) => {
        switch (item) {
            case 'status':
                return (
                    <View style={{ marginBottom: 12 }}>
                        <StatusCard
                            nextCycle={data?.cycle?.cycleId ?? '24-02'}
                            daysUntilOpen={data?.cycle?.daysRemaining ?? 12}
                        />
                    </View>
                );
            case 'discovery':
                return (
                    <View style={{ marginBottom: 24 }}>
                        <DiscoveryCard
                            matchingBillets={data?.cycle?.matchingBillets ?? 0}
                            onStartExploring={handleStartExploring}
                            onJobPreferencesPress={handleJobPreferencesPress}
                        />
                    </View>
                );
            case 'stats':
                return (
                    <View style={{ marginBottom: 24 }}>
                        <StatsCard
                            liked={data?.stats?.liked ?? 0}
                            superLiked={data?.stats?.superLiked ?? 0}
                            passed={data?.stats?.passed ?? 0}
                            onPressSuperLiked={handleSuperLikedPress}
                        />
                    </View>
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
                    />
                );
            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <FlashList
                data={sections}
                renderItem={renderItem}
                // @ts-expect-error: estimatedItemSize is missing in the type definition of @shopify/flash-list v2.2.0 despite being mandatory
                estimatedItemSize={150}
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 16,
                    paddingTop: 10,
                    paddingBottom: 100 + insets.bottom,
                }}
            />
        </View>
    );
}
