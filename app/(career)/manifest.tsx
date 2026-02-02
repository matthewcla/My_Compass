import { JobCard } from '@/components/JobCard';
import { useFeedback } from '@/hooks/useFeedback';
import { SmartBenchItem, useAssignmentStore } from '@/store/useAssignmentStore';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ArrowLeft, Undo2 } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ManifestScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const { showFeedback, FeedbackComponent } = useFeedback();

    const {
        getManifestItems,
        promoteToSlate,
        swipe, // used for removing (swipe left)
        recoverBillet,
        mode
    } = useAssignmentStore();

    const items = useMemo(() => {
        // "Archive" = Nopes (Left Swipes)
        return getManifestItems('archived');
    }, [getManifestItems, mode]);

    const handleRecover = useCallback((billetId: string) => {
        recoverBillet(billetId, 'user-123');
        showFeedback('Recovered to Bench.', 'success');
    }, [recoverBillet, showFeedback]);

    const renderItem = useCallback(({ item }: { item: SmartBenchItem }) => {
        return (
            <View className="px-4 py-2 opacity-70 grayscale">
                <JobCard
                    billet={item.billet}
                    onBuyPress={() => { }}
                    isProcessing={false}
                    applicationStatus={undefined}
                />

                {/* Actions Bar - Archive Actions */}
                <View className="flex-row gap-3 mt-2 justify-end">
                    <TouchableOpacity
                        onPress={() => handleRecover(item.billet.id)}
                        className="flex-row items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-lg"
                    >
                        <Undo2 size={16} className="text-blue-600 dark:text-blue-400" color={isDark ? '#60A5FA' : '#2563EB'} />
                        <Text className="text-blue-700 dark:text-blue-300 font-bold text-sm">Recover</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }, [isDark, handleRecover]);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* Feedback Component */}
            <FeedbackComponent />

            <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                        <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                        Archive
                    </Text>
                </View>

                {/* Content */}
                {items.length === 0 ? (
                    <View style={{ minHeight: 300, flex: 1 }}>
                        <View className="flex-1 items-center justify-center py-20 px-8">
                            <Text className="text-slate-400 text-lg font-bold mb-2">
                                No archived items.
                            </Text>
                            <Text className="text-slate-500 text-center text-sm mb-6">
                                Items you pass on (swipe left) will appear here.
                            </Text>
                        </View>
                    </View>
                ) : (
                    <FlashList<SmartBenchItem>
                        data={items}
                        renderItem={renderItem}
                        // @ts-expect-error: estimatedItemSize is missing in the type definition despite being mandatory
                        estimatedItemSize={280}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
