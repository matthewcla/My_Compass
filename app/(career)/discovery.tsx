import { BilletSwipeCard } from '@/components/BilletSwipeCard';
import { BilletControlBar } from '@/components/discovery/BilletControlBar';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { useColorScheme } from '@/components/useColorScheme';
import { useCinematicDeck } from '@/hooks/useCinematicDeck';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoveryScreen() {
    const router = useRouter();
    const {
        billets,
        billetStack,
        cursor,
        mode,
        setMode,
        sandboxFilters,
        swipe,
        undo,
        realDecisions,
        sandboxDecisions,
        fetchBillets
    } = useAssignmentStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Initial Fetch
    useEffect(() => {
        // Only fetch if empty, or enforce fetch on mount?
        // For now, let's just ensure we have data if stack is empty
        if (billetStack.length === 0) {
            fetchBillets();
        }
    }, []);

    // 1. FILTERING LOGIC
    // We derive the visible deck based on Mode
    const filteredBillets = useMemo(() => {
        // Get full billet objects from stack IDs
        const allBillets = billetStack.map(id => billets[id]).filter(Boolean);

        if (mode === 'real') {
            // REAL MODE: Filter strictly by User's Rank/Designator
            // (Assuming User is E-6 per persona)
            return allBillets.filter(b => b.payGrade === 'E-6');
        } else {
            // SANDBOX MODE: Filter by store.sandboxFilters
            return allBillets.filter(b => {
                // Filter by PayGrade
                if (sandboxFilters.payGrade.length > 0 && !sandboxFilters.payGrade.includes(b.payGrade)) {
                    return false;
                }
                // (Optional) Filter by Location, Designator etc. can be added here
                return true;
            });
        }
    }, [billets, billetStack, mode, sandboxFilters]);


    // 2. DECK LOGIC
    // The store keeps a global cursor. However, since we are filtering the list,
    // the visual index might differ from the store's cursor if we simply skipped items.
    //
    // BUT per requirements/simplicity: The 'billetStack' in store IS the master list.
    // UseCinematicDeck expects a count.
    //
    // CRITICAL FIX FOR UNDO/DECK SYNC:
    // If the store cursor moves, we need to ensure our local deck reflects that.
    // `useCinematicDeck` manages its own 'step'.
    // We should sync `step` to `cursor` mostly, OR let `useCinematicDeck` drive the experience
    // and just call store actions as side effects.
    //
    // Given `useCinematicDeck` is visual state, let's treat it as the primary driver for visual transition,
    // and sync it with the filtered list.

    // Actually, `useCinematicDeck` might be too simple if it just counts 0..N.
    // Because `filteredBillets` changes when we toggle mode!
    //
    // Let's use a ref to the deck to trigger swipes programmatically.
    const deck = useCinematicDeck({
        totalSteps: filteredBillets.length,
        onComplete: () => {
            console.log('Deck Empty');
        }
    });

    // Sync Deck Step with Store Cursor?
    // The store has `cursor`. If we switch modes, `cursor` stays same?
    // No, `cursor` in store is index into `billetStack`.
    // If `filteredBillets` is a subset, `cursor` (index 0..100) doesn't map 1:1 to filtered index.
    //
    // PROBLEM: The store assumes a single linear stack.
    // FILTERING on the UI side breaks the `cursor` logic if `cursor` is just an integer index.
    //
    // WORKAROUND FOR THIS TASK:
    // We will assume the `billetStack` in the store IS the filtered stack effectively,
    // OR we just ignore the store's `cursor` for rendering and purely render `filteredBillets[currentVisualIndex]`.
    //
    // Let's go with: Render `filteredBillets[deck.step]`.
    // When we swipe, we find the ID of `filteredBillets[deck.step]`, and tell store to swipe that ID.
    // We do NOT rely on store.cursor for rendering position in this specific filtered view.

    const currentBillet = filteredBillets[deck.step];

    // Actions
    const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
        if (!currentBillet) return;

        // 1. Visual Transition
        deck.next();

        // 2. Store Update
        // "userId" is mock hardcoded for now or derived
        await swipe(currentBillet.id, direction, 'user-123');
    };

    const handleUndo = () => {
        // 1. Visual Transition
        deck.back();

        // 2. Store Update
        undo();
    };

    // Calculate Saved Count (Shortlist) for Header
    // Count 'like' and 'super' in the current mode's decision map
    const activeDecisions = mode === 'real' ? realDecisions : sandboxDecisions;
    const savedCount = Object.values(activeDecisions).filter(d => d === 'like' || d === 'super').length;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 bg-slate-50 dark:bg-slate-950">
                <Stack.Screen options={{ headerShown: false }} />

                <SafeAreaView className="flex-1" edges={['top']}>
                    {/* Header */}
                    <DiscoveryHeader
                        mode={mode}
                        onToggleMode={() => setMode(mode === 'real' ? 'sandbox' : 'real')}
                        onOpenFilters={() => console.log('Open Filters')}
                        onOpenShortlist={() => router.push('/(career)/manifest')}
                        savedCount={savedCount}
                    />

                    {/* Main Content Area - Centered Vertically */}
                    <View className="flex-1 justify-center w-full">
                        {/* Deck Area */}
                        {/* Height roughly 85% of available space to allow centering */}
                        <View className="h-[85%] items-center relative w-full">
                            <View className="w-full flex-1 max-w-md px-4 pb-12">
                                {/* Render current card */}
                                <View className="flex-1 relative w-full h-full">
                                    {/* Back Card (Next + 1) - Deepest */}
                                    {filteredBillets[deck.step + 2] && (
                                        <View
                                            className="absolute w-full h-full bg-slate-50 dark:bg-slate-800 rounded-[40px] border border-slate-200 dark:border-slate-700 shadow-sm"
                                            style={{
                                                zIndex: 0,
                                                opacity: 0.3,
                                                transform: [{ translateY: 70 }, { scale: 0.9 }],
                                                shadowColor: mode === 'sandbox' ? '#9333ea' : (isDark ? '#3b82f6' : '#000'),
                                                shadowOpacity: (mode === 'sandbox' || isDark) ? 0.3 : 0.1,
                                                shadowOffset: { width: 0, height: 4 },
                                                elevation: 5
                                            }}
                                            pointerEvents="none"
                                        />
                                    )}

                                    {/* Back Card (Next) - Middle */}
                                    {filteredBillets[deck.step + 1] && (
                                        <View
                                            className="absolute w-full h-full"
                                            style={{
                                                zIndex: 5,
                                                opacity: 0.9, // Higher opacity to see content
                                                transform: [{ translateY: 35 }, { scale: 0.95 }],
                                                shadowColor: mode === 'sandbox' ? '#9333ea' : (isDark ? '#3b82f6' : '#000'),
                                                shadowOpacity: (mode === 'sandbox' || isDark) ? 0.3 : 0.1,
                                                shadowOffset: { width: 0, height: 4 },
                                                elevation: 5
                                            }}
                                            pointerEvents="none"
                                        >
                                            <BilletSwipeCard
                                                key={filteredBillets[deck.step + 1].id}
                                                index={0} // Force internal scale to 1, let container handle stack scale
                                                active={false}
                                                billet={filteredBillets[deck.step + 1]}
                                                onSwipe={() => { }}
                                                isSandbox={mode === 'sandbox'}
                                            />
                                        </View>
                                    )}

                                    {/* Front Card (Current) - Active */}
                                    {currentBillet ? (
                                        <View className="flex-1 z-10">
                                            <BilletSwipeCard
                                                key={currentBillet.id}
                                                index={0}
                                                active={true}
                                                billet={currentBillet}
                                                onSwipe={handleSwipe}
                                                isSandbox={mode === 'sandbox'}
                                            />
                                        </View>
                                    ) : (
                                        <View className="flex-1 justify-center items-center z-10">
                                            <View className="px-6 py-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                                                <Text className="text-slate-500 font-bold text-center">No more billets found.</Text>
                                                <Text className="text-slate-400 text-xs text-center mt-2">Adjust filters or check back later.</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>

                        {/* Controls - Relative to the centered container */}
                        <View className="-mt-24 z-50 px-4 items-center">
                            <View className="w-full max-w-md">
                                <BilletControlBar
                                    onUndo={handleUndo}
                                    onPass={() => handleSwipe('left')}
                                    onSave={() => handleSwipe('right')}
                                    onSuperLike={() => handleSwipe('up')}
                                    canUndo={deck.step > 0}
                                />
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        </GestureHandlerRootView>
    );
}
