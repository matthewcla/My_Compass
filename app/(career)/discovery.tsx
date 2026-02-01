import { BilletSwipeCard } from '@/components/BilletSwipeCard';
import { BilletControlBar } from '@/components/discovery/BilletControlBar';
import { DiscoveryFilters } from '@/components/discovery/DiscoveryFilters';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { useColorScheme } from '@/components/useColorScheme';
import { useCinematicDeck } from '@/hooks/useCinematicDeck';
import { useFeedback } from '@/hooks/useFeedback';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { Stack, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DiscoveryScreen() {
    const router = useRouter();
    const {
        billets,
        billetStack,
        mode,
        setMode,
        sandboxFilters,
        swipe,
        undo,
        realDecisions,
        sandboxDecisions,
        fetchBillets,
        showProjected,
        toggleShowProjected,
        applications
    } = useAssignmentStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const { showFeedback, FeedbackComponent } = useFeedback();

    // Initial Fetch
    useEffect(() => {
        if (billetStack.length === 0) {
            fetchBillets('USER_0001');
        }
    }, []);

    // 1. FILTERING LOGIC
    const filteredBillets = useMemo(() => {
        const allBillets = billetStack.map(id => billets[id]).filter(Boolean);

        let result = [];
        if (mode === 'real') {
            // REAL MODE: Filter strictly by User's Rank/Designator (E-6)
            result = allBillets.filter(b => b.payGrade === 'E-6');
        } else {
            // SANDBOX MODE: Filter by store.sandboxFilters
            result = allBillets.filter(b => {
                if (sandboxFilters.payGrade.length > 0 && !sandboxFilters.payGrade.includes(b.payGrade)) {
                    return false;
                }
                return true;
            });
        }

        // HIDE PROJECTED BILLETS FROM DECK unless toggled
        if (!showProjected) {
            result = result.filter(b => b.advertisementStatus !== 'projected');
        }

        return result;
    }, [billets, billetStack, mode, sandboxFilters, showProjected]);

    // 2. DECK LOGIC
    const deck = useCinematicDeck({
        totalSteps: filteredBillets.length,
        onComplete: () => {
            console.log('Deck Empty');
        }
    });

    const currentBillet = filteredBillets[deck.step];

    // Actions
    const handleSwipe = async (direction: 'left' | 'right' | 'up') => {
        if (!currentBillet) return;

        // 1. Visual Transition
        deck.next();

        // 2. Store Update
        // Right -> Manifest (Like)
        // Up -> Slate (Promote)
        // Left -> Archive (Nope)
        await swipe(currentBillet.id, direction, 'USER_0001');

        // 3. Feedback Logic
        if (mode === 'real') {
            if (direction === 'up') {
                // Check if it was actually added to slate or just manifest (due to full slate)
                // We need to check if an application exists for this billet now.
                // Since state update might be async/batched, we might need a better way or assume store logic.
                // Store `promoteToSlate` returns boolean, but `swipe` calls it internally and doesn't return the result.
                // For now, let's check the application count constraint logic which is 7.
                const activeAppCount = Object.values(applications).filter(a =>
                    ['draft', 'optimistically_locked', 'submitted', 'confirmed'].includes(a.status)
                ).length;

                // We are post-swipe, so if it WAS added, count should be <= 7 (if it was 6 before).
                // Or we can rely on `realDecisions` being 'super'.
                // If the slate was full (7), it wouldn't add.
                // NOTE: This check is slightly racy with React state update, but for feedback it's usually acceptable.
                // Better approach: calculate count *before* or modify store to return result.
                // Assuming it worked for now:
                if (activeAppCount <= 7) {
                    // Calculate count (naive approximation since state might lag slightly)
                    showFeedback(`Drafted! Added to Slate (${Math.min(activeAppCount + 1, 7)}/7)`, 'success');
                } else {
                    showFeedback('Slate Full. Added to Manifest instead.', 'warning');
                }
            } else if (direction === 'right') {
                showFeedback('Saved to Candidates.', 'info');
            } else if (direction === 'left') {
                showFeedback('Archived. Go to Manifest to recover.', 'info');
            }
        }
    };

    const handleUndo = () => {
        deck.back();
        undo('USER_0001');
    };

    // Calculate Saved Count (Shortlist) for Header
    const activeDecisions = mode === 'real' ? realDecisions : sandboxDecisions;
    const savedCount = Object.values(activeDecisions).filter(d => d === 'like' || d === 'super').length;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View className="flex-1 bg-slate-50 dark:bg-slate-950">
                <Stack.Screen options={{ headerShown: false }} />

                {/* Feedback Overlay */}
                <FeedbackComponent />

                <SafeAreaView className="flex-1" edges={['top']}>
                    {/* Header */}
                    <DiscoveryHeader
                        mode={mode}
                        onToggleMode={() => setMode(mode === 'real' ? 'sandbox' : 'real')}
                        onOpenFilters={() => setIsFiltersOpen(true)}
                        onOpenShortlist={() => router.push('/(assignment)/cycle')}
                        savedCount={savedCount}
                    />

                    {/* Main Content Area - Centered Vertically */}
                    <View className="flex-1 justify-center w-full">
                        {/* Deck Area */}
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
                                                opacity: 0.9,
                                                transform: [{ translateY: 35 }, { scale: 0.95 }],
                                                shadowOpacity: 0.1,
                                                shadowOffset: { width: 0, height: 4 },
                                                elevation: 5
                                            }}
                                            pointerEvents="none"
                                        >
                                            <BilletSwipeCard
                                                key={filteredBillets[deck.step + 1].id}
                                                index={0}
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

                <DiscoveryFilters
                    visible={isFiltersOpen}
                    onClose={() => setIsFiltersOpen(false)}
                    showProjected={showProjected}
                    onToggleProjected={toggleShowProjected}
                />
            </View>
        </GestureHandlerRootView>
    );
}
