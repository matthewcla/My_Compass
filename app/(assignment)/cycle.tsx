import { ManifestRail } from '@/components/cycle/ManifestRail';
import { SlateSlot } from '@/components/cycle/SlateSlot';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Application } from '@/types/schema';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Alert, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CycleScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const {
        applications,
        billets,
        demoteToManifest,
        promoteToSlate,
        getManifestItems,
        swipe // used for moving items to manifest if needed implicitly? No, demoteToManifest handles it
    } = useAssignmentStore();

    // 1. Prepare Slate Slots (Fixed 7 slots)
    // Get active applications, sorted by rank
    const activeApps = useMemo(() => {
        return Object.values(applications)
            .filter(app => ['draft', 'optimistically_locked', 'submitted', 'confirmed'].includes(app.status))
            .sort((a, b) => (a.preferenceRank || 99) - (b.preferenceRank || 99));
    }, [applications]);

    const slots = Array.from({ length: 7 }, (_, i) => {
        const rank = i + 1;
        const app = activeApps.find(a => a.preferenceRank === rank); // Or simply activeApps[i] since we re-rank on demote
        // Ideally we rely on the index of sorted array to fill slots 1-N, and empty N+1...7
        const assignedApp = activeApps[i];

        return {
            rank,
            app: assignedApp,
            billet: assignedApp ? billets[assignedApp.billetId] : undefined
        };
    });

    // 2. Prepare Manifest Rail Data
    const manifestCandidates = useMemo(() => {
        return getManifestItems('candidates');
    }, [getManifestItems, applications, billets]); // Dependencies might need tuning if store identity changes

    // 3. Handlers
    const handleSlotPress = (rank: number, app?: Application) => {
        if (app) {
            // Tapping a filled slot -> Demote (Remove)
            demoteToManifest(app.id);
        } else {
            // Tapping empty slot -> Maybe focus the rail? Or Scroll to it?
            console.log(`Focused slot ${rank}`);
        }
    };

    const handleRailItemPress = (billetId: string) => {
        // Tapping a rail item -> Promote to Slate
        const success = promoteToSlate(billetId, 'user-123'); // TODO: Auth ID
        if (!success) {
            Alert.alert("Slate Full", "You can only have 7 active applications. Remove one from the Slate first.");
        }
    };

    const handleSubmit = async () => {
        if (activeApps.length === 0) {
            Alert.alert("Slate Empty", "Add at least one application locally before submitting.");
            return;
        }

        // Mock submission for now, or call submitSlate action if implemented
        Alert.alert("Submitting...", `Processing ${activeApps.length} applications.`);
        // await submitSlate();
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                    <View className="flex-row items-center gap-4">
                        <Pressable onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                            <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
                        </Pressable>
                        <View>
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">Rank & Stack</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">Cycle 25-1 • 7 Slots Available</Text>
                        </View>
                    </View>

                    <Pressable onPress={() => { /* Info Modal */ }} className="bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-full">
                        <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {activeApps.length}/7 Filled
                        </Text>
                    </Pressable>
                </View>

                {/* 1. TOP SECTION: THE SLATE (Flexible grow) */}
                <View className="flex-1">
                    <ScrollView
                        className="flex-1 px-4 py-4"
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="gap-3">
                            {slots.map((slot) => (
                                <SlateSlot
                                    key={slot.rank}
                                    rank={slot.rank}
                                    app={slot.app}
                                    billet={slot.billet}
                                    onPress={() => handleSlotPress(slot.rank, slot.app)}
                                // isLocked={false} // logic for frozen slots
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* 2. BOTTOM SECTION: QUICK MANIFEST RAIL (Fixed Height) */}
                <View className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-8 shadow-2xl">
                    {/* Rail Header */}
                    <View className="flex-row items-center justify-between px-4 py-3">
                        <Text className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Quick Manifest
                        </Text>
                        <Pressable onPress={() => router.push('/(career)/manifest')}>
                            <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                Manage Bench
                            </Text>
                        </Pressable>
                    </View>

                    {/* Horizontal Rail */}
                    <View className="h-40">
                        {/* H-40 is arbitrary, ManifestRail might adjust height dynamically */}
                        <ManifestRail
                            items={manifestCandidates}
                            onItemPress={handleRailItemPress}
                        />
                    </View>

                    {/* Submit Footer Injected Here or Separate? */}
                    <View className="px-4 pt-4">
                        <Pressable
                            onPress={handleSubmit}
                            className={`w-full flex-row items-center justify-center gap-2 py-4 rounded-xl shadow-lg ${activeApps.length > 0
                                    ? 'bg-blue-600 active:bg-blue-700'
                                    : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                            disabled={activeApps.length === 0}
                        >
                            <Send size={20} color="white" />
                            <Text className="text-white font-bold text-lg">
                                Submit {activeApps.length} Applications
                            </Text>
                        </Pressable>
                    </View>
                </View>

            </SafeAreaView>
        </View>
    );
}
