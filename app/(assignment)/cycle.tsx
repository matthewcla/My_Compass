import { SlateSlot } from '@/components/cycle/SlateSlot';
import { SmartBenchPanel } from '@/components/cycle/SmartBenchPanel';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useUserId } from '@/store/useUserStore';
import { Stack, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { Alert, Platform, ScrollView, StatusBar, Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CycleScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const colorScheme = useColorScheme();

    // --- STORE HOOKS ---
    const userId = useUserId();
    const {
        applications,
        billets,
        fetchBillets,
        getSmartBench,
        draftApplication,
        withdrawApplication,
        buyItNow,
        submitSlate,
        // Reactive state for smart bench calculation
        realDecisions
    } = useAssignmentStore();

    // --- DATA FETCHING ---
    useEffect(() => {
        // Ensure billets are loaded
        fetchBillets();
    }, []);

    // --- COUNTDOWN TIMER ---
    const slateDeadline = useAssignmentStore(state => state.slateDeadline);
    const [timerState, setTimerState] = React.useState<{ text: string, isCritical: boolean } | null>(null);

    useEffect(() => {
        if (!slateDeadline) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const deadline = new Date(slateDeadline).getTime();
            const distance = deadline - now;

            if (distance < 0) {
                setTimerState({ text: "CLOSED", isCritical: true });
                clearInterval(interval);
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            // UX Logic:
            // > 24h: "2d 4h Remaining"
            // < 24h: "23h 59m Left"
            // < 1h:  "59m 30s" (Critical)

            let text = "";
            let isCritical = false;

            if (days > 0) {
                text = `${days}d ${hours}h Remaining`;
            } else if (hours > 0) {
                text = `${hours}h ${minutes}m Left`;
            } else {
                text = `${minutes}m ${seconds}s`;
                isCritical = true;
            }

            setTimerState({ text, isCritical });
        }, 1000);

        return () => clearInterval(interval);
    }, [slateDeadline]);

    // --- DERIVED STATE ---
    const userApplications = useMemo(() => {
        if (!userId) return [];
        return Object.values(applications)
            .filter(app => app.userId === userId && app.status !== 'withdrawn' && app.status !== 'declined')
            .sort((a, b) => (a.preferenceRank || 99) - (b.preferenceRank || 99));
    }, [applications, userId]);

    // Calculate Usage
    const usedCount = userApplications.length;
    const hasDrafts = userApplications.some(app => app.status === 'draft');

    // Smart Bench Items (Reactive)
    const smartBenchItems = useMemo(() => {
        if (!userId) return [];
        return getSmartBench(userId);
    }, [userId, applications, billets, realDecisions]); // Re-run when these change

    // --- HANDLERS ---

    const handleDraftApplication = (billetId: string) => {
        if (!userId) return;
        try {
            draftApplication(billetId, userId);

            // Determine rank for toast
            // We know the new one will be at the end, so usedCount + 1
            const newRank = usedCount + 1;
            Alert.alert("Success", `Added to Slot ${newRank}`);
        } catch (error: any) {
            Alert.alert("Error", error.message);
        }
    };

    const handleWithdraw = (appId: string) => {
        // Confirm before removing? Prompt says "Tapping remove calls withdrawApplication".
        // A confirmation is good UX, but I'll stick to strict reqs first.
        // "Tapping remove on SlateSlot calls withdrawApplication" -> simpler to just call it.
        withdrawApplication(appId);
    };

    const handleLock = (billetId: string) => {
        if (!userId) return;
        // Prompt: "Tapping lock on SlateSlot calls buyItNow"
        buyItNow(billetId, userId);
    };

    const handleSubmitAll = async () => {
        if (Platform.OS === 'web') {
            const confirmed = window.confirm("Are you sure you want to submit your applications?");
            if (confirmed) {
                await submitSlate();
                window.alert("Your slate has been submitted.");
            }
            return;
        }

        Alert.alert(
            "Submit Slate",
            "Are you sure you want to submit your applications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Submit",
                    onPress: async () => {
                        await submitSlate();
                        Alert.alert("Submitted", "Your slate has been submitted.");
                    }
                }
            ]
        );
    };

    // --- RENDER HELPERS ---

    const renderSlateSlots = () => {
        const slots = [];
        for (let i = 1; i <= 7; i++) {
            // Find app for this rank
            // We sorted userApplications by rank, but they might not be contiguous 1..7 if data is messy, 
            // though store logic attempts to keep them 1..N.
            // Safest is to just index into the sorted array since store re-ranks on withdraw.
            const app = userApplications[i - 1]; // 0-indexed array, 1-based rank

            let billet = null;
            if (app) {
                billet = billets[app.billetId];
            }

            // If we have an app but it's not the right rank (data inconsistency), visuals might be off, 
            // but store says it re-ranks. We will trust the array index corresponds to rank 1..N.
            // Actually, we should pass `i` as the rank.

            slots.push(
                <SlateSlot
                    key={i}
                    rank={i}
                    application={app}
                    billet={billet}
                    onRemove={app ? () => handleWithdraw(app.id) : undefined}
                    onLock={app && billet ? () => handleLock(billet.id) : undefined}
                />
            );
        }
        return slots;
    };

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-900">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            {/* PREMIUM HEADER */}
            <View
                className="absolute top-0 left-0 right-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800"
                style={{ paddingTop: insets.top }}
            >
                <View className="h-16 items-center justify-center">
                    <Text className="text-base font-bold text-slate-900 dark:text-white tracking-wider mb-1.5">
                        MY SLATE
                    </Text>
                    {timerState && (
                        <View className={`px-3 py-1 rounded-full ${timerState.isCritical
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-amber-100 dark:bg-amber-900/30'
                            }`}>
                            <Text className={`text-xs font-bold ${timerState.isCritical
                                ? 'text-red-700 dark:text-red-400'
                                : 'text-amber-800 dark:text-amber-400'
                                }`}>
                                {timerState.text}
                            </Text>
                        </View>
                    )}
                </View>
            </View>

            {/* BODY - THE SLATE (Bench Removed) */}
            <ScrollView
                className="flex-1"
                contentContainerStyle={{
                    padding: 16,
                    paddingTop: insets.top + 68,
                    paddingBottom: 220 // Space for Footer + Collapsed Smart Bench
                }}
                showsVerticalScrollIndicator={false}
            >
                {/* SLATE SLOTS */}
                <View className="mb-6">
                    {renderSlateSlots()}
                </View>

                {/* Hint Text if no items */}
                {usedCount === 0 && (
                    <View className="items-center mt-10 opacity-50">
                        <Text className="text-slate-400 text-center">
                            Your slate is empty.{"\n"}Pull up the Smart Bench below to adds job.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* STICKY SMART BENCH PANEL */}
            <SmartBenchPanel
                items={smartBenchItems}
                onSelect={(billet) => handleDraftApplication(billet.id)}
                onSeeAll={() => router.push('/(career)/discovery')}
                bottomOffset={Math.max(insets.bottom, 20) + 60} // Sits on top of footer (approx 80-90px up)
            />

            {/* FOOTER - ACTIONS */}
            <View
                className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 px-6 pt-4 flex-row items-center justify-between gap-3 z-30"
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            >
                {/* Close Button */}
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-14 h-14 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 active:bg-slate-200 dark:active:bg-slate-700 border border-slate-200 dark:border-slate-700"
                    accessibilityLabel="Close Cycle"
                >
                    <X size={24} color={colorScheme === 'dark' ? '#FFFFFF' : '#0F172A'} strokeWidth={2} />
                </TouchableOpacity>

                {/* Submit All Button */}
                <TouchableOpacity
                    onPress={handleSubmitAll}
                    disabled={usedCount === 0}
                    className={`flex-1 h-14 flex-row items-center justify-center rounded-xl ${usedCount > 0
                        ? 'bg-blue-600 active:bg-blue-700 shadow-sm'
                        : 'bg-slate-200 dark:bg-slate-800 opacity-50'
                        }`}
                >
                    <Text className={`font-bold text-base ${usedCount > 0 ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        Submit Slate {usedCount > 0 && `(${usedCount})`}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
