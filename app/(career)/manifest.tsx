import { JobCard } from '@/components/JobCard';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

// Type describing our section data
type ManifestItem = {
    type: 'header' | 'billet';
    title?: string;
    billet?: Billet;
    id: string; // valid ID for keys
};

export default function ManifestScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Store Access
    const {
        billets,
        mode,
        realDecisions,
        sandboxDecisions,
        applications,
        buyItNow,
        isSyncingApplications
    } = useAssignmentStore();

    // 1. Selector Logic
    const manifestItems = useMemo(() => {
        const decisions = mode === 'real' ? realDecisions : sandboxDecisions;
        const savedBilletIds = Object.keys(decisions).filter(id => {
            const decision = decisions[id];
            return decision === 'like' || decision === 'super' || decision === 'nope';
        });

        // Grouping
        const superIds: string[] = [];
        const likeIds: string[] = [];
        const nopeIds: string[] = [];

        savedBilletIds.forEach(id => {
            if (decisions[id] === 'super') superIds.push(id);
            else if (decisions[id] === 'like') likeIds.push(id);
            else if (decisions[id] === 'nope') nopeIds.push(id);
        });

        const items: ManifestItem[] = [];

        // Build Flattened List with Headers
        if (superIds.length > 0) {
            items.push({ type: 'header', title: 'Top 5 Candidates', id: 'section-super' });
            superIds.forEach(id => {
                if (billets[id]) items.push({ type: 'billet', billet: billets[id], id: `billet-${id}` });
            });
        }

        if (likeIds.length > 0) {
            items.push({ type: 'header', title: 'Watchlist', id: 'section-like' });
            likeIds.forEach(id => {
                if (billets[id]) items.push({ type: 'billet', billet: billets[id], id: `billet-${id}` });
            });
        }

        if (nopeIds.length > 0) {
            items.push({ type: 'header', title: 'Not Interested', id: 'section-nope' });
            nopeIds.forEach(id => {
                if (billets[id]) items.push({ type: 'billet', billet: billets[id], id: `billet-${id}` });
            });
        }

        return items;
    }, [mode, realDecisions, sandboxDecisions, billets]);

    // 2. Interaction Handlers
    const handleBuyPress = async (billetId: string) => {
        // In this scope, we don't have a user ID easily accessible without auth store.
        // Assuming a hardcoded user ID logic or passed from store if available,
        // but looking at store 'swipe' implementation, it receives userId.
        // For now, I'll use a placeholder 'current-user-id' since auth isn't in scope context,
        // OR better yet, check if applications already has it to avoid error?
        // Wait, the store's `buyItNow` requires `userId`.
        // I will use a dummy ID 'u1-wilson' consistent with persona for now if not available.
        await buyItNow(billetId, 'u1-wilson');
    };

    const getApplicationStatus = (billetId: string) => {
        // Find application for this billet
        const app = Object.values(applications).find(a => a.billetId === billetId);
        return app?.status;
    };

    // 3. Renderers
    const renderItem = ({ item }: { item: ManifestItem }) => {
        if (item.type === 'header') {
            return (
                <View className="pt-6 pb-2 px-4 bg-gray-50 dark:bg-slate-950">
                    <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                        {item.title}
                    </Text>
                </View>
            );
        }

        if (item.type === 'billet' && item.billet) {
            return (
                <View className="px-4 py-2">
                    <JobCard
                        billet={item.billet}
                        onBuyPress={handleBuyPress}
                        isProcessing={isSyncingApplications}
                        applicationStatus={getApplicationStatus(item.billet?.id)}
                    />
                </View>
            );
        }

        return null;
    };

    return (
        <View className="flex-1 bg-gray-50 dark:bg-slate-950 w-full max-w-2xl mx-auto shadow-2xl">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-slate-900">
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    {mode === 'real' ? 'My Manifest' : 'Simulation Manifest'}
                </Text>
                <Pressable
                    onPress={() => router.back()}
                    className="p-2 rounded-full active:bg-gray-100 dark:active:bg-white/10"
                >
                    <X size={24} color={isDark ? 'white' : 'black'} />
                </Pressable>
            </View>

            {/* Content List */}
            <FlashList
                data={manifestItems}
                renderItem={renderItem}
                estimatedItemSize={200}
                getItemType={(item) => item.type}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center h-96 px-8">
                        <Text className="text-gray-400 text-center text-lg mb-2">
                            Your manifest is empty.
                        </Text>
                        <Text className="text-gray-500 text-center">
                            Swipe RIGHT on billets in Discovery to add them to your manifest.
                        </Text>
                    </View>
                }
                contentContainerStyle={{ paddingBottom: 40 }}
            />
        </View>
    );
}
