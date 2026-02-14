import { TrackNode } from '@/components/pcs/track/TrackNode';
import { useUCTPhaseStatus } from '@/store/usePCSStore';
import React from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Active State — Unified Contextual Track
 *
 * Renders TrackNodes with statuses driven by useUCTPhaseStatus(),
 * which derives COMPLETED / ACTIVE / LOCKED from the current
 * PCS phase (or from demo overrides when demo mode is active).
 */
export function PCSActiveState() {
    const uctStatus = useUCTPhaseStatus();

    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View style={{ paddingTop: 24 }}>
                <TrackNode phase={1} title="Orders & OBLISERV" status={uctStatus[1]}>
                    <Text className="text-slate-600 dark:text-slate-300 text-sm">
                        ✅ All screenings complete. Orders verified Nov 1.
                    </Text>
                </TrackNode>

                <TrackNode phase={2} title="Logistics & Finances" dateRange="Nov 15 – Dec 10" status={uctStatus[2]}>
                    <Text className="text-slate-800 dark:text-slate-200 text-base font-semibold mb-2">
                        3 of 5 tasks complete
                    </Text>
                    <Text className="text-slate-600 dark:text-slate-300 text-sm">
                        • Submit DLA / Advance Pay Request{'\n'}
                        • Schedule Household Goods (DPS)
                    </Text>
                </TrackNode>

                <TrackNode phase={3} title="Transit & Leave" status={uctStatus[3]}>
                    <Text className="text-slate-500 text-sm">
                        Plan your travel segments and leave requests.
                    </Text>
                </TrackNode>

                <TrackNode phase={4} title="Check-in & Travel Claim" status={uctStatus[4]} isLast>
                    <Text className="text-slate-500 text-sm">
                        Complete check-in and file your travel claim.
                    </Text>
                </TrackNode>
            </View>
        </Animated.View>
    );
}
