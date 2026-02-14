import { PCSHeroBanner } from '@/components/pcs/PCSHeroBanner';
import { UnifiedContextualTrack } from '@/components/pcs/track/UnifiedContextualTrack';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Active State — Unified Contextual Track
 *
 * Renders the Hero Banner (destination, countdown, progress, next action)
 * above the full UCT with dynamic checklist items, phase-specific widgets,
 * and date ranges. All state is driven by usePCSStore + useUCTPhaseStatus().
 */
export function PCSActiveState() {
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View style={{ paddingTop: 24 }}>
                <PCSHeroBanner />
                <UnifiedContextualTrack />
            </View>
        </Animated.View>
    );
}
