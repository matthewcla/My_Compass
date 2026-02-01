import { JobCard } from '@/components/JobCard';
import { useFeedback } from '@/hooks/useFeedback';
import { SmartBenchItem, useAssignmentStore } from '@/store/useAssignmentStore';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { ArrowLeft, Trash2, Undo2 } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'candidates' | 'favorites' | 'archived';

export default function ManifestScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [activeTab, setActiveTab] = useState<Tab>('candidates');
    const { showFeedback, FeedbackComponent } = useFeedback();

    const {
        getManifestItems,
        promoteToSlate,
        swipe, // used for removing (swipe left)
        recoverBillet,
        mode
    } = useAssignmentStore();

    const items = useMemo(() => {
        // If in Sandbox mode, maybe filter differently or show warning?
        // Assuming Manifest works for real mode primarily, or unified?
        // Store implementation of getManifestItems depends on realDecisions usually.
        // Let's assume Manifest is consistent with current mode or just purely real context 
        // as "Discovery Funnel" usually implies real job hunt.
        // But let's check store: `getManifestItems` uses `realDecisions`.
        // So this is strictly for 'Real' mode items.
        return getManifestItems(activeTab);
    }, [activeTab, getManifestItems, mode]); // Re-fetch when tab changes

    const handlePromote = useCallback((billetId: string) => {
        const success = promoteToSlate(billetId, 'user-123');
        if (success) {
            showFeedback('Drafted! Added to Slate.', 'success');
        } else {
            console.warn('Slate is full');
            showFeedback('Slate Full.', 'warning');
        }
    }, [promoteToSlate, showFeedback]);

    const handleRemove = useCallback(async (billetId: string) => {
        // Move to Archive (Nope)
        await swipe(billetId, 'left', 'user-123');
        showFeedback('Archived.', 'info');
    }, [swipe, showFeedback]);

    const handleRecover = useCallback((billetId: string) => {
        recoverBillet(billetId);
        showFeedback('Recovered to Candidates.', 'success');
    }, [recoverBillet, showFeedback]);

    const renderItem = useCallback(({ item }: { item: SmartBenchItem }) => {
        const isArchived = activeTab === 'archived';

        return (
            <View className={`px-4 py-2 ${isArchived ? 'opacity-60 grayscale' : ''}`}>
                <JobCard
                    billet={item.billet}
                    onBuyPress={() => { }} // Replaced by custom actions below
                    isProcessing={false}
                    applicationStatus={undefined} // Not an active application
                />

                {/* Actions Bar */}
                <View className="flex-row gap-3 mt-2 justify-end">
                    {isArchived ? (
                        <TouchableOpacity
                            onPress={() => handleRecover(item.billet.id)}
                            className="flex-row items-center gap-2 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-lg"
                        >
                            <Undo2 size={16} className="text-blue-600 dark:text-blue-400" color={isDark ? '#60A5FA' : '#2563EB'} />
                            <Text className="text-blue-700 dark:text-blue-300 font-bold text-sm">Recover</Text>
                        </TouchableOpacity>
                    ) : (
                        <>
                            {/* Remove Action */}
                            <TouchableOpacity
                                onPress={() => handleRemove(item.billet.id)}
                                className="flex-row items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg"
                            >
                                <Trash2 size={16} className="text-slate-500" color="#64748B" />
                                <Text className="text-slate-600 dark:text-slate-400 font-medium text-sm">Remove</Text>
                            </TouchableOpacity>

                            {/* Promote Action */}
                            <TouchableOpacity
                                onPress={() => handlePromote(item.billet.id)}
                                className="flex-row items-center gap-2 bg-blue-600 px-4 py-2 rounded-lg shadow-sm"
                            >
                                <Text className="text-white font-bold text-sm">Add to Slate</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        );
    }, [activeTab, isDark, handleRecover, handleRemove, handlePromote]);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* Feedback Component */}
            <FeedbackComponent />

            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center gap-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                        <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-slate-900 dark:text-white">Manifest</Text>
                </View>

                {/* Segmented Control */}
                <View className="px-4 py-4">
                    <View className="flex-row bg-slate-200 dark:bg-slate-800 rounded-lg p-1">
                        {(['candidates', 'favorites', 'archived'] as Tab[]).map((tab) => {
                            const isActive = activeTab === tab;
                            return (
                                <TouchableOpacity
                                    key={tab}
                                    onPress={() => setActiveTab(tab)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 8,
                                        alignItems: 'center',
                                        borderRadius: 6,
                                        backgroundColor: isActive ? (isDark ? '#334155' : 'white') : 'transparent',
                                        shadowColor: isActive ? '#000' : undefined,
                                        shadowOffset: isActive ? { width: 0, height: 1 } : undefined,
                                        shadowOpacity: isActive ? 0.05 : undefined,
                                        shadowRadius: isActive ? 2 : undefined,
                                        elevation: isActive ? 1 : undefined,
                                    }}
                                >
                                    <Text className={`capitalize font-bold text-xs ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                        {tab}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Content */}
                {items.length === 0 ? (
                    <View style={{ minHeight: 300, flex: 1 }}>
                        <View className="flex-1 items-center justify-center py-20 px-8">
                            <Text className="text-slate-400 text-lg font-bold mb-2">
                                {activeTab === 'archived' ? 'No archived items.' : 'No candidates yet.'}
                            </Text>
                            <Text className="text-slate-500 text-center text-sm mb-6">
                                {activeTab === 'archived'
                                    ? "Items you swipe left on will appear here."
                                    : "Go to Discovery and swipe right on billets to build your manifest."}
                            </Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(career)/discovery')}
                                className="bg-blue-600 px-6 py-3 rounded-full active:bg-blue-700"
                                style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }}
                            >
                                <Text className="text-white font-bold text-sm uppercase tracking-wide">Find More</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <FlashList
                        data={items}
                        renderItem={renderItem}
                        estimatedItemSize={280}
                        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
