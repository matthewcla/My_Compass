import { useDemoStore } from '@/store/useDemoStore';
import { usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { PCSPhase, TRANSITSubPhase } from '@/types/pcs';
import Constants from 'expo-constants';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';

const PCS_PHASES: PCSPhase[] = ['ORDERS_NEGOTIATION', 'TRANSIT_LEAVE', 'CHECK_IN'];
const PCS_PHASE_LABELS: Record<PCSPhase, string> = {
    DORMANT: 'DORMANT',
    ORDERS_NEGOTIATION: 'PRE-TRAVEL',
    TRANSIT_LEAVE: 'IN TRANSIT',
    CHECK_IN: 'POST-TRAVEL',
};
const TRANSIT_SUB_PHASES: TRANSITSubPhase[] = ['PLANNING', 'ACTIVE_TRAVEL'];
const CONTEXT_TRACKS = ['ACTIVE', 'ARCHIVE'] as const;

/**
 * Inline developer panel for the PCS landing page.
 * Renders phase override pills, context track toggle, and archive data controls.
 * Only visible in __DEV__ or when enableDevSettings is true.
 */
export function PCSDevPanel() {
    const enableDevSettings = Constants.expoConfig?.extra?.enableDevSettings ?? __DEV__;
    const isDemoMode = useDemoStore((state) => state.isDemoMode);
    const pcsPhaseOverride = useDemoStore((state) => state.pcsPhaseOverride);
    const setPcsPhaseOverride = useDemoStore((state) => state.setPcsPhaseOverride);
    const pcsSubPhaseOverride = useDemoStore((state) => state.pcsSubPhaseOverride);
    const setPcsSubPhaseOverride = useDemoStore((state) => state.setPcsSubPhaseOverride);
    const pcsContextOverride = useDemoStore((state) => state.pcsContextOverride);
    const setPcsContextOverride = useDemoStore((state) => state.setPcsContextOverride);

    const seedDemoArchiveData = usePCSArchiveStore((state) => state.seedDemoArchiveData);
    const clearArchiveData = usePCSArchiveStore((state) => state.clearArchiveData);
    const archiveCount = usePCSArchiveStore((state) => state.historicalOrders.length);

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

            {/* Context Track Override */}
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                Context Track
            </Text>
            <View className="flex-row flex-wrap gap-2 justify-center mb-3">
                {CONTEXT_TRACKS.map((ctx) => {
                    const isActive = pcsContextOverride === ctx;
                    return (
                        <TouchableOpacity
                            key={ctx}
                            onPress={() => setPcsContextOverride(isActive ? null : ctx)}
                            className={`px-3 py-2 rounded-lg border ${isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-transparent'}`}
                            style={{ borderColor: isActive ? '#059669' : borderColor }}
                        >
                            <Text
                                style={{ color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' }}
                                className="text-xs font-semibold"
                            >
                                {ctx}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Phase Override */}
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                Phase Override
            </Text>
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
                                {PCS_PHASE_LABELS[phase]}
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

            {/* Archive Data Controls */}
            <View className="flex-row gap-2 justify-center mt-3 pt-3 border-t border-dashed" style={{ borderTopColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#BFDBFE' }}>
                <TouchableOpacity
                    onPress={seedDemoArchiveData}
                    className="px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: isDark ? '#166534' : '#86EFAC', backgroundColor: isDark ? 'rgba(22, 101, 52, 0.3)' : '#F0FDF4' }}
                >
                    <Text className="text-[10px] font-semibold" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                        Seed Archive ({archiveCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={clearArchiveData}
                    className="px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: isDark ? '#991B1B' : '#FCA5A5', backgroundColor: isDark ? 'rgba(153, 27, 27, 0.3)' : '#FEF2F2' }}
                >
                    <Text className="text-[10px] font-semibold" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                        Clear Archive
                    </Text>
                </TouchableOpacity>
            </View>

            {(pcsPhaseOverride || pcsContextOverride) && (
                <Text className="text-blue-400 text-[10px] text-center mt-2">
                    {pcsContextOverride ? `Context: ${pcsContextOverride}` : ''}{pcsPhaseOverride && pcsContextOverride ? ' · ' : ''}{pcsPhaseOverride ? 'Phase override active' : ''}
                </Text>
            )}
        </View>
    );
}
