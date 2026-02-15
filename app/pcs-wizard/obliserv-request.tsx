import { usePCSStore } from '@/store/usePCSStore';
import { useUserStore } from '@/store/useUserStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
    AlertCircle,
    Calendar,
    Check,
    ChevronLeft,
    Clock,
    FileText,
    MapPin,
    Minus,
    Plus,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
    useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Helpers ─────────────────────────────────────────────
function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
    return (
        <View className="flex-row items-center gap-2 mb-3 ml-1">
            {icon}
            <Text className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
            </Text>
        </View>
    );
}

function ReadOnlyField({ label, value, isDark }: { label: string; value: string; isDark: boolean }) {
    return (
        <View style={{
            flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
        }}>
            <Text style={{ fontSize: 13, color: isDark ? '#94A3B8' : '#64748B' }}>{label}</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#E2E8F0' : '#0F172A' }}>{value}</Text>
        </View>
    );
}

const formatDate = (iso: string | undefined | null): string => {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
        return '—';
    }
};

// ═══════════════════════════════════════════════════════════
// OBLISERV Request Screen
// ═══════════════════════════════════════════════════════════
export default function ObliservRequestScreen() {
    const { intent: rawIntent } = useLocalSearchParams<{ intent: string }>();
    const intent = (rawIntent === 'reenlist' ? 'reenlist' : 'extend') as 'reenlist' | 'extend';

    const router = useRouter();
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const user = useUserStore((s) => s.user);
    const activeOrder = usePCSStore((s) => s.activeOrder);
    const updateFinancials = usePCSStore((s) => s.updateFinancials);

    const isReenlist = intent === 'reenlist';

    // ── Form State ─────────────────────────────────────────
    // Extension fields
    const [extensionMonths, setExtensionMonths] = useState(12);
    const [reasonForExtension, setReasonForExtension] = useState('');

    // Reenlistment fields
    const [reenlistmentTermYears, setReenlistmentTermYears] = useState(4);
    const [placeOfReenlistment, setPlaceOfReenlistment] = useState('');
    const [leaveDaysSellBack, setLeaveDaysSellBack] = useState(0);

    // Shared
    const [promises, setPromises] = useState('');

    // ── Derived ────────────────────────────────────────────
    const newExpirationDate = useMemo(() => {
        const base = user?.eaos ? new Date(user.eaos) : new Date();
        if (isReenlist) {
            base.setFullYear(base.getFullYear() + reenlistmentTermYears);
        } else {
            base.setMonth(base.getMonth() + extensionMonths);
        }
        return base.toISOString();
    }, [user?.eaos, isReenlist, reenlistmentTermYears, extensionMonths]);

    const canSubmit = useMemo(() => {
        if (isReenlist) return true; // Term always has a default
        return extensionMonths > 0 && reasonForExtension.trim().length > 0;
    }, [isReenlist, extensionMonths, reasonForExtension]);

    // ── Submit ─────────────────────────────────────────────
    const handleSubmit = useCallback(() => {
        updateFinancials((prev) => ({
            obliserv: {
                ...prev.obliserv,
                status: 'COMPLETE' as const,
                intent,
                newExpirationDate,
                promises: promises.trim() || undefined,
                submittedAt: new Date().toISOString(),
                ...(isReenlist
                    ? {
                        reenlistmentTermYears,
                        reenlistmentStartDate: user?.eaos || new Date().toISOString(),
                        placeOfReenlistment: placeOfReenlistment.trim() || undefined,
                        leaveDaysSellBack: leaveDaysSellBack > 0 ? leaveDaysSellBack : undefined,
                    }
                    : {
                        extensionMonths,
                        reasonForExtension: reasonForExtension.trim(),
                    }),
            },
        }));
        // Pop back past the obliserv-check decision screen too
        router.dismissAll();
        router.replace('/(tabs)/(pcs)' as any);
    }, [
        updateFinancials, intent, newExpirationDate, promises, isReenlist,
        reenlistmentTermYears, placeOfReenlistment, leaveDaysSellBack,
        extensionMonths, reasonForExtension, user?.eaos, router,
    ]);

    if (!user) return null;

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* ── Header ──────────────────────────────── */}
            <View
                style={{ paddingTop: insets.top }}
                className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 pb-4 px-4 shadow-sm z-10"
            >
                <View className="flex-row items-start justify-between mb-4 mt-2">
                    <View className="flex-1">
                        <Text
                            style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }}
                            className="text-slate-400 dark:text-gray-500"
                        >
                            PHASE 1
                        </Text>
                        <Text
                            style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
                            className="text-slate-900 dark:text-white"
                        >
                            {isReenlist ? 'Reenlistment Request' : 'Extension Request'}
                        </Text>
                    </View>
                    <Pressable
                        onPress={() => router.back()}
                        className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
                    >
                        <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
                    </Pressable>
                </View>

                <View className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg flex-row items-start gap-3">
                    <View className="bg-blue-100 dark:bg-blue-900 rounded-full p-0.5">
                        <AlertCircle size={20} color={isDark ? '#60a5fa' : '#2563eb'} style={{ marginTop: 2 }} />
                    </View>
                    <Text className="flex-1 text-sm text-blue-800 dark:text-blue-200 font-medium leading-5">
                        {isReenlist
                            ? 'This request records your intent to reenlist and generates a to-do for your command admin office.'
                            : 'This request records your intent to extend and generates a to-do for your command admin office.'}
                    </Text>
                </View>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <ScrollView className="flex-1 px-4 py-6" contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* ═══ Auto-populated Profile Data ═══ */}
                    <View className="mb-8">
                        <SectionLabel
                            icon={<FileText size={18} color={isDark ? '#94a3b8' : '#64748b'} />}
                            label="Service Record"
                        />
                        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <ReadOnlyField label="Name" value={user.displayName || '—'} isDark={isDark} />
                            <ReadOnlyField label="Rank / Rate" value={`${user.rank || '—'} ${user.rating || ''}`} isDark={isDark} />
                            <ReadOnlyField label="UIC" value={user.uic || '—'} isDark={isDark} />
                            <ReadOnlyField label="Duty Station" value={user.dutyStation?.name || '—'} isDark={isDark} />
                            <ReadOnlyField label="EAOS" value={formatDate(user.eaos)} isDark={isDark} />
                            <ReadOnlyField label="Report NLT" value={formatDate(activeOrder?.reportNLT)} isDark={isDark} />
                        </View>
                    </View>

                    {/* ═══ Intent-Specific Section ═══ */}
                    {isReenlist ? (
                        // ── REENLISTMENT FIELDS ──────────────
                        <View className="mb-8">
                            <SectionLabel
                                icon={<Calendar size={18} color={isDark ? '#94a3b8' : '#64748b'} />}
                                label="Reenlistment Term"
                            />
                            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-6">
                                    {reenlistmentTermYears} Year{reenlistmentTermYears > 1 ? 's' : ''}
                                </Text>
                                <View className="flex-row gap-3">
                                    {[4, 5, 6].map((y) => (
                                        <Pressable
                                            key={y}
                                            onPress={() => setReenlistmentTermYears(y)}
                                            className={`flex-1 py-3 rounded-xl border-2 items-center justify-center ${reenlistmentTermYears === y
                                                ? 'bg-blue-600 border-blue-600'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                                }`}
                                        >
                                            <Text className={`font-bold ${reenlistmentTermYears === y ? 'text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                                {y} Year{y > 1 ? 's' : ''}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {/* Place of Reenlistment */}
                            <View className="mt-6">
                                <SectionLabel
                                    icon={<MapPin size={18} color={isDark ? '#94a3b8' : '#64748b'} />}
                                    label="Place of Reenlistment"
                                />
                                <TextInput
                                    value={placeOfReenlistment}
                                    onChangeText={setPlaceOfReenlistment}
                                    placeholder="e.g. USS Gerald R. Ford (CVN 78)"
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white text-base"
                                />
                            </View>

                            {/* Leave Sell-Back */}
                            <View className="mt-6">
                                <SectionLabel
                                    icon={<Clock size={18} color={isDark ? '#94a3b8' : '#64748b'} />}
                                    label="Leave Days to Sell Back"
                                />
                                <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <View className="flex-row items-center gap-4">
                                        <Pressable
                                            onPress={() => setLeaveDaysSellBack(Math.max(0, leaveDaysSellBack - 1))}
                                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                                        >
                                            <Minus size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                                        </Pressable>
                                        <View className="flex-1 items-center">
                                            <Text className="text-2xl font-black text-slate-900 dark:text-white">
                                                {leaveDaysSellBack}
                                            </Text>
                                            <Text className="text-xs text-slate-500 dark:text-slate-400">days</Text>
                                        </View>
                                        <Pressable
                                            onPress={() => setLeaveDaysSellBack(Math.min(60, leaveDaysSellBack + 1))}
                                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                                        >
                                            <Plus size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                    ) : (
                        // ── EXTENSION FIELDS ─────────────────
                        <View className="mb-8">
                            <SectionLabel
                                icon={<Calendar size={18} color={isDark ? '#94a3b8' : '#64748b'} />}
                                label="Extension Duration"
                            />
                            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <Text className="text-3xl font-black text-slate-900 dark:text-white text-center mb-6">
                                    {extensionMonths} Month{extensionMonths > 1 ? 's' : ''}
                                </Text>

                                <View className="flex-row items-center gap-4 mb-2">
                                    <Pressable
                                        onPress={() => setExtensionMonths(Math.max(1, extensionMonths - 1))}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                                    >
                                        <Minus size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                                    </Pressable>

                                    <View className="flex-1">
                                        <View className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                            <View
                                                className="h-full bg-blue-600 rounded-full"
                                                style={{ width: `${(extensionMonths / 48) * 100}%` }}
                                            />
                                        </View>
                                        <Text className="text-center mt-2 font-bold text-slate-900 dark:text-white">
                                            {extensionMonths} Months
                                        </Text>
                                    </View>

                                    <Pressable
                                        onPress={() => setExtensionMonths(Math.min(48, extensionMonths + 1))}
                                        className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center active:bg-slate-200 dark:active:bg-slate-700"
                                    >
                                        <Plus size={20} color={isDark ? '#e2e8f0' : '#334155'} />
                                    </Pressable>
                                </View>
                            </View>

                            {/* Reason for Extension */}
                            <View className="mt-6">
                                <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                                    Reason for Extension <Text className="text-red-500">*</Text>
                                </Text>
                                <TextInput
                                    value={reasonForExtension}
                                    onChangeText={setReasonForExtension}
                                    placeholder="e.g. To complete PCS to new duty station..."
                                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white h-24 text-base"
                                    multiline
                                    textAlignVertical="top"
                                />
                            </View>
                        </View>
                    )}

                    {/* ═══ New Expiration Preview ═══ */}
                    <View className="mb-8">
                        <View className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
                            <Text className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">
                                New Contract Expiration
                            </Text>
                            <Text className="text-2xl font-black text-blue-900 dark:text-blue-100">
                                {formatDate(newExpirationDate)}
                            </Text>
                            <Text className="text-xs text-blue-600 dark:text-blue-300 mt-1">
                                Based on current EAOS of {formatDate(user.eaos)} +{' '}
                                {isReenlist ? `${reenlistmentTermYears} year${reenlistmentTermYears > 1 ? 's' : ''}` : `${extensionMonths} month${extensionMonths > 1 ? 's' : ''}`}
                            </Text>
                        </View>
                    </View>

                    {/* ═══ Promises / Exceptions (Optional) ═══ */}
                    <View className="mb-8">
                        <Text className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1">
                            Promises / Exceptions (Optional)
                        </Text>
                        <TextInput
                            value={promises}
                            onChangeText={setPromises}
                            placeholder="No promises have been made except as indicated..."
                            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-900 dark:text-white h-20 text-base"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Footer ──────────────────────────────── */}
            <View
                style={{ paddingBottom: Math.max(insets.bottom, 20) }}
                className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4"
            >
                <Pressable
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full py-4 rounded-xl flex-row items-center justify-center gap-2 ${canSubmit ? 'bg-blue-600 active:bg-blue-700' : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                >
                    <Text className={`font-bold text-lg ${canSubmit ? 'text-white' : 'text-slate-400 dark:text-slate-600'}`}>
                        Submit Request
                    </Text>
                    {canSubmit && <Check size={20} color="white" strokeWidth={3} />}
                </Pressable>
            </View>
        </View>
    );
}
