import { useScrollContext } from '@/components/navigation/ScrollControlContext';
import { DEMO_USERS, DemoPhase } from '@/constants/DemoData';
import { DEMO_SCENARIOS, useDemoStore } from '@/store/useDemoStore';
import { usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { PCSPhase, TRANSITSubPhase, UCTPhase } from '@/types/pcs';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

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
    const toggleDemoMode = useDemoStore((state) => state.toggleDemoMode);
    const selectedUser = useDemoStore((state) => state.selectedUser);
    const setSelectedUser = useDemoStore((state) => state.setSelectedUser);
    const selectedPhase = useDemoStore((state) => state.selectedPhase);
    const setSelectedPhase = useDemoStore((state) => state.setSelectedPhase);

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

    // Reanimated height for Advanced section (replaces LayoutAnimation)
    const advancedProgress = useSharedValue(0);

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

    // Animated styles — MUST be declared before any early returns (hooks rule)
    const scrimStyle = useAnimatedStyle(() => ({
        opacity: panelProgress.value,
    }));

    const panelStyle = useAnimatedStyle(() => ({
        opacity: panelProgress.value,
        transform: [
            { translateY: (1 - panelProgress.value) * 30 },
        ],
    }));

    const advancedStyle = useAnimatedStyle(() => ({
        opacity: advancedProgress.value,
        maxHeight: advancedProgress.value * 400,
        overflow: 'hidden' as const,
    }));

    if (!enableDevSettings) return null;

    // Whether PCS-specific controls should be shown
    const isPCSActive = isDemoMode && selectedPhase === DemoPhase.MY_PCS;

    const borderColor = isDark ? '#27272A' : '#E2E8F0';
    const chipBg = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)';
    const showSubPhase = pcsPhaseOverride === 'TRANSIT_LEAVE';

    const openPanel = () => {
        setPanelOpen(true);
        panelProgress.value = withTiming(1, ANIM_CONFIG);
    };

    const closePanel = () => {
        // Set state immediately — the beaker icon appears instantly.
        // No animation callbacks needed; the panel simply unmounts.
        setPanelOpen(false);
        setShowAdvanced(false);
        advancedProgress.value = 0;
        panelProgress.value = 0;
    };

    const toggleAdvanced = () => {
        const next = !showAdvanced;
        setShowAdvanced(next);
        advancedProgress.value = withTiming(next ? 1 : 0, {
            duration: 280,
            easing: Easing.out(Easing.cubic),
        });
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



    // ── Render: Beaker always present, panel overlays on top ─────────
    return (
        <>
            {/* Panel overlay — only mounted when open */}
            {panelOpen && (
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
                        <ScrollView style={{ padding: 16, maxHeight: SCREEN_HEIGHT * 0.55 }} showsVerticalScrollIndicator={false}>
                            {/* ── Title ────────────────────────────────────── */}
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
                                    Developer Settings
                                </Text>
                            </View>

                            {/* ── Demo Mode Toggle ────────────────────────────── */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                paddingVertical: 8,
                                paddingHorizontal: 4,
                                marginBottom: 8,
                                borderBottomWidth: 1,
                                borderStyle: 'dashed',
                                borderBottomColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#BFDBFE',
                            }}>
                                <Text style={{
                                    fontSize: 11,
                                    fontWeight: '700',
                                    color: isDemoMode ? (isDark ? '#FBBF24' : '#D97706') : (isDark ? '#94A3B8' : '#64748B'),
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                }}>
                                    {isDemoMode ? '⚡ Simulation Active' : 'Demo Mode'}
                                </Text>
                                <Switch
                                    value={isDemoMode}
                                    onValueChange={toggleDemoMode}
                                    trackColor={{ false: isDark ? '#374151' : '#E2E8F0', true: '#F59E0B' }}
                                    thumbColor="#FFFFFF"
                                />
                            </View>

                            {/* ── Persona Selector ────────────────────────────── */}
                            {isDemoMode && (
                                <>
                                    <Text style={sectionLabel(isDark)}>Persona</Text>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ gap: 10, paddingHorizontal: 2, marginBottom: 4 }}
                                    >
                                        {DEMO_USERS.map((u) => {
                                            const isActive = selectedUser.id === u.id;
                                            return (
                                                <TouchableOpacity
                                                    key={u.id}
                                                    onPress={() => setSelectedUser(u)}
                                                    style={overrideBtn(isActive, isDark, borderColor, 'amber')}
                                                >
                                                    <Text style={overrideBtnText(isActive, isDark)}>
                                                        {u.title} {u.displayName}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </ScrollView>

                                    {/* ── App Phase Selector ────────────────────────── */}
                                    <View style={{ height: 1, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#E2E8F0', marginVertical: 8 }} />
                                    <Text style={sectionLabel(isDark)}>App Phase</Text>
                                    <View style={buttonRow}>
                                        {Object.values(DemoPhase).map((phase) => {
                                            const isActive = selectedPhase === phase;
                                            return (
                                                <TouchableOpacity
                                                    key={phase}
                                                    onPress={() => setSelectedPhase(phase)}
                                                    style={overrideBtn(isActive, isDark, borderColor, 'amber')}
                                                >
                                                    <Text style={overrideBtnText(isActive, isDark)}>
                                                        {phase.replace('_', ' ')}
                                                    </Text>
                                                </TouchableOpacity>
                                            );
                                        })}
                                    </View>
                                </>
                            )}

                            {/* ── PCS-Specific Controls ───────────────────────── */}
                            {isPCSActive && (
                                <>
                                    <View style={{ height: 1, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#E2E8F0', marginVertical: 8 }} />
                                    <Text style={[sectionLabel(isDark), { marginTop: 4 }]}>PCS Scenarios</Text>

                                    {/* ── Scenario Preset Chips ────────────────────────────── */}
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={{ gap: 10, paddingHorizontal: 2 }}
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

                                    {/* ── PCS Data Actions ──────────────────────────────────── */}
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
                                                name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                                                size={10}
                                                color={isDark ? '#94A3B8' : '#64748B'}
                                            />
                                        </TouchableOpacity>
                                    </View>

                                    {/* ── Advanced Overrides (Collapsible) ─────────────────── */}
                                    <Animated.View style={[{ marginTop: 10 }, advancedStyle]}>
                                        {showAdvanced && (
                                            <View>
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
                                    </Animated.View>
                                </>
                            )}

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

                            {/* ── Reset Session Memory ────────────────────────── */}
                            <TouchableOpacity
                                onPress={() => {
                                    const { Alert } = require('react-native');
                                    Alert.alert(
                                        'Reset Session Memory',
                                        'This clears all persisted state (PCS, demo, archive) and reloads the app. Continue?',
                                        [
                                            { text: 'Cancel', style: 'cancel' },
                                            {
                                                text: 'Reset',
                                                style: 'destructive',
                                                onPress: async () => {
                                                    try {
                                                        await AsyncStorage.clear();
                                                        // Reload the app to apply fresh state
                                                        const { DevSettings } = require('react-native');
                                                        DevSettings?.reload?.();
                                                    } catch (e) {
                                                        console.warn('[DevPanel] Reset failed:', e);
                                                    }
                                                },
                                            },
                                        ],
                                    );
                                }}
                                style={{
                                    marginTop: 12,
                                    paddingVertical: 10,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.3)',
                                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(254, 226, 226, 0.5)',
                                    alignItems: 'center',
                                }}
                            >
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: '700',
                                    color: isDark ? '#FCA5A5' : '#DC2626',
                                    textTransform: 'uppercase',
                                    letterSpacing: 0.8,
                                }}>
                                    Reset Session Memory
                                </Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </Animated.View>
                </>
            )}

            {/* Beaker icon — ALWAYS rendered, never conditionally hidden */}
            {!panelOpen && (
                <Animated.View
                    pointerEvents="box-none"
                    style={[{
                        position: 'absolute',
                        top: 0,
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
                        {activeScenario && (
                            <View style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                minWidth: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: isDark ? '#065F46' : '#059669',
                                borderWidth: 1.5,
                                borderColor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#EFF6FF',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Text style={{ fontSize: 10 }}>{activeScenario.icon}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            )}
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
    gap: 10,
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
