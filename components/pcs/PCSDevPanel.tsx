import { useScrollContextSafe } from '@/components/navigation/ScrollControlContext';
import { DEMO_USERS } from '@/constants/DemoData';
import { LIFECYCLE_STEPS, useDemoStore } from '@/store/useDemoStore';
import { usePCSArchiveStore } from '@/store/usePCSArchiveStore';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { useEffect, useState } from 'react';
import {
    Dimensions,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme
} from 'react-native';
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;



/**
 * Floating demo panel for the PCS landing page.
 * Provides one-tap scenario presets for smooth live demonstrations,
 * with an expandable advanced section for individual overrides.
 * Only visible in __DEV__ or when enableDevSettings is true.
 */
export function PCSDevPanel() {
    const enableDevSettings = Constants.expoConfig?.extra?.enableDevSettings || __DEV__;
    const isDemoMode = useDemoStore((state) => state.isDemoMode);

    // Auto-enable demo mode in dev builds — no manual toggle needed
    useEffect(() => {
        if (enableDevSettings && !isDemoMode) {
            useDemoStore.getState().toggleDemoMode();
        }
    }, [enableDevSettings]);
    const selectedUser = useDemoStore((state) => state.selectedUser);
    const setSelectedUser = useDemoStore((state) => state.setSelectedUser);

    const lifecycleStep = useDemoStore((state) => state.lifecycleStep);
    const setLifecycleStep = useDemoStore((state) => state.setLifecycleStep);
    const showDevFloatingIcons = useDemoStore((state) => state.showDevFloatingIcons);
    const currentStep = LIFECYCLE_STEPS[lifecycleStep] ?? LIFECYCLE_STEPS[0];



    // Archive data
    const seedDemoArchiveData = usePCSArchiveStore((state) => state.seedDemoArchiveData);
    const clearArchiveData = usePCSArchiveStore((state) => state.clearArchiveData);
    const archiveCount = usePCSArchiveStore((state) => state.historicalOrders.length);

    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const [panelOpen, setPanelOpen] = useState(false);
    const [stepListOpen, setStepListOpen] = useState(false);

    // Sync position with GlobalTabBar's scroll-to-hide animation.
    // Clamp so the beaker settles ~24px above the safe area (not off-screen).
    // Use safe variant — context may be absent on screens without CollapsibleScaffold.
    const scrollContext = useScrollContextSafe();
    const fallbackTranslateY = useSharedValue(0);
    const tabBarTranslateY = scrollContext?.translateY ?? fallbackTranslateY;
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



    if (!enableDevSettings) return null;

    const borderColor = isDark ? '#27272A' : '#E2E8F0';


    const openPanel = () => {
        setPanelOpen(true);
        panelProgress.value = withTiming(1, ANIM_CONFIG);
    };

    const closePanel = () => {
        setPanelOpen(false);
        setStepListOpen(false);
        panelProgress.value = 0;
    };



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
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                                <View style={{ width: 28 }} />
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
                                <TouchableOpacity
                                    onPress={closePanel}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 14,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(226,232,240,0.8)',
                                    }}
                                >
                                    <Ionicons name="close" size={16} color={isDark ? '#94A3B8' : '#64748B'} />
                                </TouchableOpacity>
                            </View>

                            {/* ── Persona Selector ────────────────────────────── */}
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

                            {/* ── Lifecycle Stepper ────────────────────────── */}
                            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#E2E8F0', marginVertical: 8 }} />
                            <Text style={sectionLabel(isDark)}>Lifecycle Phase</Text>

                            {/* Arrow stepper row */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 12,
                                marginVertical: 4,
                            }}>
                                {/* Prev arrow */}
                                <TouchableOpacity
                                    onPress={() => setLifecycleStep(lifecycleStep - 1)}
                                    disabled={lifecycleStep === 0}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                                        opacity: lifecycleStep === 0 ? 0.3 : 1,
                                    }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="chevron-back" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                                </TouchableOpacity>

                                {/* Center label — tap to expand list */}
                                <TouchableOpacity
                                    onPress={() => setStepListOpen(!stepListOpen)}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 10,
                                        paddingHorizontal: 14,
                                        borderRadius: 10,
                                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)',
                                        borderWidth: 1,
                                        borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : '#BFDBFE',
                                        alignItems: 'center',
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={{
                                        fontSize: 13,
                                        fontWeight: '700',
                                        color: isDark ? '#60A5FA' : '#3B82F6',
                                    }}>
                                        {currentStep.icon}  {currentStep.label}
                                    </Text>
                                    <Text style={{
                                        fontSize: 9,
                                        fontWeight: '500',
                                        color: isDark ? '#64748B' : '#94A3B8',
                                        marginTop: 2,
                                    }}>
                                        {lifecycleStep + 1} of {LIFECYCLE_STEPS.length} · tap to jump
                                    </Text>
                                </TouchableOpacity>

                                {/* Next arrow */}
                                <TouchableOpacity
                                    onPress={() => setLifecycleStep(lifecycleStep + 1)}
                                    disabled={lifecycleStep === LIFECYCLE_STEPS.length - 1}
                                    style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(226, 232, 240, 0.8)',
                                        opacity: lifecycleStep === LIFECYCLE_STEPS.length - 1 ? 0.3 : 1,
                                    }}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <Ionicons name="chevron-forward" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
                                </TouchableOpacity>
                            </View>

                            {/* Expanded phase list — random access */}
                            {stepListOpen && (
                                <View style={{
                                    marginTop: 6,
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#E2E8F0',
                                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                                    overflow: 'hidden',
                                }}>
                                    {LIFECYCLE_STEPS.map((s) => {
                                        const isActive = s.step === lifecycleStep;
                                        return (
                                            <TouchableOpacity
                                                key={s.step}
                                                onPress={() => {
                                                    setLifecycleStep(s.step);
                                                    setStepListOpen(false);
                                                }}
                                                style={{
                                                    flexDirection: 'row',
                                                    alignItems: 'center',
                                                    paddingVertical: 10,
                                                    paddingHorizontal: 14,
                                                    backgroundColor: isActive
                                                        ? (isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)')
                                                        : 'transparent',
                                                    borderBottomWidth: s.step < LIFECYCLE_STEPS.length - 1 ? 0.5 : 0,
                                                    borderBottomColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#F1F5F9',
                                                }}
                                                activeOpacity={0.6}
                                            >
                                                <Text style={{ fontSize: 14, width: 24 }}>{s.icon}</Text>
                                                <Text style={{
                                                    flex: 1,
                                                    fontSize: 12,
                                                    fontWeight: isActive ? '700' : '500',
                                                    color: isActive
                                                        ? (isDark ? '#60A5FA' : '#3B82F6')
                                                        : (isDark ? '#94A3B8' : '#64748B'),
                                                }}>
                                                    {s.label}
                                                </Text>
                                                {isActive && (
                                                    <Ionicons name="checkmark-circle" size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            )}

                            {/* ── PCS Data Actions (Sea Bag) ─────────────────── */}
                            <View style={{ height: 1, backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : '#E2E8F0', marginVertical: 8 }} />
                            <View
                                style={{
                                    flexDirection: 'row',
                                    gap: 8,
                                    justifyContent: 'center',
                                    paddingTop: 4,
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
                            </View>

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
            )
            }

            {/* Floating icons — only when panel closed AND icons enabled */}
            {
                !panelOpen && showDevFloatingIcons && (
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
                        {/* ── Phase stepper chevrons ── */}
                        <TouchableOpacity
                            onPress={() => setLifecycleStep(Math.max(0, lifecycleStep - 1))}
                            activeOpacity={0.7}
                            disabled={lifecycleStep <= 0}
                            style={{
                                position: 'absolute',
                                bottom: 108 + 48 + 8 + 36 + 4,  // beaker bottom + beaker height + gap + chevron height + gap
                                right: 16 + (48 - 36) / 2,      // center within beaker column
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.10)',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(252, 165, 165, 0.6)',
                                opacity: lifecycleStep <= 0 ? 0.35 : 1,
                            }}
                        >
                            <Ionicons name="chevron-up" size={18} color={isDark ? '#F87171' : '#EF4444'} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setLifecycleStep(Math.min(LIFECYCLE_STEPS.length - 1, lifecycleStep + 1))}
                            activeOpacity={0.7}
                            disabled={lifecycleStep >= LIFECYCLE_STEPS.length - 1}
                            style={{
                                position: 'absolute',
                                bottom: 108 + 48 + 8,            // beaker bottom + beaker height + gap
                                right: 16 + (48 - 36) / 2,      // center within beaker column
                                width: 36,
                                height: 36,
                                borderRadius: 18,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.10)',
                                borderWidth: 1,
                                borderColor: isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(134, 239, 172, 0.6)',
                                opacity: lifecycleStep >= LIFECYCLE_STEPS.length - 1 ? 0.35 : 1,
                            }}
                        >
                            <Ionicons name="chevron-down" size={18} color={isDark ? '#4ADE80' : '#22C55E'} />
                        </TouchableOpacity>

                        {/* ── Beaker icon ── */}
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
                            {/* Step indicator badge */}
                            <View style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                minWidth: 20,
                                height: 20,
                                borderRadius: 10,
                                backgroundColor: isDark ? 'rgba(59, 130, 246, 0.8)' : '#3B82F6',
                                borderWidth: 1.5,
                                borderColor: isDark ? 'rgba(15, 23, 42, 0.96)' : '#EFF6FF',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}>
                                <Text style={{ fontSize: 10 }}>{currentStep.icon}</Text>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                )
            }
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
