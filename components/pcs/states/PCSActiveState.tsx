import { PCSChecklist } from '@/components/pcs/PCSChecklist';
import { SegmentTimeline } from '@/components/pcs/SegmentTimeline';
import { PCSPhaseWidgets } from '@/components/pcs/widgets/PCSPhaseWidgets';
import React from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

/**
 * PCS Active State — Tactical Command Center
 *
 * Renders the active PCS order content:
 * - Phase Widgets
 * - Segment Timeline
 * - PCS Checklist
 *
 * This component has NO internal scroll — scroll is
 * delegated to the parent CollapsibleScaffold.
 */
export function PCSActiveState() {
    return (
        <Animated.View
            entering={FadeIn.duration(400)}
            exiting={FadeOut.duration(200)}
        >
            <View style={{ paddingTop: 24 }}>
                <PCSPhaseWidgets />
                <SegmentTimeline />
                <PCSChecklist />
            </View>
        </Animated.View>
    );
}
