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
import { useCurrentProfile, useDemoStore } from '@/store/useDemoStore';
import { Billet } from '@/types/schema';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Heart, HelpCircle, Star, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
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
        showProjected,
        toggleShowProjected,
        updateSandboxFilters,
        applications
    } = useAssignmentStore();
    const profile = useCurrentProfile();
    const activeUserId = profile?.id ?? 'unknown';
    const assignmentPhase = useDemoStore(state => state.assignmentPhaseOverride);
    const isSlatePhase = assignmentPhase === 'NEGOTIATION';
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Sandbox explainer state
    const [sandboxTriggered, setSandboxTriggered] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const { showFeedback, FeedbackComponent } = useFeedback();

    // Billets are hydrated by the Hub on mount/focus — no re-fetch needed here.
    // A second fetchBillets() call was causing the store's billet pool to shift
    // mid-render, producing a mismatch between this scoreboard and the
    // DiscoveryStatusCard widget on the Hub.

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

    // Scoreboard stats — scoped to ALL billets (consistent with Hub DiscoveryStatusCard)
    const stats = useMemo(() => {
        const decisions = mode === 'real' ? realDecisions : sandboxDecisions;
        const total = Object.keys(billets).length;
        let slated = 0, saved = 0, passed = 0;

        Object.values(decisions).forEach(d => {
            if (d === 'super') slated++;
            else if (d === 'like') saved++;
            else if (d === 'nope') passed++;
            // 'defer' intentionally not counted — deferred billets re-appear
        });

        // ENFORCEMENT: During Negotiation Phase, the user expects 'Slated' (⭐) to 
        // exactly match their actual Slate Composition. Swipe history ('super') can
        // lag behind or precede actual store DB application commits safely.
        if (mode === 'real' && isSlatePhase) {
            slated = Object.values(applications).filter(a =>
                ['draft', 'optimistically_locked', 'submitted', 'confirmed'].includes(a.status)
            ).length;
        }

        const remaining = total - (slated + saved + passed);
        return { slated, saved, passed, remaining };
    }, [billets, realDecisions, sandboxDecisions, mode, isSlatePhase, applications]);

    // 1b. CATEGORY FILTER (from Hub badge tap)
    const categoryFilteredBillets = useMemo((): Billet[] => {
        if (!categoryFilter) return filteredBillets;

        const activeDecisions = mode === 'real' ? realDecisions : sandboxDecisions;

        switch (categoryFilter) {
            case 'wow':
                return filteredBillets.filter(b => activeDecisions[b.id] === 'super');
            case 'liked':
                return filteredBillets.filter(b => activeDecisions[b.id] === 'like');
            case 'passed':
                return filteredBillets.filter(b => activeDecisions[b.id] === 'nope');
            case 'remaining':
                return filteredBillets.filter(b => !activeDecisions[b.id]);
            default:
                return filteredBillets;
        }
    }, [categoryFilter, filteredBillets, realDecisions, sandboxDecisions, mode]);

    const activeBillets = categoryFilter ? categoryFilteredBillets : filteredBillets;
    const categoryLabels: Record<string, string> = {
        wow: 'WOW!', liked: 'Liked', passed: 'Passed', remaining: 'Remaining'
    };

    // 2. DECK LOGIC
    const handleDeckComplete = useCallback(() => {
        // Deck Empty
    }, []);

    const deck = useCinematicDeck({
        totalSteps: activeBillets.length,
        onComplete: handleDeckComplete
    });

    // Reset deck step when filter changes so we don't start out of bounds
    useEffect(() => {
        deck.reset();
    }, [categoryFilter, mode]);

    const currentBillet = activeBillets[deck.step];

    // Actions
    const handleSwipe = useCallback(async (direction: 'left' | 'right' | 'up' | 'down') => {
        if (!currentBillet) return;

        // Defer: No visual transition — store re-queues the billet
        if (direction === 'down') {
            await swipe(currentBillet.id, direction, activeUserId, { skipPromotion: !isSlatePhase });
            if (mode === 'real') {
                showFeedback('Deferred. You\'ll see this one again later.', 'info');
            }
            return;
        }

        // Determine if the current action will REMOVE the item from the active filter.
        // If it removes the item, the array shrinks, so the next item naturally falls into `deck.step`.
        // If it DOES NOT remove the item, we must manually advance `deck.step`.
        let willShrink = false;
        if (categoryFilter === 'remaining') {
            // Any swipe sets a decision, so it ALWAYS removes it from 'remaining'
            willShrink = true;
        } else if (categoryFilter === 'wow' && direction !== 'up') {
            willShrink = true;
        } else if (categoryFilter === 'liked' && direction !== 'right') {
            willShrink = true;
        } else if (categoryFilter === 'passed' && direction !== 'left') {
            willShrink = true;
        }

        // 1. Visual Transition
        if (!willShrink) {
            deck.next();
        }

        // 2. Store Update
        await swipe(currentBillet.id, direction, activeUserId, { skipPromotion: !isSlatePhase });

        // 3. Phase-gated Feedback
        if (mode === 'real') {
            if (direction === 'up') {
                if (isSlatePhase) {
                    // Negotiation: actual slate building
                    // Because we already awaited `swipe()` above, the zustand store has already dynamically inserted the new Application.
                    // We pull the absolute latest state from the store directly to avoid Ref tick lagging.
                    const currentApplications = useAssignmentStore.getState().applications;
                    const activeAppCount = Object.values(currentApplications).filter(a =>
                        ['draft', 'optimistically_locked', 'submitted', 'confirmed'].includes(a.status)
                    ).length;

                    if (activeAppCount <= 7) {
                        showFeedback(`Drafted! Added to Slate (${activeAppCount}/7)`, 'success');
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
    }, [deck.next, currentBillet, mode, swipe, showFeedback, isSlatePhase, categoryFilter]);

    const handleUndo = () => {
        deck.back();
        undo(activeUserId);
    };

    // Calculate Saved Count (Shortlist) for Header
    const activeDecisions = mode === 'real' ? realDecisions : sandboxDecisions;
    const savedCount = Object.values(activeDecisions).filter(d => d === 'like' || d === 'super').length;

    return (
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
                        onOpenShortlist={() => router.push('/(career)/cycle' as any)}
                        savedCount={savedCount}
                    />

                    {/* Scoreboard Strip */}
                    <View className="px-4 py-1.5 flex-row items-center gap-2">
                        <ScoreChip
                            icon={<Star size={12} color={isDark ? '#60a5fa' : '#2563EB'} />}
                            count={stats.slated}
                            isDark={isDark}
                            bg={isDark ? '#1E3A8A' : '#DBEAFE'}
                            textColor={isDark ? '#93C5FD' : '#1D4ED8'}
                            onPress={() => setCategoryFilter('wow')}
                        />
                        <ScoreChip
                            icon={<Heart size={12} color={isDark ? '#4ADE80' : '#16A34A'} />}
                            count={stats.saved}
                            isDark={isDark}
                            bg={isDark ? '#14532D' : '#DCFCE7'}
                            textColor={isDark ? '#86EFAC' : '#15803D'}
                            onPress={() => setCategoryFilter('liked')}
                        />
                        <ScoreChip
                            icon={<X size={12} color={isDark ? '#F87171' : '#DC2626'} />}
                            count={stats.passed}
                            isDark={isDark}
                            bg={isDark ? '#450A0A' : '#FEE2E2'}
                            textColor={isDark ? '#FCA5A5' : '#B91C1C'}
                            onPress={() => setCategoryFilter('passed')}
                        />
                        <ScoreChip
                            icon={<HelpCircle size={12} color={isDark ? '#94A3B8' : '#64748B'} />}
                            count={stats.remaining}
                            isDark={isDark}
                            bg={isDark ? '#1E293B' : '#F1F5F9'}
                            textColor={isDark ? '#CBD5E1' : '#475569'}
                            onPress={() => setCategoryFilter('remaining')}
                        />
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
                                {/* Deck Container */}
                                <View className="flex-1 relative w-full h-full">
                                    {activeBillets.slice(deck.step, deck.step + 3).reverse().map((billet, reversedIndex, array) => {
                                        const offset = array.length - 1 - reversedIndex; // 0 for front, 1 for middle, 2 for back

                                        // On category filters, we don't render background cards
                                        if (categoryFilter && offset > 0) return null;

                                        return (
                                            <View
                                                key={billet.id}
                                                className="absolute w-full h-full"
                                                style={{ zIndex: 10 - offset }}
                                                pointerEvents={offset === 0 ? 'auto' : 'none'}
                                            >
                                                <BilletSwipeCard
                                                    index={offset}
                                                    active={offset === 0}
                                                    billet={billet}
                                                    onSwipe={offset === 0 ? handleSwipe : NO_OP}
                                                    isSandbox={mode === 'sandbox'}
                                                />
                                            </View>
                                        );
                                    })}

                                    {(!currentBillet || activeBillets.length === 0) && (
                                        <View className="flex-1 justify-center items-center z-10 pointer-events-none">
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
    );
}

/* ─── ScoreChip ──────────────────────────────────────────────────────────── */

function ScoreChip({
    icon,
    count,
    isDark,
    bg,
    textColor,
    onPress,
}: {
    icon: React.ReactNode;
    count: number;
    isDark: boolean;
    bg: string;
    textColor: string;
    onPress?: () => void;
}) {
    const isEmpty = count === 0;

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={isEmpty}
            activeOpacity={0.7}
            className="flex-1 flex-row items-center justify-center gap-1.5 py-3 rounded-xl"
            style={[
                { backgroundColor: bg },
                isEmpty ? { opacity: 0.35 } : undefined,
            ]}
        >
            {icon}
            <Text style={{ color: textColor }} className="text-sm font-black">{count}</Text>
        </TouchableOpacity>
    );
}
