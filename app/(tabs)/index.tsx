import { DiscoveryCard } from '@/components/dashboard/DiscoveryCard';
import { LeaveCard } from '@/components/dashboard/LeaveCard';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { StatusCard } from '@/components/dashboard/StatusCard';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUser } from '@/store/useUserStore';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    const router = useRouter();
    const { data, loading } = useDashboardData();
    const user = useUser();

    // Header Logic: Display personalized welcome or generic fallback while loading
    const getGreeting = () => {
        if (!user) return "Welcome, Sailor";
        // Assuming displayName is "LCDR Matthew Clark" -> split to get last name, or just use full name if preferred.
        // Spec asked for "Welcome, {rank} {lastName}"
        // Assuming displayName format is "Rank First Last" or similar. 
        // If not parseable, fallback to displayName or rank + "Sailor".

        // A more robust implementation would parse this better or store separate fields.
        // For now, let's use the provided Rank and try to extract Last Name.
        const parts = user.displayName?.split(' ') || [];
        const lastName = parts.length > 1 ? parts[parts.length - 1] : user.displayName;

        return `Welcome, ${user.rank || ''} ${lastName || 'Sailor'}`;
    };

    return (
        <SafeAreaView className="flex-1 bg-systemGray6" edges={['top']}>
            <ScrollView
                contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 20, paddingTop: 10 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Header - Simple Native Text Block */}
                <View className="mb-6 mt-2">
                    <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Welcome Back</Text>
                    <Text className="text-lg font-bold text-slate-900">{getGreeting()}</Text>
                </View>

                {loading || !data ? (
                    // Simple Loading State - Could be fleshed out with Skeletons later
                    <Text className="text-slate-500 text-center mt-10">Loading Dashboard...</Text>
                ) : (
                    <View className="gap-3">
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

                        {/* 3. Discovery Section */}
                        <DiscoveryCard
                            matchingBillets={data.cycle.matchingBillets || 0}
                            onStartExploring={() => router.push('/(tabs)/discovery' as any)}
                        />

                        {/* 4. Leave Section */}
                        <LeaveCard
                            balance={data.leave.currentBalance}
                            pendingRequest={data.leave.pendingRequestsCount > 0 ? {
                                dates: "Pending Approval", // Data hook doesn't provide dates yet, placeholder
                                status: "Pending"
                            } : undefined}
                            // @ts-ignore - Route needs to be created
                            onPress={() => router.push('/(tabs)/admin/leave' as any)}
                        />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
