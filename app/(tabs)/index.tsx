import { DiscoveryCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/lib/ctx';
import { useIsHydrating, useUser } from '@/store/useUserStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();
    const { data, loading, error, refetch } = useDashboardData();
    const { isLoading: isSessionLoading } = useSession();
    const isHydrating = useIsHydrating();
    const user = useUser();
    const insets = useSafeAreaInsets();

    // Header Logic: Display personalized welcome or generic fallback while loading
    const renderGreeting = () => {
        if (isSessionLoading || isHydrating || !user) {
            return <View className="w-48 h-8 rounded bg-slate-200 animate-pulse" />;
        }

        const lastName = user.displayName.split(' ').pop();
        const displayName = user.privacyMode
            ? "Sailor"
            : `${user.rank || ''} ${lastName}`.trim();

        return `Welcome, ${displayName}`;
    };

    return (
        <View className="flex-1 bg-systemGray6">
            {/* Header - Fixed at Top */}
            {/* Header - Fixed at Top */}
            <ScreenHeader
                title="HOME"
                subtitle={renderGreeting()}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100 }}
            >
                {/* Loading/Error States */}
                {isSessionLoading || isHydrating ? (
                    <Text className="text-slate-500 text-center mt-10">Loading User Profile...</Text>
                ) : !user ? (
                    <View className="items-center mt-10">
                        <Text className="text-red-500 text-center mb-2">User Profile Error</Text>
                        <Text className="text-slate-400 text-xs text-center">Unable to load user identity.</Text>
                    </View>
                ) : loading ? (
                    <Text className="text-slate-500 text-center mt-10">Loading Dashboard...</Text>
                ) : error ? (
                    <View className="items-center mt-10">
                        <Text className="text-red-500 text-center mb-2">Dashboard Error</Text>
                        <Text className="text-slate-500 text-center">{error}</Text>
                        <Text className="text-blue-500 text-center mt-2" onPress={refetch}>Tap to Retry</Text>
                    </View>
                ) : !data ? (
                    <View className="items-center mt-10">
                        <Text className="text-slate-500 text-center">No Dashboard Data Available</Text>
                        <Text className="text-blue-500 text-center mt-2" onPress={refetch}>Tap to Refresh</Text>
                    </View>
                ) : (
                    /* Dashboard Cards - Flex layout to fill available space */
                    <View style={{ gap: 12 }}>
                        {/* 1. Status Section */}
                        <StatusCard
                            nextCycle={data.cycle.cycleId}
                            daysUntilOpen={data.cycle.daysRemaining}
                        />

                        {/* 2. Stats Section */}
                        <StatsCard
                            liked={data.stats.liked || 0}
                            superLiked={data.stats.superLiked || 0}
                            passed={data.stats.passed || 0}
                            onPressSuperLiked={() => router.push({ pathname: '/(tabs)/recommendations', params: { filter: 'super_liked' } } as any)}
                        />

                        {/* 3. Discovery Section - Takes remaining space */}
                        <View style={{ flex: 1 }}>
                            <DiscoveryCard
                                matchingBillets={data.cycle.matchingBillets || 0}
                                onStartExploring={() => router.push('/(tabs)/discovery' as any)}
                            />
                        </View>

                        {/* 4. Leave Section */}
                        <LeaveCard
                            balance={data.leave.currentBalance}
                            pendingRequest={data.leave.pendingRequestsCount > 0 ? {
                                dates: "Pending Approval",
                                status: "Pending"
                            } : undefined}
                            // @ts-ignore - Route needs to be created
                            onPress={() => router.push('/(tabs)/admin/leave' as any)}
                        />
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
