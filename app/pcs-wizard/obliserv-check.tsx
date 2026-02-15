import { useHeaderStore } from '@/store/useHeaderStore';
import { usePCSStore } from '@/store/usePCSStore';
import { useUserStore } from '@/store/useUserStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronLeft,
} from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Pressable,
    ScrollView,
    Text,
    View,
    useColorScheme,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// ─── Gap in months ───────────────────────────────────────
const monthsBetween = (from: Date, to: Date): number => {
    return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
};

// ═══════════════════════════════════════════════════════════
// OBLISERV Resolution Flow
// ═══════════════════════════════════════════════════════════
export default function ObliservCheckScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const router = useRouter();

    // ── Stores ─────────────────────────────────────────────
    const user = useUserStore((s) => s.user);
    const setHeaderVisible = useHeaderStore((s) => s.setVisible);
    const activeOrder = usePCSStore((s) => s.activeOrder);
    const financials = usePCSStore((s) => s.financials);
    const checkObliserv = usePCSStore((s) => s.checkObliserv);
    const updateFinancials = usePCSStore((s) => s.updateFinancials);

    const [showSuccess, setShowSuccess] = useState(false);

    // ── Hide global header ─────────────────────────────────
    useFocusEffect(
        useCallback(() => {
            setHeaderVisible(false);
            return () => setHeaderVisible(true);
        }, [setHeaderVisible])
    );

    // ── Run OBLISERV check on mount ────────────────────────
    useEffect(() => {
        checkObliserv();
    }, [checkObliserv]);

    // ── Derived values ─────────────────────────────────────
    const obliserv = financials.obliserv;

    const requiredServiceDate = useMemo(() => {
        if (!activeOrder?.reportNLT) return null;
        const d = new Date(activeOrder.reportNLT);
        d.setMonth(d.getMonth() + 36);
        return d;
    }, [activeOrder?.reportNLT]);

    const gapMonths = useMemo(() => {
        if (!user?.eaos || !requiredServiceDate) return 0;
        const eaosDate = new Date(user.eaos);
        return monthsBetween(eaosDate, requiredServiceDate);
    }, [user?.eaos, requiredServiceDate]);

    const formatDate = (iso: string | undefined | null): string => {
        if (!iso) return 'N/A';
        try {
            return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
        } catch {
            return 'N/A';
        }
    };

    // ── Intent handler ─────────────────────────────────────
    const handleIntent = useCallback((intent: 'reenlist' | 'extend') => {
        router.push(`/pcs-wizard/obliserv-request?intent=${intent}` as any);
    }, [router]);

    if (!user) return null;

    // ── Success Overlay ────────────────────────────────────
    if (showSuccess) {
        return (
            <View style={{ flex: 1, backgroundColor: isDark ? '#000' : '#F2F2F7' }}>
                {isDark && (
                    <LinearGradient
                        colors={['#0f172a', '#020617']}
                        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                    />
                )}
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Animated.View entering={FadeIn.duration(400)}>
                        <View style={{
                            width: 80, height: 80, borderRadius: 40,
                            backgroundColor: isDark ? 'rgba(34,197,94,0.15)' : '#F0FDF4',
                            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                        }}>
                            <CheckCircle2 size={40} color="#22C55E" strokeWidth={2} />
                        </View>
                    </Animated.View>
                    <Animated.Text
                        entering={FadeInDown.delay(200).springify()}
                        style={{
                            fontSize: 18, fontWeight: '800', letterSpacing: -0.3,
                            color: isDark ? '#FFFFFF' : '#0F172A', textAlign: 'center',
                        }}
                    >
                        OBLISERV Resolved
                    </Animated.Text>
                    <Animated.Text
                        entering={FadeInDown.delay(350).springify()}
                        style={{
                            fontSize: 14, color: isDark ? '#94A3B8' : '#64748B',
                            textAlign: 'center', marginTop: 6,
                        }}
                    >
                        Returning to your PCS dashboard…
                    </Animated.Text>
                </View>
            </View>
        );
    }

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
                        style={{
                            paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12,
                            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                            backgroundColor: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
                        }}
                    >
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
                                OBLISERV Resolution
                            </Text>
                        </View>
                        <Pressable
                            onPress={() => router.back()}
                            className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
                        >
                            <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                        </Pressable>
                    </Animated.View>

                    {/* ── Content ─────────────────────────────── */}
                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Gap Calculation Card */}
                        <Animated.View
                            entering={FadeInDown.delay(200).springify()}
                            style={{
                                backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : '#FEF2F2',
                                borderRadius: 16, padding: 20, marginBottom: 20,
                                borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.25)' : '#FECACA',
                            }}
                        >
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                                <View style={{
                                    width: 36, height: 36, borderRadius: 10,
                                    backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : '#FEE2E2',
                                    alignItems: 'center', justifyContent: 'center', marginRight: 12,
                                }}>
                                    <AlertTriangle size={18} color="#EF4444" strokeWidth={2.5} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 16, fontWeight: '800', letterSpacing: -0.3,
                                        color: '#EF4444',
                                    }}>
                                        ⚠️ OBLISERV Required
                                    </Text>
                                    <Text style={{
                                        fontSize: 12, color: isDark ? '#FCA5A5' : '#B91C1C', marginTop: 2,
                                    }}>
                                        Additional obligated service needed
                                    </Text>
                                </View>
                            </View>

                            {/* Gap Display */}
                            {gapMonths > 0 && (
                                <View style={{
                                    backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : '#FEE2E2',
                                    borderRadius: 12, padding: 16, marginBottom: 16, alignItems: 'center',
                                }}>
                                    <Text style={{
                                        fontSize: 36, fontWeight: '900', color: '#DC2626',
                                    }}>
                                        {gapMonths}
                                    </Text>
                                    <Text style={{
                                        fontSize: 12, fontWeight: '700', color: isDark ? '#FCA5A5' : '#B91C1C',
                                        textTransform: 'uppercase', letterSpacing: 1, marginTop: 2,
                                    }}>
                                        month{gapMonths !== 1 ? 's' : ''} additional service
                                    </Text>
                                </View>
                            )}

                            {/* Date Breakdown */}
                            <View style={{
                                backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)',
                                borderRadius: 10, padding: 12, marginBottom: 16,
                            }}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>Your EAOS</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#FCA5A5' : '#DC2626' }}>
                                        {formatDate(user.eaos)}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                                    <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>Report NLT</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#E2E8F0' : '#0F172A' }}>
                                        {formatDate(activeOrder?.reportNLT)}
                                    </Text>
                                </View>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                    <Text style={{ fontSize: 12, color: isDark ? '#94A3B8' : '#64748B' }}>Required through</Text>
                                    <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#E2E8F0' : '#0F172A' }}>
                                        {requiredServiceDate ? formatDate(requiredServiceDate.toISOString()) : 'N/A'}
                                    </Text>
                                </View>
                            </View>

                            <Text style={{
                                fontSize: 14, lineHeight: 20,
                                color: isDark ? '#FCA5A5' : '#991B1B',
                            }}>
                                To execute these orders, you must declare your intent to extend or reenlist. Select your intended action below.
                            </Text>
                        </Animated.View>

                        {/* Intent Buttons */}
                        <Animated.View entering={FadeInDown.delay(350).springify()}>
                            <Pressable
                                onPress={() => handleIntent('reenlist')}
                                style={{
                                    backgroundColor: isDark ? '#991B1B' : '#DC2626',
                                    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                                    marginBottom: 10,
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                                    Intend to Reenlist
                                </Text>
                                <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                                    Commit to a new service obligation
                                </Text>
                            </Pressable>

                            <Pressable
                                onPress={() => handleIntent('extend')}
                                style={{
                                    backgroundColor: isDark ? 'rgba(239,68,68,0.1)' : '#FFFFFF',
                                    borderRadius: 14, paddingVertical: 16, alignItems: 'center',
                                    borderWidth: 1.5, borderColor: isDark ? 'rgba(239,68,68,0.3)' : '#FECACA',
                                }}
                            >
                                <Text style={{
                                    fontSize: 16, fontWeight: '800',
                                    color: isDark ? '#FCA5A5' : '#DC2626',
                                }}>
                                    Intend to Extend
                                </Text>
                                <Text style={{
                                    fontSize: 12, marginTop: 2,
                                    color: isDark ? '#FCA5A5' : '#B91C1C',
                                    opacity: 0.7,
                                }}>
                                    Extend current enlistment to cover gap
                                </Text>
                            </Pressable>
                        </Animated.View>
                    </ScrollView>
                </View>
            </SafeAreaView>
        </View>
    );
}
