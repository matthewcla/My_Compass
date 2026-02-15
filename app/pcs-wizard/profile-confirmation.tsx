import { ScalePressable } from '@/components/ScalePressable';
import Colors from '@/constants/Colors';
import { useCurrentProfile } from '@/store/useDemoStore';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import { useUserStore } from '@/store/useUserStore';
import type { Address, Beneficiary, DependentDetail, POV } from '@/types/user';
import {
    DEPENDENT_RELATIONSHIPS,
    HOUSING_TYPES,
    MARITAL_STATUSES,
} from '@/types/user';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
    AlertTriangle,
    Car,
    Check,
    CheckCircle2,
    ChevronLeft,
    Heart,
    Home,
    Phone,
    Plus,

    Trash2,
    UserCheck,
    Users,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    Pressable,
    ScrollView, Switch, Text,
    TextInput,
    View,
    useColorScheme
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── UUID ────────────────────────────────────────────────
const uuid = () =>
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });

// ─── Section Steps ───────────────────────────────────────
const PROFILE_STEPS: { id: number; icon: LucideIcon; label: string }[] = [
    { id: 0, icon: Phone, label: 'Contact' },
    { id: 1, icon: Users, label: 'Dependents' },
    { id: 2, icon: Home, label: 'Housing' },
    { id: 3, icon: Car, label: 'Vehicle' },
    { id: 4, icon: Heart, label: 'Beneficiaries' },
    { id: 5, icon: UserCheck, label: 'PADD' },
];

const TOTAL_STEPS = PROFILE_STEPS.length;

// Section confirmation state
type SectionState = 'unvisited' | 'skipped' | 'confirmed_partial' | 'confirmed_complete';

// ─── Field Component ─────────────────────────────────────
function Field({
    label,
    value,
    onChangeText,
    placeholder,
    readOnly = false,
    keyboardType = 'default',
}: {
    label: string;
    value: string;
    onChangeText?: (t: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    keyboardType?: 'default' | 'phone-pad' | 'email-address' | 'numeric';
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    return (
        <View style={{ marginBottom: 12 }}>
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1,
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginBottom: 4,
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </Text>
            {readOnly ? (
                <View
                    style={{
                        backgroundColor: isDark ? '#27272A' : '#F1F5F9',
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                    }}
                >
                    <Text style={{ fontSize: 15, color: isDark ? '#CBD5E1' : '#475569' }}>
                        {value || '—'}
                    </Text>
                </View>
            ) : (
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder || label}
                    placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                    keyboardType={keyboardType}
                    style={{
                        backgroundColor: isDark ? '#27272A' : '#F8FAFC',
                        borderColor: isDark ? '#3F3F46' : '#E2E8F0',
                        borderWidth: 1,
                        borderRadius: 10,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 15,
                        color: isDark ? '#FFFFFF' : '#0F172A',
                    }}
                />
            )}
        </View>
    );
}

// ─── Picker Row ──────────────────────────────────────────
function PickerRow({
    label,
    options,
    selected,
    onSelect,
}: {
    label: string;
    options: readonly string[];
    selected?: string;
    onSelect: (v: string) => void;
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const fmt = (v: string) => v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    return (
        <View style={{ marginBottom: 12 }}>
            <Text
                style={{
                    fontSize: 11,
                    fontWeight: '600',
                    letterSpacing: 1,
                    color: isDark ? '#94A3B8' : '#64748B',
                    marginBottom: 6,
                    textTransform: 'uppercase',
                }}
            >
                {label}
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {options.map((opt) => {
                    const isSelected = opt === selected;
                    return (
                        <Pressable
                            key={opt}
                            onPress={() => onSelect(opt)}
                            style={{
                                paddingHorizontal: 12,
                                paddingVertical: 7,
                                borderRadius: 8,
                                borderWidth: 1,
                                backgroundColor: isSelected
                                    ? isDark ? '#1E3A5F' : '#DBEAFE'
                                    : isDark ? '#27272A' : '#F8FAFC',
                                borderColor: isSelected
                                    ? '#3B82F6'
                                    : isDark ? '#3F3F46' : '#E2E8F0',
                            }}
                        >
                            <Text
                                style={{
                                    fontSize: 13,
                                    fontWeight: isSelected ? '700' : '500',
                                    color: isSelected
                                        ? '#3B82F6'
                                        : isDark ? '#CBD5E1' : '#475569',
                                }}
                            >
                                {fmt(opt)}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
}

// ─── Section Confirm Button ──────────────────────────────
function SectionConfirmButton({
    state,
    onConfirm,
}: {
    state: SectionState;
    onConfirm: () => void;
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const config = {
        unvisited: {
            bg: isDark ? '#1E293B' : '#F1F5F9',
            border: isDark ? '#334155' : '#E2E8F0',
            text: isDark ? '#94A3B8' : '#64748B',
            label: 'Confirm Section',
            icon: null,
        },
        skipped: {
            bg: isDark ? 'rgba(239,68,68,0.1)' : '#FEF2F2',
            border: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA',
            text: '#EF4444',
            label: 'Not Confirmed — Tap to Confirm',
            icon: AlertTriangle,
        },
        confirmed_partial: {
            bg: isDark ? 'rgba(245,158,11,0.1)' : '#FFFBEB',
            border: isDark ? 'rgba(245,158,11,0.3)' : '#FCD34D',
            text: '#F59E0B',
            label: 'Confirmed (Incomplete)',
            icon: AlertTriangle,
        },
        confirmed_complete: {
            bg: isDark ? 'rgba(34,197,94,0.1)' : '#F0FDF4',
            border: isDark ? 'rgba(34,197,94,0.3)' : '#BBF7D0',
            text: '#22C55E',
            label: 'Confirmed ✓',
            icon: CheckCircle2,
        },
    }[state];

    const isConfirmed = state === 'confirmed_partial' || state === 'confirmed_complete';
    const Icon = config.icon;

    return (
        <Pressable
            onPress={onConfirm}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                borderWidth: 1.5,
                backgroundColor: config.bg,
                borderColor: config.border,
                marginTop: 8,
            }}
        >
            {Icon && <Icon size={16} color={config.text} strokeWidth={2.5} />}
            <Text style={{ fontSize: 14, fontWeight: '700', color: config.text }}>
                {config.label}
            </Text>
        </Pressable>
    );
}

// ─── Status Bar (matches PCSWizardStatusBar) ─────────────
const ProfileStatusBar = React.memo(function ProfileStatusBar({
    activeStep,
    sectionStates,
    onStepPress,
}: {
    activeStep: number;
    sectionStates: SectionState[];
    onStepPress: (step: number) => void;
}) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const getColor = (state: SectionState, isActive: boolean) => {
        if (isActive) return isDark ? Colors.blue[500] : Colors.blue[600];
        switch (state) {
            case 'confirmed_complete':
                return isDark ? Colors.green[500] : Colors.green[600];
            case 'confirmed_partial':
                return '#F59E0B';
            case 'skipped':
                return isDark ? '#EF4444' : '#DC2626';
            default:
                return isDark ? Colors.gray[500] : Colors.gray[400];
        }
    };

    const getBorderClass = (state: SectionState, isActive: boolean) => {
        if (isActive) return 'border-blue-600 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20';
        switch (state) {
            case 'confirmed_complete':
                return 'border-green-600 dark:border-green-500 bg-green-50 dark:bg-green-900/20';
            case 'confirmed_partial':
                return 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/20';
            case 'skipped':
                return 'border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20';
            default:
                return 'border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-950';
        }
    };

    const getLineColor = (_index: number) => {
        return 'bg-gray-200 dark:bg-gray-800';
    };

    const getTextClass = (state: SectionState, isActive: boolean) => {
        if (isActive) return 'text-blue-600 dark:text-blue-400';
        switch (state) {
            case 'confirmed_complete': return 'text-green-600 dark:text-green-500';
            case 'confirmed_partial': return 'text-amber-500 dark:text-amber-400';
            case 'skipped': return 'text-red-600 dark:text-red-400';
            default: return 'text-slate-400 dark:text-gray-500';
        }
    };

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}
        >
            {PROFILE_STEPS.map((step, index) => {
                const isLast = index === TOTAL_STEPS - 1;
                const Icon = step.icon;
                const isActive = index === activeStep;
                const state = sectionStates[index];
                const color = getColor(state, isActive);

                return (
                    <React.Fragment key={step.id}>
                        <Pressable
                            hitSlop={10}
                            onPress={() => onStepPress(index)}
                            className="items-center justify-center z-10"
                        >
                            <View
                                className={`w-10 h-10 rounded-full items-center justify-center border-2 ${getBorderClass(state, isActive)}`}
                            >
                                <Icon size={18} color={color} strokeWidth={isActive ? 2.5 : 2} />
                            </View>
                            <Text
                                className={`text-[10px] font-bold mt-1 ${getTextClass(state, isActive)}`}
                            >
                                {step.label}
                            </Text>
                        </Pressable>
                        {!isLast && (
                            <View className={`flex-1 h-[2px] mx-2 min-w-[16px] ${getLineColor(index)}`} />
                        )}
                    </React.Fragment>
                );
            })}
        </ScrollView>
    );
});

// ═══════════════════════════════════════════════════════════
// Main Screen
// ═══════════════════════════════════════════════════════════
export default function ProfileConfirmationScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';
    const insets = useSafeAreaInsets();
    const router = useRouter();

    // ── Store ──────────────────────────────────────────────
    const user = useCurrentProfile();
    const updateUser = useUserStore((s) => s.updateUser);
    const setHeaderVisible = useHeaderStore((s) => s.setVisible);
    const checklist = usePCSStore((s) => s.checklist);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);

    useFocusEffect(
        useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // ── Section states ─────────────────────────────────────
    const [sectionStates, setSectionStates] = useState<SectionState[]>(
        Array(TOTAL_STEPS).fill('unvisited')
    );
    const [activeStep, setActiveStep] = useState(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);
    const sectionCoords = useRef<number[]>([]);
    const highestScrolledSection = useRef(0);

    // ── Section completeness checks ────────────────────────
    const isSectionComplete = useCallback(
        (index: number): boolean => {
            if (!user) return false;
            switch (index) {
                case 0: // Contact
                    return !!(user.email && user.phone && user.emergencyContact?.name && user.emergencyContact?.phone);
                case 1: // Dependents — complete if marital status set, count matches, all have name + dob
                    if (!user.maritalStatus) return false;
                    const deps = user.dependentDetails || [];
                    if ((user.dependents || 0) > 0 && deps.length === 0) return false;
                    return deps.every((d) => d.name && d.dob);
                case 2: // Housing
                    return !!(user.housing?.type);
                case 3: // Vehicles — complete if at least one vehicle with all fields
                    const vehicles = user.vehicles || [];
                    if (vehicles.length === 0) return false;
                    return vehicles.every((v) => v.make && v.model && v.year);
                case 4: // Beneficiaries — at least one with name + percentage
                    const bens = user.beneficiaries || [];
                    if (bens.length === 0) return false;
                    return bens.every((b) => b.name && b.percentage > 0);
                case 5: // PADD — name is required
                    return !!(user.padd?.name);
                default:
                    return false;
            }
        },
        [user]
    );

    // ── Scroll handling ────────────────────────────────────
    const activeStepRef = useRef(0);
    const isProgrammaticScroll = useRef(false);

    const handleScroll = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            // Skip scroll handling during programmatic scrolls (icon taps, auto-advance)
            if (isProgrammaticScroll.current) return;

            const scrollY = event.nativeEvent.contentOffset.y;
            const layoutHeight = event.nativeEvent.layoutMeasurement.height;
            const triggerPoint = scrollY + layoutHeight * 0.3;

            let newActive = 0;
            for (let i = 0; i < TOTAL_STEPS; i++) {
                const sectionTop = sectionCoords.current[i] || 0;
                if (triggerPoint >= sectionTop) {
                    newActive = i;
                }
            }

            if (newActive !== activeStepRef.current) {
                if (newActive > highestScrolledSection.current) {
                    // Forward: mark skipped sections
                    setSectionStates((prev) => {
                        const next = [...prev];
                        for (let i = highestScrolledSection.current; i < newActive; i++) {
                            if (next[i] === 'unvisited') {
                                next[i] = 'skipped';
                            }
                        }
                        return next;
                    });
                    highestScrolledSection.current = newActive;
                } else if (newActive < activeStepRef.current) {
                    // Backward: revert 'skipped' sections at or above current position to 'unvisited'
                    setSectionStates((prev) => {
                        const next = [...prev];
                        let changed = false;
                        for (let i = newActive; i < TOTAL_STEPS; i++) {
                            if (next[i] === 'skipped') {
                                next[i] = 'unvisited';
                                changed = true;
                            }
                        }
                        return changed ? next : prev;
                    });
                    // Lower the high-water mark so forward skip-marking re-fires
                    highestScrolledSection.current = newActive;
                }
                activeStepRef.current = newActive;
                setActiveStep(newActive);
            }
        },
        []
    );

    const scrollToSection = useCallback((index: number) => {
        const goingForward = index > activeStepRef.current;

        setSectionStates((prev) => {
            const next = [...prev];
            let changed = false;

            if (goingForward) {
                // Forward: mark sections before target as skipped if unvisited
                for (let i = 0; i < index; i++) {
                    if (next[i] === 'unvisited') {
                        next[i] = 'skipped';
                        changed = true;
                    }
                }
            } else {
                // Backward: revert skipped sections AFTER the target to unvisited
                for (let i = index + 1; i < TOTAL_STEPS; i++) {
                    if (next[i] === 'skipped') {
                        next[i] = 'unvisited';
                        changed = true;
                    }
                }
            }

            return changed ? next : prev;
        });

        // Update high-water mark
        highestScrolledSection.current = goingForward
            ? Math.max(highestScrolledSection.current, index)
            : index;

        // Immediately update active step (don't wait for scroll events)
        activeStepRef.current = index;
        setActiveStep(index);

        // Suppress handleScroll during the animated scroll
        isProgrammaticScroll.current = true;
        const y = sectionCoords.current[index];
        if (y !== undefined) {
            scrollViewRef.current?.scrollTo({ y, animated: true });
        }
        setTimeout(() => {
            isProgrammaticScroll.current = false;
        }, 500);
    }, []);

    // ── Section confirm handler ────────────────────────────
    const confirmSection = useCallback(
        (index: number) => {
            const complete = isSectionComplete(index);

            setSectionStates((prev) => {
                const next = [...prev];
                next[index] = complete ? 'confirmed_complete' : 'confirmed_partial';
                return next;
            });

            if (complete) {
                // Auto-scroll to next section
                if (index < TOTAL_STEPS - 1) {
                    scrollToSection(index + 1);
                }
            } else {
                Alert.alert(
                    'Section Incomplete',
                    `${PROFILE_STEPS[index].label} has missing or incomplete fields. You can continue, but please return to complete it.`
                );
            }
        },
        [isSectionComplete, scrollToSection]
    );

    const handleSectionLayout = useCallback((index: number, y: number) => {
        sectionCoords.current[index] = y;
    }, []);

    // ── Overall completion check ───────────────────────────
    const allConfirmed = sectionStates.every(
        (s) => s === 'confirmed_complete' || s === 'confirmed_partial'
    );

    const profileItem = useMemo(
        () => checklist.find((c) => c.label === 'Profile Confirmation'),
        [checklist]
    );

    // ── Field update helpers ───────────────────────────────
    const u = (field: string, value: any) => updateUser({ [field]: value } as any);

    const updateNested = (root: string, field: string, value: any) => {
        const current = (user as any)?.[root] || {};
        updateUser({ [root]: { ...current, [field]: value } } as any);
    };

    const addDependent = () => {
        const current = user?.dependentDetails || [];
        const newDep: DependentDetail = { id: uuid(), name: '', relationship: 'child', dob: '' };
        updateUser({ dependentDetails: [...current, newDep], dependents: current.length + 1 });
    };

    const handleMaritalStatusChange = (value: string) => {
        u('maritalStatus', value);
        const current = user?.dependentDetails || [];
        const hasSpouse = current.some((d) => d.relationship === 'spouse');
        if (value === 'married' && !hasSpouse) {
            // Auto-add a blank spouse entry
            const spouseDep: DependentDetail = { id: uuid(), name: '', relationship: 'spouse', dob: '' };
            updateUser({ dependentDetails: [spouseDep, ...current], dependents: current.length + 1 });
        } else if (value !== 'married' && hasSpouse) {
            // Remove any auto-added blank spouse (only remove if name is still empty)
            const cleaned = current.filter((d) => !(d.relationship === 'spouse' && !d.name));
            if (cleaned.length !== current.length) {
                updateUser({ dependentDetails: cleaned, dependents: cleaned.length });
            }
        }
    };

    const removeDependent = (id: string) => {
        const current = user?.dependentDetails || [];
        const updated = current.filter((d) => d.id !== id);
        updateUser({ dependentDetails: updated, dependents: updated.length });
    };

    const updateDependent = (id: string, patch: Partial<DependentDetail>) => {
        const current = user?.dependentDetails || [];
        updateUser({ dependentDetails: current.map((d) => (d.id === id ? { ...d, ...patch } : d)) });
    };

    // ── Vehicle management ────────────────────────────────
    const addVehicle = () => {
        const current = user?.vehicles || [];
        const newVeh: POV = { id: uuid(), make: '', model: '', year: 0 };
        updateUser({ vehicles: [...current, newVeh] });
    };

    const removeVehicle = (id: string) => {
        const current = user?.vehicles || [];
        updateUser({ vehicles: current.filter((v) => v.id !== id) });
    };

    const updateVehicle = (id: string, patch: Partial<POV>) => {
        const current = user?.vehicles || [];
        updateUser({ vehicles: current.map((v) => (v.id === id ? { ...v, ...patch } : v)) });
    };

    // ── Beneficiary management ─────────────────────────────
    const addBeneficiary = () => {
        const current = user?.beneficiaries || [];
        const newBen: Beneficiary = { id: uuid(), name: '', relationship: '', percentage: 0 };
        updateUser({ beneficiaries: [...current, newBen] });
    };

    const removeBeneficiary = (id: string) => {
        const current = user?.beneficiaries || [];
        updateUser({ beneficiaries: current.filter((b) => b.id !== id) });
    };

    const updateBeneficiary = (id: string, patch: Partial<Beneficiary>) => {
        const current = user?.beneficiaries || [];
        updateUser({ beneficiaries: current.map((b) => (b.id === id ? { ...b, ...patch } : b)) });
    };

    // ── Address helpers ────────────────────────────────────
    const updateAddress = (root: string, field: keyof Address, value: string) => {
        const current = (user as any)?.[root] || {};
        updateUser({ [root]: { ...current, [field]: value } } as any);
    };

    // ── PADD management ───────────────────────────────────
    const updatePADD = (field: string, value: any) => {
        const current = user?.padd || {};
        updateUser({ padd: { ...current, [field]: value } } as any);
    };

    const updatePADDAddress = (field: keyof Address, value: string) => {
        const current = user?.padd || {};
        const addr = current.address || {};
        updateUser({ padd: { ...current, address: { ...addr, [field]: value } } } as any);
    };

    // ── Final confirm ──────────────────────────────────────
    const handleFinalConfirm = () => {
        if (!profileItem) return;
        setChecklistItemStatus(profileItem.id, 'COMPLETE');
        setShowSuccess(true);
        setTimeout(() => router.back(), 2000);
    };

    if (!user) return null;

    // ── Section divider color ──────────────────────────────
    const sectionBorderColor = (idx: number) => {
        const s = sectionStates[idx];
        switch (s) {
            case 'confirmed_complete': return '#22C55E';
            case 'confirmed_partial': return '#F59E0B';
            case 'skipped': return '#EF4444';
            default: return isDark ? '#1E293B' : '#E2E8F0';
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F2F2F7' }}>
            {isDark && (
                <LinearGradient
                    colors={['#0f172a', '#020617']}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
            )}
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                <View style={{ flex: 1 }}>
                    {/* ── Header ──────────────────────────────── */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={{ backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)', paddingBottom: 8 }}
                    >
                        <View style={{ paddingHorizontal: 16, paddingTop: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View>
                                <Text
                                    style={{
                                        fontSize: 11, fontWeight: '600', letterSpacing: 1.5,
                                        color: isDark ? '#64748B' : '#94A3B8',
                                    }}
                                >
                                    PHASE 1
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 20, fontWeight: '800', letterSpacing: -0.5,
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                    }}
                                >
                                    Profile Confirmation
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => router.back()}
                                className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
                            >
                                <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                            </Pressable>
                        </View>

                        {/* Status Bar */}
                        <ProfileStatusBar
                            activeStep={activeStep}
                            sectionStates={sectionStates}
                            onStepPress={scrollToSection}
                        />
                    </Animated.View>

                    {/* ── Scrollable Form ────────────────────── */}
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                    >
                        <ScrollView
                            ref={scrollViewRef}
                            onScroll={handleScroll}
                            scrollEventThrottle={16}
                            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 180 }}
                            keyboardShouldPersistTaps="handled"
                            keyboardDismissMode="interactive"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* ═══ 0. Contact Info ═══ */}
                            <View
                                onLayout={(e) => handleSectionLayout(0, e.nativeEvent.layout.y)}
                                style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: sectionBorderColor(0), paddingLeft: 14 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 12,
                                    }}
                                >
                                    Contact Info
                                </Text>
                                <Field
                                    label="Email"
                                    value={user.email || ''}
                                    onChangeText={(v) => u('email', v)}
                                    placeholder="name@us.navy.mil"
                                    keyboardType="email-address"
                                />
                                <Field
                                    label="Phone"
                                    value={user.phone || ''}
                                    onChangeText={(v) => u('phone', v)}
                                    placeholder="757-555-0000"
                                    keyboardType="phone-pad"
                                />
                                <Field
                                    label="Alt Phone"
                                    value={user.altPhone || ''}
                                    onChangeText={(v) => u('altPhone', v)}
                                    placeholder="Optional"
                                    keyboardType="phone-pad"
                                />
                                <Text
                                    style={{
                                        fontSize: 13, fontWeight: '700',
                                        color: isDark ? '#CBD5E1' : '#334155',
                                        marginTop: 8, marginBottom: 8,
                                    }}
                                >
                                    Emergency Contact
                                </Text>
                                <Field
                                    label="Name"
                                    value={user.emergencyContact?.name || ''}
                                    onChangeText={(v) => updateNested('emergencyContact', 'name', v)}
                                    placeholder="Full name"
                                />
                                <Field
                                    label="Phone"
                                    value={user.emergencyContact?.phone || ''}
                                    onChangeText={(v) => updateNested('emergencyContact', 'phone', v)}
                                    placeholder="Phone number"
                                    keyboardType="phone-pad"
                                />
                                <Field
                                    label="Relationship"
                                    value={user.emergencyContact?.relationship || ''}
                                    onChangeText={(v) => updateNested('emergencyContact', 'relationship', v)}
                                    placeholder="e.g. Spouse, Parent"
                                />

                                {/* Home Address */}
                                <Text
                                    style={{
                                        fontSize: 13, fontWeight: '700',
                                        color: isDark ? '#CBD5E1' : '#334155',
                                        marginTop: 8, marginBottom: 8,
                                    }}
                                >
                                    Home Address
                                </Text>
                                <Field
                                    label="Street"
                                    value={user.homeAddress?.street || ''}
                                    onChangeText={(v) => updateAddress('homeAddress', 'street', v)}
                                    placeholder="123 Main St"
                                />
                                <Field
                                    label="City"
                                    value={user.homeAddress?.city || ''}
                                    onChangeText={(v) => updateAddress('homeAddress', 'city', v)}
                                    placeholder="Virginia Beach"
                                />
                                <Field
                                    label="State"
                                    value={user.homeAddress?.state || ''}
                                    onChangeText={(v) => updateAddress('homeAddress', 'state', v)}
                                    placeholder="VA"
                                />
                                <Field
                                    label="ZIP"
                                    value={user.homeAddress?.zip || ''}
                                    onChangeText={(v) => updateAddress('homeAddress', 'zip', v)}
                                    placeholder="23451"
                                    keyboardType="numeric"
                                />

                                {/* Mailing Address */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 8 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155' }}>
                                        Mailing Address
                                    </Text>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>Same as home</Text>
                                        <Switch
                                            value={JSON.stringify(user.mailingAddress) === JSON.stringify(user.homeAddress) && !!user.homeAddress?.street}
                                            onValueChange={(on) => {
                                                if (on) {
                                                    updateUser({ mailingAddress: { ...user.homeAddress } });
                                                } else {
                                                    updateUser({ mailingAddress: { street: '', city: '', state: '', zip: '' } });
                                                }
                                            }}
                                            trackColor={{ false: isDark ? '#3F3F46' : '#CBD5E1', true: '#3B82F6' }}
                                        />
                                    </View>
                                </View>
                                <Field
                                    label="Street"
                                    value={user.mailingAddress?.street || ''}
                                    onChangeText={(v) => updateAddress('mailingAddress', 'street', v)}
                                    placeholder="123 Main St"
                                />
                                <Field
                                    label="City"
                                    value={user.mailingAddress?.city || ''}
                                    onChangeText={(v) => updateAddress('mailingAddress', 'city', v)}
                                    placeholder="Virginia Beach"
                                />
                                <Field
                                    label="State"
                                    value={user.mailingAddress?.state || ''}
                                    onChangeText={(v) => updateAddress('mailingAddress', 'state', v)}
                                    placeholder="VA"
                                />
                                <Field
                                    label="ZIP"
                                    value={user.mailingAddress?.zip || ''}
                                    onChangeText={(v) => updateAddress('mailingAddress', 'zip', v)}
                                    placeholder="23451"
                                    keyboardType="numeric"
                                />

                                {/* Next Duty Station Residence */}
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 4 }}>
                                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155', flex: 1 }}>
                                        Residence at next duty station?
                                    </Text>
                                    <Switch
                                        value={user.hasNextDutyStationResidence ?? false}
                                        onValueChange={(v) => u('hasNextDutyStationResidence', v)}
                                        trackColor={{ false: isDark ? '#3F3F46' : '#CBD5E1', true: '#3B82F6' }}
                                    />
                                </View>
                                <Text style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', marginBottom: 8 }}>
                                    Indicate whether you have secured housing at your gaining command.
                                </Text>

                                {/* Emergency Contact Address */}
                                <Text
                                    style={{
                                        fontSize: 13, fontWeight: '700',
                                        color: isDark ? '#CBD5E1' : '#334155',
                                        marginTop: 8, marginBottom: 8,
                                    }}
                                >
                                    Emergency Contact Address
                                </Text>
                                <Field
                                    label="Street"
                                    value={user.emergencyContact?.address?.street || ''}
                                    onChangeText={(v) => {
                                        const ec = user.emergencyContact || { name: '', phone: '', relationship: '' };
                                        const addr = ec.address || {};
                                        updateUser({ emergencyContact: { ...ec, address: { ...addr, street: v } } });
                                    }}
                                    placeholder="Street address"
                                />
                                <Field
                                    label="City / State / ZIP"
                                    value={[user.emergencyContact?.address?.city, user.emergencyContact?.address?.state, user.emergencyContact?.address?.zip].filter(Boolean).join(', ') || ''}
                                    onChangeText={(v) => {
                                        const ec = user.emergencyContact || { name: '', phone: '', relationship: '' };
                                        const addr = ec.address || {};
                                        // Simple single-field capture for city/state/zip
                                        updateUser({ emergencyContact: { ...ec, address: { ...addr, city: v } } });
                                    }}
                                    placeholder="City, State ZIP"
                                />

                                <SectionConfirmButton state={sectionStates[0]} onConfirm={() => confirmSection(0)} />
                            </View>

                            {/* ═══ 1. Dependents ═══ */}
                            <View
                                onLayout={(e) => handleSectionLayout(1, e.nativeEvent.layout.y)}
                                style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: sectionBorderColor(1), paddingLeft: 14 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 12,
                                    }}
                                >
                                    Dependents ({user.dependentDetails?.length || 0})
                                </Text>

                                <PickerRow
                                    label="Marital Status"
                                    options={MARITAL_STATUSES}
                                    selected={user.maritalStatus}
                                    onSelect={handleMaritalStatusChange}
                                />

                                {(user.dependentDetails || []).map((dep, idx) => (
                                    <View
                                        key={dep.id}
                                        style={{
                                            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                                            borderRadius: 12, padding: 12, marginBottom: 10,
                                            borderWidth: 1, borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155' }}>
                                                Dependent {idx + 1}
                                            </Text>
                                            <Pressable
                                                onPress={() =>
                                                    Alert.alert('Remove Dependent', `Remove ${dep.name || 'this dependent'}?`, [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Remove', style: 'destructive', onPress: () => removeDependent(dep.id) },
                                                    ])
                                                }
                                            >
                                                <Trash2 size={16} color="#EF4444" />
                                            </Pressable>
                                        </View>
                                        <Field label="Name" value={dep.name} onChangeText={(v) => updateDependent(dep.id, { name: v })} placeholder="Full name" />
                                        <PickerRow
                                            label="Relationship"
                                            options={DEPENDENT_RELATIONSHIPS}
                                            selected={dep.relationship}
                                            onSelect={(v) => updateDependent(dep.id, { relationship: v as any })}
                                        />
                                        <Field label="Date of Birth" value={dep.dob} onChangeText={(v) => updateDependent(dep.id, { dob: v })} placeholder="YYYY-MM-DD" />
                                        <Field
                                            label="Address"
                                            value={[dep.address?.street, dep.address?.city, dep.address?.state, dep.address?.zip].filter(Boolean).join(', ') || ''}
                                            onChangeText={(v) => updateDependent(dep.id, { address: { street: v } })}
                                            placeholder="Street, City, State ZIP"
                                        />
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <Pressable
                                                onPress={() => updateDependent(dep.id, { efmpEnrolled: !dep.efmpEnrolled })}
                                                style={{
                                                    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                                                    borderColor: dep.efmpEnrolled ? '#3B82F6' : isDark ? '#3F3F46' : '#CBD5E1',
                                                    backgroundColor: dep.efmpEnrolled ? '#3B82F6' : 'transparent',
                                                    alignItems: 'center', justifyContent: 'center',
                                                }}
                                            >
                                                {dep.efmpEnrolled && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                                            </Pressable>
                                            <Text style={{ fontSize: 13, color: isDark ? '#CBD5E1' : '#475569' }}>EFMP Enrolled</Text>
                                        </View>
                                    </View>
                                ))}

                                <ScalePressable onPress={addDependent}>
                                    <View
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
                                            borderColor: isDark ? '#3F3F46' : '#CBD5E1',
                                        }}
                                    >
                                        <Plus size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#60A5FA' : '#3B82F6' }}>
                                            Add Dependent
                                        </Text>
                                    </View>
                                </ScalePressable>
                                <SectionConfirmButton state={sectionStates[1]} onConfirm={() => confirmSection(1)} />
                            </View>

                            {/* ═══ 2. Housing ═══ */}
                            <View
                                onLayout={(e) => handleSectionLayout(2, e.nativeEvent.layout.y)}
                                style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: sectionBorderColor(2), paddingLeft: 14 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 12,
                                    }}
                                >
                                    Housing
                                </Text>
                                <PickerRow
                                    label="Housing Type"
                                    options={HOUSING_TYPES}
                                    selected={user.housing?.type}
                                    onSelect={(v) => updateNested('housing', 'type', v)}
                                />
                                <Field
                                    label="Address"
                                    value={user.housing?.address || ''}
                                    onChangeText={(v) => updateNested('housing', 'address', v)}
                                    placeholder="Street address"
                                />
                                <Field
                                    label="BAH ZIP"
                                    value={user.housing?.zip || ''}
                                    onChangeText={(v) => updateNested('housing', 'zip', v)}
                                    placeholder="e.g. 23451"
                                    keyboardType="numeric"
                                />
                                <SectionConfirmButton state={sectionStates[2]} onConfirm={() => confirmSection(2)} />
                            </View>

                            {/* ═══ 3. Vehicles (POV) ═══ */}
                            <View
                                onLayout={(e) => handleSectionLayout(3, e.nativeEvent.layout.y)}
                                style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: sectionBorderColor(3), paddingLeft: 14 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 12,
                                    }}
                                >
                                    Vehicles ({user.vehicles?.length || 0})
                                </Text>

                                {(user.vehicles || []).map((veh, idx) => (
                                    <View
                                        key={veh.id}
                                        style={{
                                            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                                            borderRadius: 12, padding: 12, marginBottom: 10,
                                            borderWidth: 1, borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155' }}>
                                                Vehicle {idx + 1}
                                            </Text>
                                            <Pressable
                                                onPress={() =>
                                                    Alert.alert(
                                                        'Remove Vehicle',
                                                        `Remove ${veh.year ? `${veh.year} ${veh.make} ${veh.model}` : 'this vehicle'}?`,
                                                        [
                                                            { text: 'Cancel', style: 'cancel' },
                                                            { text: 'Remove', style: 'destructive', onPress: () => removeVehicle(veh.id) },
                                                        ]
                                                    )
                                                }
                                            >
                                                <Trash2 size={16} color="#EF4444" />
                                            </Pressable>
                                        </View>
                                        <Field
                                            label="Year"
                                            value={veh.year ? String(veh.year) : ''}
                                            onChangeText={(v) => updateVehicle(veh.id, { year: parseInt(v) || 0 })}
                                            placeholder="e.g. 2021"
                                            keyboardType="numeric"
                                        />
                                        <Field label="Make" value={veh.make} onChangeText={(v) => updateVehicle(veh.id, { make: v })} placeholder="e.g. Toyota" />
                                        <Field label="Model" value={veh.model} onChangeText={(v) => updateVehicle(veh.id, { model: v })} placeholder="e.g. Tacoma" />
                                        <Field label="License Plate" value={veh.licensePlate || ''} onChangeText={(v) => updateVehicle(veh.id, { licensePlate: v })} placeholder="Optional" />
                                    </View>
                                ))}

                                <ScalePressable onPress={addVehicle}>
                                    <View
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
                                            borderColor: isDark ? '#3F3F46' : '#CBD5E1',
                                        }}
                                    >
                                        <Plus size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#60A5FA' : '#3B82F6' }}>
                                            Add Vehicle
                                        </Text>
                                    </View>
                                </ScalePressable>
                                <SectionConfirmButton state={sectionStates[3]} onConfirm={() => confirmSection(3)} />
                            </View>

                            {/* ═══ 4. Beneficiaries ═══ */}
                            <View
                                onLayout={(e) => handleSectionLayout(4, e.nativeEvent.layout.y)}
                                style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: sectionBorderColor(4), paddingLeft: 14 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 4,
                                    }}
                                >
                                    Beneficiaries ({user.beneficiaries?.length || 0})
                                </Text>
                                <Text style={{ fontSize: 12, color: isDark ? '#64748B' : '#94A3B8', marginBottom: 12 }}>
                                    Death gratuity / unpaid pay recipients. Percentages must total 100%.
                                </Text>

                                {(user.beneficiaries || []).map((ben, idx) => (
                                    <View
                                        key={ben.id}
                                        style={{
                                            backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                                            borderRadius: 12, padding: 12, marginBottom: 10,
                                            borderWidth: 1, borderColor: isDark ? '#2C2C2E' : '#E2E8F0',
                                        }}
                                    >
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#CBD5E1' : '#334155' }}>
                                                Beneficiary {idx + 1}
                                            </Text>
                                            <Pressable
                                                onPress={() =>
                                                    Alert.alert('Remove Beneficiary', `Remove ${ben.name || 'this beneficiary'}?`, [
                                                        { text: 'Cancel', style: 'cancel' },
                                                        { text: 'Remove', style: 'destructive', onPress: () => removeBeneficiary(ben.id) },
                                                    ])
                                                }
                                            >
                                                <Trash2 size={16} color="#EF4444" />
                                            </Pressable>
                                        </View>
                                        <Field label="Name" value={ben.name} onChangeText={(v) => updateBeneficiary(ben.id, { name: v })} placeholder="Full name" />
                                        <Field label="Relationship" value={ben.relationship} onChangeText={(v) => updateBeneficiary(ben.id, { relationship: v })} placeholder="e.g. Spouse, Child" />
                                        <Field
                                            label="Percentage (%)"
                                            value={ben.percentage ? String(ben.percentage) : ''}
                                            onChangeText={(v) => updateBeneficiary(ben.id, { percentage: parseInt(v) || 0 })}
                                            placeholder="e.g. 50"
                                            keyboardType="numeric"
                                        />
                                        <Field
                                            label="Address"
                                            value={[ben.address?.street, ben.address?.city, ben.address?.state, ben.address?.zip].filter(Boolean).join(', ') || ''}
                                            onChangeText={(v) => updateBeneficiary(ben.id, { address: { street: v } })}
                                            placeholder="Street, City, State ZIP"
                                        />
                                    </View>
                                ))}

                                {/* Percentage total indicator */}
                                {(user.beneficiaries?.length || 0) > 0 && (() => {
                                    const total = (user.beneficiaries || []).reduce((sum, b) => sum + (b.percentage || 0), 0);
                                    const isValid = total === 100;
                                    return (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                            {isValid
                                                ? <CheckCircle2 size={14} color="#22C55E" />
                                                : <AlertTriangle size={14} color="#F59E0B" />
                                            }
                                            <Text style={{ fontSize: 12, fontWeight: '600', color: isValid ? '#22C55E' : '#F59E0B' }}>
                                                Total: {total}% {isValid ? '✓' : '(must equal 100%)'}
                                            </Text>
                                        </View>
                                    );
                                })()}

                                <ScalePressable onPress={addBeneficiary}>
                                    <View
                                        style={{
                                            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
                                            paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed',
                                            borderColor: isDark ? '#3F3F46' : '#CBD5E1',
                                        }}
                                    >
                                        <Plus size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#60A5FA' : '#3B82F6' }}>
                                            Add Beneficiary
                                        </Text>
                                    </View>
                                </ScalePressable>
                                <SectionConfirmButton state={sectionStates[4]} onConfirm={() => confirmSection(4)} />
                            </View>

                            {/* ═══ 5. PADD ═══ */}
                            <View
                                onLayout={(e) => handleSectionLayout(5, e.nativeEvent.layout.y)}
                                style={{ marginBottom: 24, borderLeftWidth: 3, borderLeftColor: sectionBorderColor(5), paddingLeft: 14 }}
                            >
                                <Text
                                    style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: isDark ? '#FFFFFF' : '#0F172A', marginBottom: 4,
                                    }}
                                >
                                    Person Authorized to Direct Disposition
                                </Text>
                                <Text style={{ fontSize: 12, color: isDark ? '#64748B' : '#94A3B8', marginBottom: 12 }}>
                                    Individual responsible for directing disposition of remains.
                                </Text>
                                <Field
                                    label="Name"
                                    value={user.padd?.name || ''}
                                    onChangeText={(v) => updatePADD('name', v)}
                                    placeholder="Full name"
                                />
                                <Field
                                    label="Relationship"
                                    value={user.padd?.relationship || ''}
                                    onChangeText={(v) => updatePADD('relationship', v)}
                                    placeholder="e.g. Spouse, Parent"
                                />
                                <Field
                                    label="Phone"
                                    value={user.padd?.phone || ''}
                                    onChangeText={(v) => updatePADD('phone', v)}
                                    placeholder="Phone number"
                                    keyboardType="phone-pad"
                                />
                                <Text
                                    style={{
                                        fontSize: 13, fontWeight: '700',
                                        color: isDark ? '#CBD5E1' : '#334155',
                                        marginTop: 8, marginBottom: 8,
                                    }}
                                >
                                    PADD Address
                                </Text>
                                <Field
                                    label="Street"
                                    value={user.padd?.address?.street || ''}
                                    onChangeText={(v) => updatePADDAddress('street', v)}
                                    placeholder="Street address"
                                />
                                <Field
                                    label="City"
                                    value={user.padd?.address?.city || ''}
                                    onChangeText={(v) => updatePADDAddress('city', v)}
                                    placeholder="City"
                                />
                                <Field
                                    label="State"
                                    value={user.padd?.address?.state || ''}
                                    onChangeText={(v) => updatePADDAddress('state', v)}
                                    placeholder="VA"
                                />
                                <Field
                                    label="ZIP"
                                    value={user.padd?.address?.zip || ''}
                                    onChangeText={(v) => updatePADDAddress('zip', v)}
                                    placeholder="23451"
                                    keyboardType="numeric"
                                />
                                <SectionConfirmButton state={sectionStates[5]} onConfirm={() => confirmSection(5)} />
                            </View>


                        </ScrollView>
                    </KeyboardAvoidingView>

                    {/* ── Floating Footer ────────────────────── */}
                    <View
                        style={{
                            position: 'absolute', bottom: 0, left: 0, right: 0,
                            backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                            borderTopWidth: 1, borderTopColor: isDark ? '#1E293B' : '#E2E8F0',
                            paddingTop: 16, paddingHorizontal: 16,
                            paddingBottom: Math.max(insets.bottom, 20),
                        }}
                    >
                        {/* Summary HUD */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', fontWeight: '500' }}>Rank</Text>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                                    {user.rank || '—'}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', fontWeight: '500' }}>Deps</Text>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                                    {user.dependentDetails?.length || 0}
                                </Text>
                            </View>
                            <View style={{ alignItems: 'center', flex: 1 }}>
                                <Text style={{ fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', fontWeight: '500' }}>Sections</Text>
                                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFF' : '#0F172A' }}>
                                    {sectionStates.filter((s) => s === 'confirmed_complete' || s === 'confirmed_partial').length}/{TOTAL_STEPS}
                                </Text>
                            </View>
                        </View>

                        {/* Action button */}
                        <Pressable
                            onPress={handleFinalConfirm}
                            disabled={!allConfirmed}
                            style={{
                                height: 56, borderRadius: 14,
                                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                                backgroundColor: allConfirmed ? '#059669' : isDark ? '#1E293B' : '#CBD5E1',
                                opacity: allConfirmed ? 1 : 0.7,
                            }}
                        >
                            <Check size={20} color="#FFFFFF" strokeWidth={2.5} />
                            <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '700' }}>
                                {allConfirmed ? 'Confirm Profile' : `${sectionStates.filter((s) => s === 'confirmed_complete' || s === 'confirmed_partial').length}/${TOTAL_STEPS} Sections`}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>

            {/* ── Success Overlay ────────────────────── */}
            {showSuccess && (
                <Animated.View
                    entering={FadeIn}
                    style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
                        alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)',
                    }}
                >
                    <Animated.View entering={ZoomIn.delay(200).springify()}>
                        <Check size={100} color="#FFFFFF" strokeWidth={2.5} />
                    </Animated.View>
                    <Animated.Text
                        entering={FadeInUp.delay(500)}
                        style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800', marginTop: 24, letterSpacing: -0.5 }}
                    >
                        Profile Confirmed!
                    </Animated.Text>
                    <Animated.Text
                        entering={FadeInUp.delay(600)}
                        style={{ color: '#93C5FD', fontSize: 16, marginTop: 8, textAlign: 'center' }}
                    >
                        Your data is synced to NSIPS.{'\n'}PCS entitlements will recalculate.
                    </Animated.Text>
                </Animated.View>
            )}
        </View>
    );
}
