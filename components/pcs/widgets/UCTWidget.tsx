import { UnifiedContextualTrack } from '@/components/pcs/track/UnifiedContextualTrack';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import React from 'react';
import { View } from 'react-native';

export function UCTWidget() {
    const isDark = useColorScheme() === 'dark';

    return (
        <View className="flex flex-col gap-2">
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
            >
                {/* The UCT orchestrator maintains its own state and renders its own header natively */}
                <UnifiedContextualTrack />
            </GlassView>
        </View>
    );
}
