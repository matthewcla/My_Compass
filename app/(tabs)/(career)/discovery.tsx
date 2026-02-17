import { BilletSwipeCard } from '@/components/BilletSwipeCard';
import { BilletControlBar } from '@/components/discovery/BilletControlBar';
import { DiscoveryFilters } from '@/components/discovery/DiscoveryFilters';
import { DiscoveryHeader } from '@/components/discovery/DiscoveryHeader';
import { SandboxExplainerModal } from '@/components/discovery/SandboxExplainerModal';
import { SwipeTutorialOverlay } from '@/components/discovery/SwipeTutorialOverlay';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useColorScheme } from '@/components/useColorScheme';
import { useCinematicDeck } from '@/hooks/useCinematicDeck';
import { useFeedback } from '@/hooks/useFeedback';
import { useAssignmentStore } from '@/store/useAssignmentStore';
import { useDemoStore } from '@/store/useDemoStore';
import { Billet } from '@/types/schema';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// Stable no-op function for background cards to prevent re-renders
const NO_OP = () => { };

export default function DiscoveryScreen() {
    const router = useRouter();
    const { filter } = useLocalSearchParams<{ filter?: string }>();
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    // Sync route param → local state on mount
    useEffect(() => {
        if (filter) setCategoryFilter(filter);
    }, [filter]);
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
        updateSandboxFilters,
        applications
    } = useAssignmentStore();
    const assignmentPhase = useDemoStore(state => state.assignmentPhaseOverride);
    const isSlatePhase = assignmentPhase === 'NEGOTIATION';
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Sandbox explainer state
    const [sandboxTriggered, setSandboxTriggered] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const { showFeedback, FeedbackComponent } = useFeedback();

    // Initial Fetch
    useEffect(() => {
        if (billetStack.length === 0) {
            fetchBillets('USER_0001');
        }
    }, []);

    // Optimization: Keep applications in ref to prevent handleSwipe from changing on background syncs
    const applicationsRef = useRef(applications);
    useEffect(() => {
        applicationsRef.current = applications;
    }, [applications]);

    // 1. FILTERING LOGIC
    const filteredBillets = useMemo(() => {
        const allBillets = billetStack.map(id => billets[id]).filter(Boolean);

        let result = [];
        if (mode === 'real') {
            // REAL MODE: Filter strictly by User's Rank/Designator (E-6)
            // Allow current rank + 1 (E-7) when rank filter is expanded
            const allowedRanks = sandboxFilters.payGrade.length > 0
                ? sandboxFilters.payGrade
                : ['E-6'];
            result = allBillets.filter(b => allowedRanks.includes(b.payGrade));

            // Location filter
            if (sandboxFilters.location.length > 0) {
                result = result.filter(b => sandboxFilters.location.includes(b.location));
            }

            // Duty type filter
            if (sandboxFilters.dutyType?.length > 0) {
                result = result.filter(b => b.dutyType && sandboxFilters.dutyType.includes(b.dutyType));
            }
        } else {
            // SANDBOX MODE: Filter by store.sandboxFilters
            result = allBillets.filter(b => {
                if (sandboxFilters.payGrade.length > 0 && !sandboxFilters.payGrade.includes(b.payGrade)) {
                    return false;
                }
                if (sandboxFilters.location.length > 0 && !sandboxFilters.location.includes(b.location)) {
                    return false;
                }
                if (sandboxFilters.dutyType?.length > 0) {
                    if (!b.dutyType || !sandboxFilters.dutyType.includes(b.dutyType)) return false;
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

    // Available duty stations & duty types for filter chips
    const availableLocations = useMemo(() => {
        return [...new Set(Object.values(billets).map(b => b.location).filter(Boolean))];
    }, [billets]);

    const availableDutyTypes = useMemo(() => {
        return [...new Set(Object.values(billets).map(b => b.dutyType).filter(Boolean))] as string[];
    }, [billets]);

    // Reviewed count for progress
    const reviewedCount = Object.keys(mode === 'real' ? realDecisions : sandboxDecisions).length;

    // 1b. CATEGORY FILTER (from Hub badge tap)
    const categoryFilteredBillets = useMemo((): Billet[] => {
        if (!categoryFilter) return filteredBillets;

        const allBillets = Object.values(billets);
        switch (categoryFilter) {
            case 'wow':
                return allBillets.filter(b => realDecisions[b.id] === 'super');
            case 'liked':
                return allBillets.filter(b => realDecisions[b.id] === 'like');
            case 'passed':
                return allBillets.filter(b => realDecisions[b.id] === 'nope');
            case 'remaining':
                return allBillets.filter(b => !realDecisions[b.id]);
            default:
                return filteredBillets;
        }
    }, [categoryFilter, filteredBillets, billets, realDecisions]);

    const activeBillets = categoryFilter ? categoryFilteredBillets : filteredBillets;
    const categoryLabels: Record<string, string> = {
        wow: 'WOW!', liked: 'Liked', passed: 'Passed', remaining: 'Remaining'
    };

    // 2. DECK LOGIC
    const handleDeckComplete = useCallback(() => {
        console.log('Deck Empty');
    }, []);

    const deck = useCinematicDeck({
        totalSteps: activeBillets.length,
        onComplete: handleDeckComplete
    });

    const currentBillet = activeBillets[deck.step];

    // Actions
    const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up' | 'down') => {
        if (!currentBillet) return;

        // Defer: No visual transition — store re-queues the billet
        if (direction === 'down') {
            await swipe(currentBillet.id, direction, 'USER_0001');
            if (mode === 'real') {
                showFeedback('Deferred. You\'ll see this one again later.', 'info');
            }
            return;
        }

        // 1. Visual Transition
        deck.next();

        // 2. Store Update
        await swipe(currentBillet.id, direction, 'USER_0001');

        // 3. Phase-gated Feedback
        if (mode === 'real') {
            if (direction === 'up') {
                if (isSlatePhase) {
                    // Negotiation: actual slate building
                    const activeAppCount = Object.values(applicationsRef.current).filter(a =>
                        ['draft', 'optimistically_locked', 'submitted', 'confirmed'].includes(a.status)
                    ).length;
                    if (activeAppCount <= 7) {
                        showFeedback(`Drafted! Added to Slate (${Math.min(activeAppCount + 1, 7)}/7)`, 'success');
                    } else {
                        showFeedback('Slate Full. Added to Manifest instead.', 'warning');
                    }
                } else {
                    // Discovery / On-Ramp: bookmark signaling CNPC interest
                    showFeedback('Top Pick — CNPC sees this interest.', 'success');
                }
            } else if (direction === 'right') {
                showFeedback(isSlatePhase ? 'Saved to Candidates.' : 'Bookmarked ✓', 'info');
            } else if (direction === 'left') {
                showFeedback(isSlatePhase ? 'Archived. Go to Manifest to recover.' : 'Passed.', 'info');
            }
        }
    }, [deck.next, currentBillet, mode, swipe, showFeedback, isSlatePhase]);

    const handleUndo = () => {
        deck.back();
        undo('USER_0001');
    };

    // Calculate Saved Count (Shortlist) for Header
    const activeDecisions = mode === 'real' ? realDecisions : sandboxDecisions;
    const savedCount = Object.values(activeDecisions).filter(d => d === 'like' || d === 'super').length;

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScreenGradient>
                <Stack.Screen options={{ headerShown: false }} />

                {/* Feedback Overlay */}
                <FeedbackComponent />

                <SafeAreaView className="flex-1" edges={['top']}>
                    {/* Header */}
                    <DiscoveryHeader
                        mode={mode}
                        onToggleMode={() => {
                            const newMode = mode === 'real' ? 'sandbox' : 'real';
                            setMode(newMode);
                            if (newMode === 'sandbox') setSandboxTriggered(true);
                        }}
                        onOpenFilters={() => setIsFiltersOpen(true)}
                        onOpenShortlist={() => router.push('/(assignment)/cycle' as any)}
                        savedCount={savedCount}
                    />

                    {/* Progress Indicator */}
                    <View className="px-6 py-2 flex-row items-center justify-between">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold">
                            {categoryFilter
                                ? `${activeBillets.length} ${categoryLabels[categoryFilter] ?? ''} billets`
                                : `${reviewedCount} of ${filteredBillets.length} reviewed`
                            }
                        </Text>
                        {!categoryFilter && (
                            <View className="flex-1 ml-3 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <View
                                    className="h-full bg-blue-500 dark:bg-blue-400 rounded-full"
                                    style={{ width: `${filteredBillets.length > 0 ? (reviewedCount / filteredBillets.length) * 100 : 0}%` }}
                                />
                            </View>
                        )}
                    </View>

                    {/* Category Filter Pill */}
                    {categoryFilter && (
                        <View className="px-6 pb-2">
                            <TouchableOpacity
                                onPress={() => setCategoryFilter(null)}
                                className="self-start flex-row items-center gap-2 bg-blue-500/15 dark:bg-blue-500/20 px-3 py-1.5 rounded-full"
                            >
                                <Text className="text-blue-400 text-xs font-bold">
                                    Showing: {categoryLabels[categoryFilter] ?? categoryFilter}
                                </Text>
                                <Text className="text-blue-400/60 text-xs font-black">✕</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {/* Main Content Area - Centered Vertically */}
                    <View className="flex-1 justify-center w-full" style={{ overflow: 'hidden' }}>
                        {/* Deck Area */}
                        <View className="h-[85%] items-center relative w-full">
                            <View className="w-full flex-1 max-w-md px-4 pb-12">
                                {/* Render current card */}
                                <View className="flex-1 relative w-full h-full">
                                    {/* Back Card (Next + 1) - Deepest */}
                                    {filteredBillets[deck.step + 2] && !categoryFilter && (
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
                                    {filteredBillets[deck.step + 1] && !categoryFilter && (
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
                                                onSwipe={NO_OP}
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

                {/* Swipe Tutorial Overlay */}
                <SwipeTutorialOverlay />

                {/* Sandbox Explainer Modal */}
                <SandboxExplainerModal
                    trigger={sandboxTriggered}
                    onDismiss={() => setSandboxTriggered(false)}
                />

                <DiscoveryFilters
                    visible={isFiltersOpen}
                    onClose={() => setIsFiltersOpen(false)}
                    showProjected={showProjected}
                    onToggleProjected={toggleShowProjected}
                    availableLocations={availableLocations}
                    availableDutyTypes={availableDutyTypes}
                    selectedLocations={sandboxFilters.location}
                    selectedDutyTypes={sandboxFilters.dutyType ?? []}
                    selectedPayGrades={sandboxFilters.payGrade}
                    onUpdateFilters={updateSandboxFilters}
                />
            </ScreenGradient>
        </GestureHandlerRootView>
    );
}
