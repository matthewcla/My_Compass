import DiscoveryEntryWidget from '@/components/assignment/DiscoveryEntryWidget';
import SlateSummaryWidget from '@/components/assignment/SlateSummaryWidget';
import { useColorScheme } from '@/components/useColorScheme';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useUserStore } from '@/store/useUserStore';
import { formatRate } from '@/utils/format';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

export default function AssignmentDashboard() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const user = useUserStore(useShallow(state => state.user));

    const renderGreeting = () => {
        if (!user) return "Welcome";
        const isPrivacyMode = user.privacyMode ?? true;
        if (isPrivacyMode) return "Welcome, Sailor";

        const lastName = user.displayName.split(' ').pop();
        const formattedRank = formatRate(user.rating, user.rank);
        return `Welcome, ${formattedRank} ${lastName}`.trim();
    };

    useScreenHeader("MY ASSIGNMENT", renderGreeting());

    return (
        <LinearGradient
            colors={isDark ? ['#0f172a', '#020617'] : ['#f8fafc', '#e2e8f0']} // Dark: Slate-900 -> Slate-950, Light: Slate-50 -> Slate-200
            style={{ flex: 1 }}
        >
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 16,
                    paddingTop: 10,
                    paddingBottom: 100 + insets.bottom,
                    gap: 20
                }}
            >
                {/* Content */}
                <SlateSummaryWidget onPress={() => router.push('/(assignment)/cycle')} />

                <DiscoveryEntryWidget onPress={() => router.push('/(career)/discovery')} />

                {/* Footer Info */}
                <View className="mt-4 mb-8">
                    <Text className="text-center text-slate-400 text-sm">
                        Cycle 24-02 closes in 2 days.
                    </Text>
                </View>

            </ScrollView>
        </LinearGradient>
    );
}
