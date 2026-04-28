import { derivePhase, usePCSStore } from '@/store/usePCSStore';
import { PCSPhase } from '@/types/pcs';
import { Camera, MapPin, MessageCircle } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Pressable } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut
} from 'react-native-reanimated';

interface PhaseConfig {
    bgClass: string;
    icon: React.ReactNode;
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
            bgClass: 'bg-primary dark:bg-blue-600',
            icon: <MessageCircle size={24} color="white" />,
        },
        TRANSIT_LEAVE: {
            bgClass: 'bg-secondary dark:bg-amber-500',
            icon: <Camera size={24} color="#0F172A" />,
        },
        CHECK_IN: {
            bgClass: 'bg-primary dark:bg-green-600',
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
                className={`w-14 h-14 rounded-full items-center justify-center border-2 border-slate-200 dark:border-transparent ${config.bgClass}`}
                style={{
                    shadowColor: '#0A1628',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 1,
                    shadowRadius: 0,
                    elevation: 8,
                }}
            >
                {config.icon}
            </Pressable>
        </Animated.View>
    );
}
