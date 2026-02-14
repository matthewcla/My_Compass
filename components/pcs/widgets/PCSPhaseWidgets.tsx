import { AllowancesCard } from '@/components/pcs/financials/AllowancesCard';
import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { BaseWelcomeKit } from '@/components/pcs/widgets/BaseWelcomeKit';
import { DigitalOrdersWallet } from '@/components/pcs/widgets/DigitalOrdersWallet';
import { GainingCommandCard } from '@/components/pcs/widgets/GainingCommandCard';
import { HHGWeightGaugeWidget } from '@/components/pcs/widgets/HHGWeightGaugeWidget';
import { LeaveImpactWidget } from '@/components/pcs/widgets/LeaveImpactWidget';
import { LiquidationTrackerWidget } from '@/components/pcs/widgets/LiquidationTrackerWidget';
import { ReceiptScannerWidget } from '@/components/pcs/widgets/ReceiptScannerWidget';
import { TravelClaimHUDWidget } from '@/components/pcs/widgets/TravelClaimHUDWidget';
import { usePCSPhase, useSubPhase } from '@/store/usePCSStore';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';

export function PCSPhaseWidgets() {
    const phase = usePCSPhase();
    const subPhase = useSubPhase();

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

                {/* ── TRANSIT_LEAVE · PLANNING (Phase 2) ─────────────────── */}
                {phase === 'TRANSIT_LEAVE' && subPhase === 'PLANNING' && (
                    <>
                        <AllowancesCard variant="widget" />
                        <LeaveImpactWidget />
                        <HHGWeightGaugeWidget />
                    </>
                )}

                {/* ── TRANSIT_LEAVE · ACTIVE_TRAVEL (Phase 3) ────────────── */}
                {phase === 'TRANSIT_LEAVE' && subPhase === 'ACTIVE_TRAVEL' && (
                    <>
                        <ReceiptScannerWidget />
                        <DigitalOrdersWallet />
                    </>
                )}

                {/* ── CHECK_IN ────────────────────────────────────────────── */}
                {phase === 'CHECK_IN' && (
                    <>
                        <BaseWelcomeKit />
                        <TravelClaimHUDWidget />
                        <LiquidationTrackerWidget />
                    </>
                )}
            </View>
        </Animated.View>
    );
}

