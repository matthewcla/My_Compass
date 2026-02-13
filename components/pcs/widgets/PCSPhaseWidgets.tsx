import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { GainingCommandCard } from '@/components/pcs/widgets/GainingCommandCard';
import { usePCSPhase } from '@/store/usePCSStore';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

export function PCSPhaseWidgets() {
    const phase = usePCSPhase();

    if (phase === 'DORMANT') return null;

    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify().damping(15)}
        >
            <View className="px-4 space-y-4">
                {/* ── ORDERS_NEGOTIATION ──────────────────────────────────── */}
                {phase === 'ORDERS_NEGOTIATION' && (
                    <>
                        <ObliservBanner variant="widget" />
                        <GainingCommandCard variant="widget" />
                    </>
                )}

                {/* ── TRANSIT_LEAVE ───────────────────────────────────────── */}
                {phase === 'TRANSIT_LEAVE' && (
                    <>
                        {/* TODO: TravelChecklistWidget */}
                        {/* TODO: ItinerarySnapshotCard */}
                    </>
                )}

                {/* ── CHECK_IN ────────────────────────────────────────────── */}
                {phase === 'CHECK_IN' && (
                    <>
                        {/* TODO: CheckInProgressWidget */}
                        {/* TODO: GainingCommandContactCard */}
                    </>
                )}
            </View>
        </Animated.View>
    );
}
