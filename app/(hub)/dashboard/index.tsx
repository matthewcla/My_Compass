import { ScreenHeader } from '@/components/ScreenHeader';
import { useSession } from '@/lib/ctx';
import { useUser } from '@/store/useUserStore';
import { formatRank } from '@/utils/format';
import { DrawerActions } from '@react-navigation/native';
import { useNavigation, useRouter } from 'expo-router';
import { Anchor, FileText, Map, User } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function HubDashboard() {
    const router = useRouter();
    const navigation = useNavigation();
    const { isLoading: isSessionLoading } = useSession(); // Keep hook calls for stability
    const user = useUser();
    const insets = useSafeAreaInsets();

    // Header Logic: Display personalized welcome or generic fallback
    const renderGreeting = () => {
        if (!user) return "Welcome";
        const isPrivacyMode = user.privacyMode ?? true;
        if (isPrivacyMode) return "Welcome, Sailor";

        const lastName = user.displayName.split(' ').pop();
        const formattedRank = formatRank(user.rank);
        return `Welcome, ${formattedRank} ${lastName}`.trim();
    };

    const cards = [
        {
            label: 'My Assignment',
            icon: Anchor,
            onPress: () => router.replace('/(assignment)/assignments'), // Mapped 'explore' to actual route
            color: '#3b82f6', // blue-500
        },
        {
            label: 'My PCS',
            icon: Map,
            onPress: () => router.replace('/(pcs)/orders'),
            color: '#10b981', // emerald-500
        },
        {
            label: 'My Admin',
            icon: FileText,
            onPress: () => router.replace('/(admin)/requests'),
            color: '#f59e0b', // amber-500
        },
        {
            label: 'Profile',
            icon: User,
            onPress: () => navigation.dispatch(DrawerActions.openDrawer()),
            color: '#8b5cf6', // violet-500
        },
    ];

    return (
        <View className="flex-1 bg-slate-50 dark:bg-neutral-900">
            <ScreenHeader
                title="HUB"
                subtitle={renderGreeting()}
            />

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                    padding: 16,
                    paddingBottom: 100 + insets.bottom,
                }}
            >
                <View className="flex-row flex-wrap justify-between gap-4">
                    {cards.map((card, index) => (
                        <Pressable
                            key={index}
                            onPress={card.onPress}
                            className="w-[47%] aspect-square bg-white dark:bg-slate-800 rounded-2xl p-4 justify-between shadow-sm active:opacity-90 active:scale-95"
                            style={{ elevation: 2 }}
                        >
                            <View className="w-12 h-12 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-700">
                                <card.icon size={24} color={card.color} />
                            </View>
                            <View>
                                <Text className="text-slate-900 dark:text-white text-lg font-bold">
                                    {card.label}
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                                    Tap to view
                                </Text>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}
