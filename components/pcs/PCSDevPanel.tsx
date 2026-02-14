import { useDemoStore } from '@/store/useDemoStore';
import { PCSPhase, TRANSITSubPhase } from '@/types/pcs';
import Constants from 'expo-constants';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';

const PCS_PHASES: PCSPhase[] = ['ORDERS_NEGOTIATION', 'TRANSIT_LEAVE', 'CHECK_IN'];
const TRANSIT_SUB_PHASES: TRANSITSubPhase[] = ['PLANNING', 'ACTIVE_TRAVEL'];

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
    const pcsSubPhaseOverride = useDemoStore((state) => state.pcsSubPhaseOverride);
    const setPcsSubPhaseOverride = useDemoStore((state) => state.setPcsSubPhaseOverride);

    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    if (!enableDevSettings || !isDemoMode) return null;

    const borderColor = isDark ? '#27272A' : '#F1F5F9';
    const showSubPhase = pcsPhaseOverride === 'TRANSIT_LEAVE';

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

            {/* Sub-Phase Override (visible when Transit Leave is active) */}
            {showSubPhase && (
                <View className="flex-row flex-wrap gap-2 justify-center mt-3">
                    {TRANSIT_SUB_PHASES.map((sub) => {
                        const isActive = pcsSubPhaseOverride === sub;
                        return (
                            <TouchableOpacity
                                key={sub}
                                onPress={() => setPcsSubPhaseOverride(isActive ? null : sub)}
                                className={`px-3 py-1.5 rounded-lg border ${isActive ? 'bg-amber-500 border-amber-600' : 'bg-transparent'}`}
                                style={{ borderColor: isActive ? '#D97706' : borderColor }}
                            >
                                <Text
                                    style={{ color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' }}
                                    className="text-[10px] font-semibold"
                                >
                                    {sub.replace(/_/g, ' ')}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {pcsPhaseOverride && (
                <Text className="text-blue-400 text-[10px] text-center mt-2">
                    Override active — computed phase bypassed
                </Text>
            )}
        </View>
    );
}
