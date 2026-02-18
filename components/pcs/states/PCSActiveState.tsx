import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { PCSHeroBanner } from '@/components/pcs/PCSHeroBanner';
import { UnifiedContextualTrack } from '@/components/pcs/track/UnifiedContextualTrack';
import { PCSTaskTracker } from '@/components/pcs/widgets/PCSTaskTracker';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Active State — Unified Contextual Track
 *
 * Renders the Hero Banner (destination, countdown, sponsor),
 * Task Tracker (progress, next action), and the full UCT
 * with dynamic checklist items and phase-specific widgets.
 */
export function PCSActiveState() {
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View style={{ paddingTop: 24 }}>
                {/* OBLISERV Banner — top-level alert above the hero */}
                <View style={{ paddingHorizontal: 16 }}>
                    <ObliservBanner variant="full" />
                </View>
                <PCSHeroBanner />
                <PCSTaskTracker />
                <UnifiedContextualTrack />
            </View>
        </Animated.View>
    );
}
