import { useDemoStore } from '@/store/useDemoStore';
import { usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { PCSPhase, TRANSITSubPhase } from '@/types/pcs';
import Constants from 'expo-constants';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';

// ── Display Labels ──────────────────────────────────────────────────────────
// Map internal enum values to demo-friendly labels

const PCS_PHASES: PCSPhase[] = ['ORDERS_NEGOTIATION', 'TRANSIT_LEAVE', 'CHECK_IN'];

const PCS_PHASE_LABELS: Record<PCSPhase, string> = {
    DORMANT: 'DORMANT',
    ORDERS_NEGOTIATION: 'PRE-TRANSFER',
    TRANSIT_LEAVE: 'IN TRANSIT',
    CHECK_IN: 'ARRIVED ONSTA',
};

const TRANSIT_SUB_PHASES: TRANSITSubPhase[] = ['PLANNING', 'ACTIVE_TRAVEL'];

const TRANSIT_SUB_LABELS: Record<TRANSITSubPhase, string> = {
    PLANNING: 'PLANNING',
    ACTIVE_TRAVEL: 'EN ROUTE',
};

const VIEW_MODES = ['ACTIVE', 'ARCHIVE'] as const;

const VIEW_MODE_LABELS: Record<typeof VIEW_MODES[number], string> = {
    ACTIVE: 'Active Orders',
    ARCHIVE: 'Sea Bag',
};

/**
 * Inline demo panel for the PCS landing page.
 * Provides scenario switching for live demonstrations:
 * view mode, travel phase, and sample archive data.
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
                Demo Scenarios
            </Text>

            {/* View Mode */}
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                View
            </Text>
            <View className="flex-row flex-wrap gap-2 justify-center mb-3">
                {VIEW_MODES.map((mode) => {
                    const isActive = pcsContextOverride === mode;
                    return (
                        <TouchableOpacity
                            key={mode}
                            onPress={() => setPcsContextOverride(isActive ? null : mode)}
                            className={`px-3 py-2 rounded-lg border ${isActive ? 'bg-emerald-500 border-emerald-600' : 'bg-transparent'}`}
                            style={{ borderColor: isActive ? '#059669' : borderColor }}
                        >
                            <Text
                                style={{ color: isActive ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B' }}
                                className="text-xs font-semibold"
                            >
                                {VIEW_MODE_LABELS[mode]}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Travel Phase */}
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 text-center">
                Travel Phase
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

            {/* In Transit Sub-Phase */}
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
                                    {TRANSIT_SUB_LABELS[sub]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {/* Sea Bag Data */}
            <View className="flex-row gap-2 justify-center mt-3 pt-3 border-t border-dashed" style={{ borderTopColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#BFDBFE' }}>
                <TouchableOpacity
                    onPress={seedDemoArchiveData}
                    className="px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: isDark ? '#166534' : '#86EFAC', backgroundColor: isDark ? 'rgba(22, 101, 52, 0.3)' : '#F0FDF4' }}
                >
                    <Text className="text-[10px] font-semibold" style={{ color: isDark ? '#86EFAC' : '#166534' }}>
                        Load Sea Bag ({archiveCount})
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={clearArchiveData}
                    className="px-3 py-1.5 rounded-lg border"
                    style={{ borderColor: isDark ? '#991B1B' : '#FCA5A5', backgroundColor: isDark ? 'rgba(153, 27, 27, 0.3)' : '#FEF2F2' }}
                >
                    <Text className="text-[10px] font-semibold" style={{ color: isDark ? '#FCA5A5' : '#991B1B' }}>
                        Clear Sea Bag
                    </Text>
                </TouchableOpacity>
            </View>

            {(pcsPhaseOverride || pcsContextOverride) && (
                <Text className="text-blue-400 text-[10px] text-center mt-2">
                    {pcsContextOverride ? VIEW_MODE_LABELS[pcsContextOverride] : ''}{pcsPhaseOverride && pcsContextOverride ? ' · ' : ''}{pcsPhaseOverride ? PCS_PHASE_LABELS[pcsPhaseOverride] : ''}
                </Text>
            )}
        </View>
    );
}
