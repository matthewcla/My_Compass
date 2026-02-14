import { TrackNode } from '@/components/pcs/track/TrackNode';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Active State — TEMPORARY VISUAL TEST
 *
 * Tests TrackNode in all 3 states (COMPLETED, ACTIVE, LOCKED).
 * Will be replaced by UnifiedContextualTrack in Phase 3.
 */
export function PCSActiveState() {
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View style={{ paddingTop: 24 }}>
                <TrackNode phase={1} title="Orders & OBLISERV" status="COMPLETED">
                    <Text className="text-slate-600 dark:text-slate-300 text-sm">
                        ✅ All screenings complete. Orders verified Nov 1.
                    </Text>
                </TrackNode>

                <TrackNode phase={2} title="Logistics & Finances" dateRange="Nov 15 – Dec 10" status="ACTIVE">
                    <Text className="text-slate-800 dark:text-slate-200 text-base font-semibold mb-2">
                        3 of 5 tasks complete
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-300 text-sm">
                        • Submit DLA / Advance Pay Request{'\n'}
                        • Schedule Household Goods (DPS)
                    </Text>
                </TrackNode>

                <TrackNode phase={3} title="Transit & Leave" status="LOCKED">
                    <Text className="text-slate-500 text-sm">
                        This should NOT render (locked state hides children)
                    </Text>
                </TrackNode>

                <TrackNode phase={4} title="Check-in & Travel Claim" status="LOCKED" isLast>
                    <Text className="text-slate-500 text-sm">
                        This should NOT render either
                    </Text>
                </TrackNode>
            </View>
        </Animated.View>
    );
}

