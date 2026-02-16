import { useScrollContext } from '@/components/navigation/ScrollControlContext';
import { DEMO_SCENARIOS, useDemoStore } from '@/store/useDemoStore';
import { usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { PCSPhase, TRANSITSubPhase, UCTPhase } from '@/types/pcs';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
    LayoutAnimation,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    useColorScheme,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Display Labels ──────────────────────────────────────────────────────────

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

const UCT_PHASES: UCTPhase[] = [1, 2, 3, 4];

const VIEW_MODES = ['ACTIVE', 'ARCHIVE'] as const;

const VIEW_MODE_LABELS: Record<typeof VIEW_MODES[number], string> = {
    ACTIVE: 'Active Orders',
    ARCHIVE: 'Sea Bag',
};

/**
 * Floating demo panel for the PCS landing page.
 * Provides one-tap scenario presets for smooth live demonstrations,
 * with an expandable advanced section for individual overrides.
 * Only visible in __DEV__ or when enableDevSettings is true.
 */
export function PCSDevPanel() {
    const enableDevSettings = Constants.expoConfig?.extra?.enableDevSettings ?? __DEV__;
    const isDemoMode = useDemoStore((state) => state.isDemoMode);

    const activeDemoScenarioId = useDemoStore((state) => state.activeDemoScenarioId);
    const applyDemoScenario = useDemoStore((state) => state.applyDemoScenario);
    const clearDemoScenario = useDemoStore((state) => state.clearDemoScenario);

    // Individual overrides (for advanced panel)
    const pcsPhaseOverride = useDemoStore((state) => state.pcsPhaseOverride);
    const setPcsPhaseOverride = useDemoStore((state) => state.setPcsPhaseOverride);
    const pcsSubPhaseOverride = useDemoStore((state) => state.pcsSubPhaseOverride);
    const setPcsSubPhaseOverride = useDemoStore((state) => state.setPcsSubPhaseOverride);
    const uctPhaseOverride = useDemoStore((state) => state.uctPhaseOverride);
    const setUctPhaseOverride = useDemoStore((state) => state.setUctPhaseOverride);
    const pcsContextOverride = useDemoStore((state) => state.pcsContextOverride);
    const setPcsContextOverride = useDemoStore((state) => state.setPcsContextOverride);

    // Archive data
    const seedDemoArchiveData = usePCSArchiveStore((state) => state.seedDemoArchiveData);
    const clearArchiveData = usePCSArchiveStore((state) => state.clearArchiveData);
    const archiveCount = usePCSArchiveStore((state) => state.historicalOrders.length);

    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [panelOpen, setPanelOpen] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Sync position with GlobalTabBar's scroll-to-hide animation.
    // Clamp so the beaker settles ~24px above the safe area (not off-screen).
    const { translateY: tabBarTranslateY } = useScrollContext();
    const insets = useSafeAreaInsets();
    const BEAKER_RESTING_BOTTOM = 108; // collapsed-state `bottom` value
    const BEAKER_MIN_BOTTOM = 24 + insets.bottom; // comfortable floor above safe area
    const maxBeakerSlide = Math.max(BEAKER_RESTING_BOTTOM - BEAKER_MIN_BOTTOM, 0);

    const tabBarSyncStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: Math.min(tabBarTranslateY.value, maxBeakerSlide) }],
    }));

    // Reanimated shared values for smooth panel animation
    const panelProgress = useSharedValue(0);

    const ANIM_CONFIG = {
        duration: 280,
        easing: Easing.out(Easing.cubic),
    };

    if (!enableDevSettings || !isDemoMode) return null;

    const borderColor = isDark ? '#27272A' : '#E2E8F0';
    const chipBg = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    const showSubPhase = pcsPhaseOverride === 'TRANSIT_LEAVE';

    const openPanel = () => {
        setPanelOpen(true);
        panelProgress.value = withTiming(1, ANIM_CONFIG);
    };

    const closePanel = () => {
        panelProgress.value = withTiming(0, ANIM_CONFIG);
        // Delay state change so exit animation plays
        setTimeout(() => {
            setPanelOpen(false);
            setShowAdvanced(false);
        }, ANIM_CONFIG.duration);
    };

    const toggleAdvanced = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setShowAdvanced(!showAdvanced);
    };

    // Find active scenario emoji for the badge
    const activeScenario = activeDemoScenarioId
        ? DEMO_SCENARIOS.find(s => s.id === activeDemoScenarioId)
        : null;

    // ── Status Chips ────────────────────────────────────────────────────
    const statusParts: string[] = [];
    if (pcsContextOverride) statusParts.push(VIEW_MODE_LABELS[pcsContextOverride]);
    if (pcsPhaseOverride) statusParts.push(PCS_PHASE_LABELS[pcsPhaseOverride]);
    if (pcsSubPhaseOverride) statusParts.push(TRANSIT_SUB_LABELS[pcsSubPhaseOverride]);
    if (uctPhaseOverride) statusParts.push(`UCT ${uctPhaseOverride}`);

    // Animated styles — must be declared before any early returns (hooks rule)
    const scrimStyle = useAnimatedStyle(() => ({
        opacity: panelProgress.value,
    }));

    const panelStyle = useAnimatedStyle(() => ({
        opacity: panelProgress.value,
        transform: [
            { translateY: (1 - panelProgress.value) * 30 },
        ],
    }));

    // ── Collapsed State: Small floating icon ────────────────────────────
    if (!panelOpen) {
        return (
            <Animated.View
                pointerEvents="box-none"
                style={[{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    left: 0,
                }, tabBarSyncStyle]}
            >
                <TouchableOpacity
                    onPress={openPanel}
                    activeOpacity={0.8}
                    style={{
                        position: 'absolute',
                        bottom: 108,
                        right: 16,
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.25)' : 'rgba(59, 130, 246, 0.15)',
                        borderWidth: 1,
                        borderColor: isDark ? 'rgba(59, 130, 246, 0.4)' : '#93C5FD',
                        ...Platform.select({
                            ios: {
                                shadowColor: '#3B82F6',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 6,
                            },
                            android: { elevation: 6 },
                        }),
                    }}
                >
                    <Ionicons name="flask" size={22} color={isDark ? '#60A5FA' : '#3B82F6'} />
                </TouchableOpacity>
            </Animated.View>
        );
    }

    // ── Expanded State: Scrim + Panel ────────────────────────────────
    return (
        <>
            {/* Dimmed backdrop — tap to dismiss */}
            <Animated.View
                style={[{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }, scrimStyle]}
                pointerEvents="auto"
            >
                <Pressable
                    onPress={closePanel}
                    style={{
                        flex: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    }}
                />
            </Animated.View>
            <Animated.View
                style={[{
                    position: 'absolute',
                    bottom: 90,
                    left: 12,
                    right: 12,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(239, 246, 255, 0.98)',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#93C5FD',
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: -4 },
                            shadowOpacity: 0.25,
                            shadowRadius: 12,
                        },
                        android: { elevation: 12 },
                    }),
                }, panelStyle, tabBarSyncStyle]}
            >
                <View style={{ padding: 16 }}>
                    {/* ── Title + Close ────────────────────────────────────── */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                        <Text
                            style={{
                                color: isDark ? '#60A5FA' : '#3B82F6',
                                fontSize: 10,
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: 1.2,
                            }}
                        >
                            Demo Scenarios
                        </Text>
                        <TouchableOpacity
                            onPress={closePanel}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                            style={{ position: 'absolute', right: 0 }}
                        >
                            <Ionicons name="close-circle" size={20} color={isDark ? '#475569' : '#94A3B8'} />
                        </TouchableOpacity>
                    </View>

                    {/* ── Scenario Preset Chips ────────────────────────────── */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
                    >
                        {DEMO_SCENARIOS.map((scenario) => {
                            const isActive = activeDemoScenarioId === scenario.id;
                            return (
                                <TouchableOpacity
                                    key={scenario.id}
                                    onPress={() => {
                                        if (isActive) {
                                            clearDemoScenario();
                                        } else {
                                            applyDemoScenario(scenario);
                                        }
                                    }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        gap: 5,
                                        paddingHorizontal: 14,
                                        paddingVertical: 14,
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        backgroundColor: isActive
                                            ? (isDark ? '#065F46' : '#059669')
                                            : chipBg,
                                        borderColor: isActive
                                            ? '#059669'
                                            : borderColor,
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{ fontSize: 13 }}>{scenario.icon}</Text>
                                    <Text
                                        style={{
                                            fontSize: 11,
                                            fontWeight: '600',
                                            color: isActive
                                                ? '#FFFFFF'
                                                : (isDark ? '#94A3B8' : '#475569'),
                                        }}
                                    >
                                        {scenario.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>

                    {/* ── Data Actions ─────────────────────────────────────── */}
                    <View
                        style={{
                            flexDirection: 'row',
                            gap: 8,
                            justifyContent: 'center',
                            marginTop: 10,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderStyle: 'dashed',
                            borderTopColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#BFDBFE',
                        }}
                    >
                        <TouchableOpacity
                            onPress={seedDemoArchiveData}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? '#166534' : '#86EFAC',
                                backgroundColor: isDark ? 'rgba(22, 101, 52, 0.3)' : '#F0FDF4',
                            }}
                        >
                            <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#86EFAC' : '#166534' }}>
                                Load Sea Bag ({archiveCount})
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={clearArchiveData}
                            style={{
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? '#991B1B' : '#FCA5A5',
                                backgroundColor: isDark ? 'rgba(153, 27, 27, 0.3)' : '#FEF2F2',
                            }}
                        >
                            <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#FCA5A5' : '#991B1B' }}>
                                Clear Sea Bag
                            </Text>
                        </TouchableOpacity>

                        {/* Advanced Toggle */}
                        <TouchableOpacity
                            onPress={toggleAdvanced}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 3,
                                paddingHorizontal: 14,
                                paddingVertical: 12,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: isDark ? '#374151' : '#CBD5E1',
                                backgroundColor: isDark ? 'rgba(55, 65, 81, 0.3)' : '#F8FAFC',
                            }}
                        >
                            <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? '#94A3B8' : '#64748B' }}>
                                Advanced
                            </Text>
                            <Ionicons
                                name={showAdvanced ? 'chevron-down' : 'chevron-up'}
                                size={10}
                                color={isDark ? '#94A3B8' : '#64748B'}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* ── Advanced Overrides (Collapsible) ─────────────────── */}
                    {showAdvanced && (
                        <View style={{ marginTop: 10 }}>
                            {/* View Mode */}
                            <Text style={sectionLabel(isDark)}>View</Text>
                            <View style={buttonRow}>
                                {VIEW_MODES.map((mode) => {
                                    const isActive = pcsContextOverride === mode;
                                    return (
                                        <TouchableOpacity
                                            key={mode}
                                            onPress={() => setPcsContextOverride(isActive ? null : mode)}
                                            style={overrideBtn(isActive, isDark, borderColor, 'emerald')}
                                        >
                                            <Text style={overrideBtnText(isActive, isDark)}>
                                                {VIEW_MODE_LABELS[mode]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Travel Phase */}
                            <Text style={sectionLabel(isDark)}>Travel Phase</Text>
                            <View style={buttonRow}>
                                {PCS_PHASES.map((phase) => {
                                    const isActive = pcsPhaseOverride === phase;
                                    return (
                                        <TouchableOpacity
                                            key={phase}
                                            onPress={() => {
                                                if (pcsContextOverride !== 'ACTIVE') setPcsContextOverride('ACTIVE');
                                                setPcsPhaseOverride(isActive ? null : phase);
                                            }}
                                            style={overrideBtn(isActive, isDark, borderColor, 'blue')}
                                        >
                                            <Text style={overrideBtnText(isActive, isDark)}>
                                                {PCS_PHASE_LABELS[phase]}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* In Transit Sub-Phase */}
                            {showSubPhase && (
                                <>
                                    <Text style={sectionLabel(isDark)}>Sub-Phase</Text>
                                    <View style={buttonRow}>
                                        {TRANSIT_SUB_PHASES.map((sub) => {
                                            const isActive = pcsSubPhaseOverride === sub;
                                            return (
                                                <TouchableOpacity
                                                    key={sub}
                                                    onPress={() => setPcsSubPhaseOverride(isActive ? null : sub)}
                                                    style={overrideBtn(isActive, isDark, borderColor, 'amber')}
                                                >
                                                    <Text style={overrideBtnText(isActive, isDark)}>
                                                        {TRANSIT_SUB_LABELS[sub]}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                            {/* UCT Phase */}
                            <Text style={sectionLabel(isDark)}>UCT Phase</Text>
                            <View style={buttonRow}>
                                {UCT_PHASES.map((phase) => {
                                    const isActive = uctPhaseOverride === phase;
                                    return (
                                        <TouchableOpacity
                                            key={phase}
                                            onPress={() => {
                                                if (pcsContextOverride !== 'ACTIVE') setPcsContextOverride('ACTIVE');
                                                setUctPhaseOverride(isActive ? null : phase);
                                            }}
                                            style={overrideBtn(isActive, isDark, borderColor, 'purple')}
                                        >
                                            <Text style={overrideBtnText(isActive, isDark)}>
                                                Phase {phase}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    )}

                    {/* ── Status Badge ─────────────────────────────────────── */}
                    {statusParts.length > 0 && (
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: 4,
                            marginTop: 8,
                        }}>
                            {statusParts.map((part, i) => (
                                <View
                                    key={i}
                                    style={{
                                        paddingHorizontal: 6,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                                    }}
                                >
                                    <Text style={{
                                        fontSize: 9,
                                        fontWeight: '600',
                                        color: isDark ? '#60A5FA' : '#3B82F6',
                                    }}>
                                        {part}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </Animated.View>
        </>
    );
}

// ── Shared Styles ───────────────────────────────────────────────────────────

const ACTIVE_COLORS: Record<string, { bg: string; border: string }> = {
    emerald: { bg: '#059669', border: '#059669' },
    blue: { bg: '#3B82F6', border: '#2563EB' },
    amber: { bg: '#F59E0B', border: '#D97706' },
    purple: { bg: '#8B5CF6', border: '#7E22CE' },
};

const sectionLabel = (isDark: boolean) => ({
    fontSize: 10,
    fontWeight: '600' as const,
    color: isDark ? '#64748B' : '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    textAlign: 'center' as const,
    marginBottom: 4,
    marginTop: 8,
});

const buttonRow = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    justifyContent: 'center' as const,
};

const overrideBtn = (isActive: boolean, isDark: boolean, borderColor: string, accent: string) => ({
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: isActive ? ACTIVE_COLORS[accent].bg : 'transparent',
    borderColor: isActive ? ACTIVE_COLORS[accent].border : borderColor,
});

const overrideBtnText = (isActive: boolean, isDark: boolean) => ({
    fontSize: 10,
    fontWeight: '600' as const,
    color: isActive ? '#FFFFFF' : (isDark ? '#94A3B8' : '#64748B'),
});
