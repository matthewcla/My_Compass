import { usePCSStore } from '@/store/usePCSStore';
import { PCSSegment } from '@/types/pcs';
import { Camera, MapPin, MessageCircle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut
} from 'react-native-reanimated';

type PCSPhase = 'DORMANT' | 'ORDERS_NEGOTIATION' | 'TRANSIT_LEAVE' | 'CHECK_IN';

interface PhaseConfig {
    bgClass: string;
    icon: React.ReactNode;
}

function derivePhase(segments: PCSSegment[] | undefined): PCSPhase {
    if (!segments || segments.length === 0) return 'DORMANT';

    const allLocked = segments.every((s) => s.status === 'LOCKED');
    const anyPlanning = segments.some((s) => s.status === 'PLANNING');
    const allComplete = segments.every((s) => s.status === 'COMPLETE');

    if (allComplete) return 'CHECK_IN';
    if (anyPlanning) return 'TRANSIT_LEAVE';
    if (allLocked) return 'ORDERS_NEGOTIATION';

    // Mixed states default to negotiation
    return 'ORDERS_NEGOTIATION';
}

export function ContextualFAB() {
    const activeOrder = usePCSStore((state) => state.activeOrder);

    const phase = useMemo(
        () => derivePhase(activeOrder?.segments),
        [activeOrder?.segments]
    );

    // Don't render when no active order
    if (phase === 'DORMANT') return null;

    const phaseConfig: Record<Exclude<PCSPhase, 'DORMANT'>, PhaseConfig> = {
        ORDERS_NEGOTIATION: {
            bgClass: 'bg-blue-600',
            icon: <MessageCircle size={24} color="white" />,
        },
        TRANSIT_LEAVE: {
            bgClass: 'bg-amber-500',
            icon: <Camera size={24} color="white" />,
        },
        CHECK_IN: {
            bgClass: 'bg-green-600',
            icon: <MapPin size={24} color="white" />,
        },
    };

    const config = phaseConfig[phase];

    return (
        <Animated.View
            entering={FadeIn.springify().damping(15)}
            exiting={FadeOut.duration(200)}
            className="absolute bottom-6 right-6 z-50"
        >
            <Pressable
                className={`w-14 h-14 rounded-full items-center justify-center shadow-lg ${config.bgClass}`}
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 8,
                }}
            >
                {config.icon}
            </Pressable>
        </Animated.View>
    );
}
