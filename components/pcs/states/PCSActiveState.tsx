import { PCSHeroBanner } from '@/components/pcs/PCSHeroBanner';
import { UnifiedContextualTrack } from '@/components/pcs/track/UnifiedContextualTrack';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Active State — Unified Contextual Track
 *
 * Renders the Hero Banner (destination, countdown, sponsor)
 * and the full UCT with dynamic checklist items and phase-specific widgets.
 */
export function PCSActiveState() {
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View>
                <PCSHeroBanner />
                <UnifiedContextualTrack />
            </View>
        </Animated.View>
    );
}
