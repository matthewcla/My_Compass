import { DiscoveryCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useColorScheme } from '@/components/useColorScheme';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useSession } from '@/lib/ctx';
import { useUser } from '@/store/useUserStore';
import { formatRank } from '@/utils/format';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HubDashboard() {
    const router = useRouter();
    const { isLoading: isSessionLoading } = useSession();
    const user = useUser();
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
            <LinearGradient
                colors={['#0f172a', '#1e293b']} // Slate-900 to Slate-800
                style={{ flex: 1 }}
            >
                <ScreenHeader title="HUB" subtitle={renderGreeting()} />
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#3b82f6" />
                    <Text className="text-slate-400 mt-4">Loading dashboard...</Text>
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
                <ScreenHeader title="HUB" subtitle={renderGreeting()} />
                <View className="flex-1 items-center justify-center px-8">
                    <Text className="text-slate-400 text-center">{error}</Text>
                </View>
            </LinearGradient>
        );
    }



    return (
        <LinearGradient
            colors={isDark ? ['#0f172a', '#020617'] : ['#f8fafc', '#e2e8f0']} // Dark: Slate-900 -> Slate-950, Light: Slate-50 -> Slate-200
            style={{ flex: 1 }}
        >

            <ScreenHeader
                title="HUB"
                subtitle={renderGreeting()}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 16,
                    paddingTop: 10,
                    paddingBottom: 100 + insets.bottom,
                    gap: 12,
                }}
            >
                {/* Cycle Status Banner */}
                <StatusCard
                    nextCycle={data?.cycle?.cycleId ?? '24-02'}
                    daysUntilOpen={data?.cycle?.daysRemaining ?? 12}
                />

                {/* Vertical Stack Layout */}
                <View className="flex-col gap-6">
                    {/* Primary Hero: Discovery */}
                    <DiscoveryCard
                        matchingBillets={data?.cycle?.matchingBillets ?? 0}
                        onStartExploring={handleStartExploring}
                        onJobPreferencesPress={handleJobPreferencesPress}
                    />

                    {/* Secondary Actions */}
                    <StatsCard
                        liked={data?.stats?.liked ?? 0}
                        superLiked={data?.stats?.superLiked ?? 0}
                        passed={data?.stats?.passed ?? 0}
                        onPressSuperLiked={handleSuperLikedPress}
                    />

                    <LeaveCard
                        balance={data?.leave?.currentBalance ?? 0}
                        pendingRequest={
                            data?.leave?.pendingRequestsCount
                                ? { dates: 'Mar 15-22', status: 'Pending' }
                                : undefined
                        }
                        onPress={handleLeavePress}
                    />
                </View>
            </ScrollView>
        </LinearGradient>
    );
}
