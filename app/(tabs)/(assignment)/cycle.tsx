import { ManifestRail } from '@/components/cycle/ManifestRail';
import { SlateSlot } from '@/components/cycle/SlateSlot';
import { ScreenGradient } from '@/components/ScreenGradient';
import { selectManifestItems, useAssignmentStore } from '@/store/useAssignmentStore';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import React, { useCallback, useMemo } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';

const SLOTS_COUNT = 7;
const SLOTS_INDICES = Array.from({ length: SLOTS_COUNT }, (_, i) => i);

export default function CycleScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const {
        applications,
        billets,
        realDecisions,
        demoteToManifest,
        promoteToSlate,
        reorderApplications,
        moveApplication
    } = useAssignmentStore(
        useShallow(state => ({
            applications: state.applications,
            billets: state.billets,
            realDecisions: state.realDecisions,
            demoteToManifest: state.demoteToManifest,
            promoteToSlate: state.promoteToSlate,
            reorderApplications: state.reorderApplications,
            moveApplication: state.moveApplication
        }))
    );

    const manifestCandidates = useMemo(() =>
        selectManifestItems({ billets, realDecisions, applications }, 'candidates'),
        [billets, realDecisions, applications]
    );

    // 1. Prepare Slate Slots (Fixed 7 slots)
    // Get active applications, sorted by rank
    const activeApps = useMemo(() => {
        return Object.values(applications)
            .filter(app => ['draft', 'optimistically_locked', 'submitted', 'confirmed'].includes(app.status))
            .sort((a, b) => (a.preferenceRank || 99) - (b.preferenceRank || 99));
    }, [applications]);

    const slots = SLOTS_INDICES.map((i) => {
        const rank = i + 1;
        // Ideally we rely on the index of sorted array to fill slots 1-N, and empty N+1...7
        const assignedApp = activeApps[i];

        return {
            rank,
            app: assignedApp,
            billet: assignedApp ? billets[assignedApp.billetId] : undefined
        };
    });

    // 3. Handlers
    const handleRemove = useCallback((appId: string) => {
        demoteToManifest(appId);
    }, [demoteToManifest]);

    const handleMoveUp = useCallback((rank: number) => {
        moveApplication(rank - 1, 'up', 'user-123');
    }, [moveApplication]);

    const handleMoveDown = useCallback((rank: number) => {
        moveApplication(rank - 1, 'down', 'user-123');
    }, [moveApplication]);

    const handleRailItemPress = (billetId: string) => {
        const existingApp = Object.values(applications).find(
            app => app.billetId === billetId && !['withdrawn', 'declined'].includes(app.status)
        );
        if (existingApp) {
            Alert.alert("Already in Slate", "This billet is already in your application slate.");
            return;
        }

        const success = promoteToSlate(billetId, 'user-123');
        if (!success) {
            Alert.alert("Slate Full", "You can only have 7 active applications. Remove one from the Slate first.");
        }
    };

    const handleSubmit = async () => {
        if (activeApps.length === 0) {
            Alert.alert("Slate Empty", "Add at least one application locally before submitting.");
            return;
        }

        Alert.alert("Submitting...", `Processing ${activeApps.length} applications.`);
    };

    return (
        <ScreenGradient>
            <SafeAreaView className="flex-1" edges={['top']}>
                {/* Header */}
                <View className="px-4 py-4 flex-row items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-10">
                    <View className="flex-row items-center gap-4">
                        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                            <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
                        </TouchableOpacity>
                        <View>
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">My Applications</Text>
                            <Text className="text-xs text-slate-500 dark:text-slate-400">Cycle 25-1 • 7 Slots Available</Text>
                        </View>
                    </View>

                    <TouchableOpacity onPress={() => { /* Info Modal */ }} className="bg-slate-100 dark:bg-slate-800 py-1.5 px-3 rounded-full">
                        <Text className="text-xs font-bold text-slate-600 dark:text-slate-300">
                            {activeApps.length}/7 Filled
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* 1. TOP SECTION: THE SLATE (Flexible grow) */}
                <View className="flex-1">
                    <ScrollView
                        className="flex-1 px-4 py-4"
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    >
                        <View className="gap-3">
                            {slots.map((slot, index) => (
                                <SlateSlot
                                    key={slot.rank}
                                    rank={slot.rank}
                                    application={slot.app}
                                    billet={slot.billet}
                                    isFirst={index === 0}
                                    isLast={index === activeApps.length - 1}
                                    onRemove={handleRemove}
                                    onMoveUp={handleMoveUp}
                                    onMoveDown={handleMoveDown}
                                />
                            ))}
                        </View>
                    </ScrollView>
                </View>

                {/* 2. BOTTOM SECTION: SAVED JOBS RAIL (Fixed Height) */}
                <View className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 pb-8 shadow-2xl">
                    {/* Rail Header */}
                    <View className="flex-row items-center justify-between px-4 py-3">
                        <Text className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                            Archive
                        </Text>
                        <TouchableOpacity onPress={() => router.push('/(career)/manifest' as any)}>
                            <Text className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                View Archive
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Horizontal Rail */}
                    <View className="h-40">
                        {/* H-40 is arbitrary, ManifestRail might adjust height dynamically */}
                        <ManifestRail
                            items={manifestCandidates}
                            onSelect={(billet) => handleRailItemPress(billet.id)}
                            onSeeAll={() => router.push('/(career)/manifest' as any)}
                        />
                    </View>

                    {/* Submit Footer Injected Here or Separate? */}
                    <View className="px-4 pt-4">
                        <TouchableOpacity
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
                        </TouchableOpacity>
                    </View>
                </View>

            </SafeAreaView>
        </ScreenGradient>
    );
}
