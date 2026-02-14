import { useDemoStore } from '@/store/useDemoStore';
import { PCSPhase } from '@/types/pcs';
import Constants from 'expo-constants';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';

const PCS_PHASES: PCSPhase[] = ['TRANSIT_LEAVE', 'CHECK_IN'];

/**
 * Inline developer panel for the PCS landing page.
 * Renders phase override pills and I-stop toggle at the bottom of scroll content.
 * Only visible in __DEV__ or when enableDevSettings is true.
 */
export function PCSDevPanel() {
    const enableDevSettings = Constants.expoConfig?.extra?.enableDevSettings ?? __DEV__;
    const isDemoMode = useDemoStore((state) => state.isDemoMode);
    const pcsPhaseOverride = useDemoStore((state) => state.pcsPhaseOverride);
    const setPcsPhaseOverride = useDemoStore((state) => state.setPcsPhaseOverride);

    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    if (!enableDevSettings || !isDemoMode) return null;

    const borderColor = isDark ? '#27272A' : '#F1F5F9';

    return (
        <View
            className="mx-4 mt-6 rounded-2xl p-4 border border-dashed"
            style={{
                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.06)' : '#EFF6FF',
                borderColor: isDark ? 'rgba(59, 130, 246, 0.25)' : '#93C5FD',
            }}
        >
            <Text
                className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-3 text-center"
            >
                PCS Dev Controls
            </Text>

            {/* Phase Override */}
            <View className="flex-row flex-wrap gap-2 justify-center">
                {PCS_PHASES.map((phase) => {
                    const isActive = pcsPhaseOverride === phase;
                    return (
                        <TouchableOpacity
                            key={phase}
                            onPress={() => setPcsPhaseOverride(isActive ? null : phase)}
                            className={`px-3 py-2 rounded-lg border ${isActive ? 'bg-blue-500 border-blue-600' : 'bg-transparent'}`}
                            style={{ borderColor: isActive ? '#2563EB' : borderColor }}
                        >
                            <Text
                                style={{ color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' }}
                                className="text-xs font-semibold"
                            >
                                {phase.replace(/_/g, ' ')}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {pcsPhaseOverride && (
                <Text className="text-blue-400 text-[10px] text-center mt-2">
                    Override active — computed phase bypassed
                </Text>
            )}
        </View>
    );
}

