import { ScalePressable } from '@/components/ScalePressable';
import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import {
    Building2,
    Check,
    CheckCircle2,
    ChevronLeft,
    CreditCard,
    HeartPulse,
    Monitor,
    Shield,
    SmilePlus,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import Animated, {
    FadeIn,
    FadeInDown,
    FadeInUp,
    ZoomIn,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Department Definitions ────────────────────────────────────

interface Department {
    id: string;
    label: string;
    icon: LucideIcon;
    description: string;
    documents: string[];
}

const DEPARTMENTS: Department[] = [
    {
        id: 'admin',
        label: 'Admin / Quarterdeck',
        icon: Building2,
        description: 'Report with your orders. Admin will start your service record update and issue your check-in sheet.',
        documents: ['PCS Orders (original)', 'Military ID (CAC)', 'DD-214 (if prior separation)'],
    },

    {
        id: 'medical',
        label: 'Medical',
        icon: HeartPulse,
        description: 'Transfer your medical records and complete any required physical screenings.',
        documents: ['Medical records', 'Immunization records', 'Dental records'],
    },
    {
        id: 'dental',
        label: 'Dental',
        icon: SmilePlus,
        description: 'Transfer dental records and schedule your initial dental readiness exam.',
        documents: ['Dental records', 'Panoramic X-ray (if available)'],
    },
    {
        id: 'supply',
        label: 'Supply',
        icon: CreditCard,
        description: 'Receive issued gear and update your clothing record.',
        documents: ['Clothing record', 'Seabag inspection results (if applicable)'],
    },
    {
        id: 'disbursing',
        label: 'Disbursing / CPPA',
        icon: CreditCard,
        description: 'Update your pay account, verify BAH rate, and set up direct deposit if needed.',
        documents: ['LES (most recent)', 'Voided check or bank letter', 'W-4 (if changes needed)'],
    },
    {
        id: 'security',
        label: 'Security / NMCI',
        icon: Shield,
        description: 'Get your network account set up and verify security clearance transfer.',
        documents: ['CAC', 'Security clearance verification'],
    },
    {
        id: 'division',
        label: 'Division Officer',
        icon: Monitor,
        description: 'Meet your division officer, get assigned to a watch section, and receive your division brief.',
        documents: ['Check-in sheet (completed departments above)'],
    },
];

// ─────────────────────────────────────────────────────────────────
// Department Card
// ─────────────────────────────────────────────────────────────────

function DepartmentCard({
    dept,
    checked,
    onToggle,
    index,
    isDark,
}: {
    dept: Department;
    checked: boolean;
    onToggle: () => void;
    index: number;
    isDark: boolean;
}) {
    const Icon = dept.icon;

    return (
        <Animated.View entering={FadeInUp.delay(index * 60).springify()}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={onToggle}
                style={{
                    backgroundColor: checked
                        ? isDark ? 'rgba(34,197,94,0.08)' : '#F0FDF4'
                        : isDark ? 'rgba(30,41,59,0.6)' : '#FFFFFF',
                    borderWidth: 1.5,
                    borderColor: checked
                        ? '#22C55E'
                        : isDark ? '#334155' : '#E2E8F0',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                }}
            >
                {/* Header Row */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 12,
                                backgroundColor: checked
                                    ? 'rgba(34,197,94,0.15)'
                                    : isDark ? '#1E293B' : '#F1F5F9',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: 12,
                            }}
                        >
                            <Icon
                                size={20}
                                color={checked ? '#22C55E' : isDark ? '#94A3B8' : '#64748B'}
                                strokeWidth={2}
                            />
                        </View>
                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '700',
                                color: checked
                                    ? '#22C55E'
                                    : isDark ? '#FFFFFF' : '#0F172A',
                                flex: 1,
                            }}
                        >
                            {dept.label}
                        </Text>
                    </View>

                    {/* Check Circle */}
                    <View
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            borderWidth: 2,
                            borderColor: checked ? '#22C55E' : isDark ? '#475569' : '#CBD5E1',
                            backgroundColor: checked ? '#22C55E' : 'transparent',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        {checked && (
                            <Animated.View entering={ZoomIn.springify()}>
                                <Check size={18} color="white" strokeWidth={3} />
                            </Animated.View>
                        )}
                    </View>
                </View>

                {/* Description */}
                {!checked && (
                    <Text
                        style={{
                            fontSize: 13,
                            color: isDark ? '#94A3B8' : '#64748B',
                            marginTop: 8,
                            lineHeight: 18,
                        }}
                    >
                        {dept.description}
                    </Text>
                )}

                {/* Documents Needed */}
                {!checked && dept.documents.length > 0 && (
                    <View style={{ marginTop: 10 }}>
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: '600',
                                letterSpacing: 1,
                                color: isDark ? '#64748B' : '#94A3B8',
                                marginBottom: 4,
                                textTransform: 'uppercase',
                            }}
                        >
                            Bring
                        </Text>
                        {dept.documents.map((doc, i) => (
                            <Text
                                key={i}
                                style={{
                                    fontSize: 12,
                                    color: isDark ? '#94A3B8' : '#64748B',
                                    marginLeft: 8,
                                    lineHeight: 18,
                                }}
                            >
                                • {doc}
                            </Text>
                        ))}
                    </View>
                )}

                {/* Completed badge */}
                {checked && (
                    <Animated.View entering={FadeIn.delay(200)}>
                        <Text
                            style={{
                                fontSize: 12,
                                fontWeight: '600',
                                color: '#22C55E',
                                marginTop: 6,
                            }}
                        >
                            ✓ Department sign-off complete
                        </Text>
                    </Animated.View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ─────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────

export default function CheckInScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const router = useRouter();
    const setHeaderVisible = useHeaderStore((s) => s.setVisible);

    const checklist = usePCSStore((s) => s.checklist);
    const setChecklistItemStatus = usePCSStore((s) => s.setChecklistItemStatus);

    useFocusEffect(
        useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // ── Local toggle state ────────────────────────────────────
    const [completed, setCompleted] = useState<Record<string, boolean>>({});
    const [showSuccess, setShowSuccess] = useState(false);

    const completedCount = useMemo(
        () => Object.values(completed).filter(Boolean).length,
        [completed]
    );
    const allDone = completedCount === DEPARTMENTS.length;

    const checkInItem = useMemo(
        () => checklist.find((c) => c.label === 'Complete Check-In'),
        [checklist]
    );

    const handleToggle = useCallback((id: string) => {
        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const handleComplete = useCallback(() => {
        if (!checkInItem || !allDone) return;
        if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        setChecklistItemStatus(checkInItem.id, 'COMPLETE');
        setShowSuccess(true);
        setTimeout(() => router.back(), 2000);
    }, [checkInItem, allDone, setChecklistItemStatus, router]);

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
                    {/* ── Header ────────────────────────────────── */}
                    <Animated.View
                        entering={FadeInDown.delay(100).springify()}
                        style={{
                            backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                            paddingBottom: 12,
                        }}
                    >
                        <View
                            style={{
                                paddingHorizontal: 16,
                                paddingTop: 8,
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                            }}
                        >
                            <TouchableOpacity
                                onPress={() => router.back()}
                                style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    backgroundColor: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(241,245,249,0.8)',
                                }}
                            >
                                <ChevronLeft size={22} color={isDark ? '#e2e8f0' : '#1e293b'} />
                            </TouchableOpacity>
                            <View>
                                <Text
                                    style={{
                                        fontSize: 11,
                                        fontWeight: '600',
                                        letterSpacing: 1.5,
                                        color: isDark ? '#64748B' : '#94A3B8',
                                    }}
                                >
                                    PHASE 4
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: '800',
                                        letterSpacing: -0.5,
                                        color: isDark ? '#FFFFFF' : '#0F172A',
                                    }}
                                >
                                    Command Check-In
                                </Text>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 16,
                                marginTop: 8,
                            }}
                        >
                            <View
                                style={{
                                    flex: 1,
                                    height: 6,
                                    borderRadius: 3,
                                    backgroundColor: isDark ? '#1E293B' : '#E2E8F0',
                                    overflow: 'hidden',
                                }}
                            >
                                <Animated.View
                                    style={{
                                        width: `${(completedCount / DEPARTMENTS.length) * 100}%`,
                                        height: '100%',
                                        backgroundColor: allDone ? '#22C55E' : '#3B82F6',
                                        borderRadius: 3,
                                    }}
                                />
                            </View>
                            <View
                                style={{
                                    marginLeft: 10,
                                    backgroundColor: allDone
                                        ? isDark ? 'rgba(34,197,94,0.15)' : '#F0FDF4'
                                        : isDark ? '#1E293B' : '#F1F5F9',
                                    paddingHorizontal: 10,
                                    paddingVertical: 4,
                                    borderRadius: 12,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 12,
                                        fontWeight: '700',
                                        color: allDone ? '#22C55E' : isDark ? '#94A3B8' : '#64748B',
                                    }}
                                >
                                    {completedCount}/{DEPARTMENTS.length}
                                </Text>
                            </View>
                        </View>
                    </Animated.View>

                    {/* ── Department List ───────────────────────── */}
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 }}
                        showsVerticalScrollIndicator={false}
                    >


                        {/* Intro text */}
                        <Animated.View entering={FadeIn.delay(200)}>
                            <Text
                                style={{
                                    fontSize: 14,
                                    color: isDark ? '#94A3B8' : '#64748B',
                                    lineHeight: 20,
                                    marginBottom: 16,
                                }}
                            >
                                Visit each department with your orders and check-in sheet.
                                Mark each department as complete once you have their sign-off.
                            </Text>
                        </Animated.View>

                        {DEPARTMENTS.map((dept, index) => (
                            <DepartmentCard
                                key={dept.id}
                                dept={dept}
                                checked={!!completed[dept.id]}
                                onToggle={() => handleToggle(dept.id)}
                                index={index}
                                isDark={isDark}
                            />
                        ))}
                    </ScrollView>

                    {/* ── Floating Footer ───────────────────────── */}
                    <View
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            paddingHorizontal: 16,
                            paddingBottom: 34,
                            paddingTop: 12,
                        }}
                    >
                        <View
                            style={{
                                backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                                borderRadius: 16,
                                padding: 4,
                                borderWidth: 1,
                                borderColor: isDark ? '#334155' : '#E2E8F0',
                            }}
                        >
                            <ScalePressable
                                onPress={handleComplete}
                                disabled={!allDone}
                                style={{
                                    opacity: allDone ? 1 : 0.4,
                                }}
                            >
                                <LinearGradient
                                    colors={allDone
                                        ? ['#22C55E', '#16A34A']
                                        : isDark ? ['#334155', '#1E293B'] : ['#E2E8F0', '#CBD5E1']
                                    }
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={{
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        paddingVertical: 14,
                                        borderRadius: 12,
                                        gap: 8,
                                    }}
                                >
                                    <CheckCircle2 size={20} color="white" strokeWidth={2.5} />
                                    <Text style={{ fontSize: 16, fontWeight: '800', color: 'white' }}>
                                        Complete Check-In
                                    </Text>
                                </LinearGradient>
                            </ScalePressable>
                        </View>
                    </View>

                    {/* ── Success Overlay ───────────────────────── */}
                    {showSuccess && (
                        <View
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                            }}
                        >
                            <BlurView
                                intensity={40}
                                tint="dark"
                                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                            />
                            <View
                                style={{
                                    flex: 1,
                                    backgroundColor: 'rgba(0,0,0,0.4)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Animated.View entering={ZoomIn.springify()}>
                                    <View
                                        style={{
                                            width: 120,
                                            height: 120,
                                            borderRadius: 60,
                                            backgroundColor: '#22C55E',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: 16,
                                        }}
                                    >
                                        <Check size={60} color="white" strokeWidth={3} />
                                    </View>
                                </Animated.View>
                                <Animated.View entering={FadeIn.delay(300)}>
                                    <Text
                                        style={{
                                            fontSize: 22,
                                            fontWeight: '800',
                                            color: 'white',
                                            textAlign: 'center',
                                        }}
                                    >
                                        Check-In Complete
                                    </Text>
                                    <Text
                                        style={{
                                            fontSize: 14,
                                            color: '#94A3B8',
                                            textAlign: 'center',
                                            marginTop: 4,
                                        }}
                                    >
                                        Welcome aboard, Shipmate
                                    </Text>
                                </Animated.View>
                            </View>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
}
