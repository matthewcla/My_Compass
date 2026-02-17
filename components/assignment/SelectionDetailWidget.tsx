import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { OrdersPipelineStatus } from '@/types/pcs';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { AlertTriangle, Briefcase, CheckCircle2, Mail, Phone, ShieldCheck, User } from 'lucide-react-native';
import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

// ── Pipeline Step Config ─────────────────────────────────────────────────────

const PIPELINE_STEPS: { key: OrdersPipelineStatus; label: string; short: string }[] = [
    { key: 'MATCH_ANNOUNCED', label: 'Match Announced', short: 'Matched' },
    { key: 'CO_ENDORSEMENT', label: 'CO Endorsement', short: 'CO' },
    { key: 'PERS_PROCESSING', label: 'PERS Processing', short: 'PERS' },
    { key: 'ORDERS_DRAFTING', label: 'Orders Drafting', short: 'Drafting' },
    { key: 'ORDERS_RELEASED', label: 'Orders Released', short: 'Released' },
];

function getStepIndex(status: OrdersPipelineStatus): number {
    return PIPELINE_STEPS.findIndex(s => s.key === status);
}

// ── Component ────────────────────────────────────────────────────────────────

export default function SelectionDetailWidget() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const selectionDetails = useDemoStore(state => state.selectionDetails);
    const activeOrder = usePCSStore(state => state.activeOrder);
    const obliserv = usePCSStore(state => state.financials.obliserv);
    const obliservBlocked = obliserv.required && obliserv.status !== 'COMPLETE';

    if (!selectionDetails) return null;

    const activeIndex = getStepIndex(selectionDetails.pipelineStatus);
    const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';
    const estimatedDate = selectionDetails.estimatedOrdersDate
        ? new Date(selectionDetails.estimatedOrdersDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : null;

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-2xl overflow-hidden shadow-sm"
        >
            <LinearGradient
                colors={isDark
                    ? ['rgba(251,191,36,0.06)', 'rgba(251,191,36,0.01)']
                    : ['rgba(251,191,36,0.10)', 'rgba(251,191,36,0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
            >
                {/* ── OBLISERV Gate ────────────────────────────────────── */}
                {obliservBlocked ? (
                    <View className="bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3 mb-4 border border-red-200 dark:border-red-800/40">
                        <View className="flex-row items-center gap-2 mb-1.5">
                            <AlertTriangle size={14} color={isDark ? '#fca5a5' : '#dc2626'} />
                            <Text className="text-red-800 dark:text-red-200 text-xs font-black uppercase tracking-wider">
                                Action Required
                            </Text>
                        </View>
                        <Text className="text-red-700 dark:text-red-300 text-xs leading-relaxed mb-2.5">
                            Your service obligation doesn't cover this assignment. Extend or reenlist before orders can be processed.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push('/pcs-wizard/obliserv-check' as any)}
                            className="bg-red-600 dark:bg-red-700 py-2.5 px-4 rounded-lg self-start"
                        >
                            <Text className="text-white text-xs font-bold">Extend to Accept</Text>
                        </TouchableOpacity>
                    </View>
                ) : obliserv.required ? (
                    <View className="flex-row items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-2.5 mb-4 border border-green-100 dark:border-green-800/30">
                        <ShieldCheck size={14} color={isDark ? '#4ade80' : '#16a34a'} />
                        <Text className="text-green-800 dark:text-green-300 text-xs font-bold">
                            Service Obligation Met — orders can proceed
                        </Text>
                    </View>
                ) : null}

                {/* ── Pipeline Tracker ──────────────────────────────────── */}
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Orders Pipeline
                </Text>
                <View className="flex-row items-center mb-5">
                    {PIPELINE_STEPS.map((step, i) => {
                        const isComplete = i < activeIndex;
                        const isActive = i === activeIndex;
                        const isFuture = i > activeIndex;

                        return (
                            <React.Fragment key={step.key}>
                                {/* Step dot + label */}
                                <View className="items-center flex-1">
                                    <View
                                        className={`w-7 h-7 rounded-full items-center justify-center ${isComplete
                                            ? 'bg-green-500 dark:bg-green-600'
                                            : isActive
                                                ? 'bg-amber-500 dark:bg-amber-500'
                                                : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                    >
                                        {isComplete ? (
                                            <CheckCircle2 size={14} color="#FFFFFF" />
                                        ) : (
                                            <Text className={`text-[10px] font-black ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'
                                                }`}>
                                                {i + 1}
                                            </Text>
                                        )}
                                    </View>
                                    <Text
                                        className={`text-[9px] font-bold mt-1 text-center ${isActive
                                            ? 'text-amber-700 dark:text-amber-300'
                                            : isComplete
                                                ? 'text-green-700 dark:text-green-400'
                                                : 'text-slate-400 dark:text-slate-500'
                                            }`}
                                        numberOfLines={1}
                                    >
                                        {step.short}
                                    </Text>
                                </View>
                                {/* Connector line */}
                                {i < PIPELINE_STEPS.length - 1 && (
                                    <View
                                        className={`h-[2px] flex-1 -mx-1 mt-[-14px] ${isComplete
                                            ? 'bg-green-400 dark:bg-green-600'
                                            : 'bg-slate-200 dark:bg-slate-700'
                                            }`}
                                    />
                                )}
                            </React.Fragment>
                        );
                    })}
                </View>

                {/* ── Timeline Estimate ─────────────────────────────────── */}
                {estimatedDate && (
                    <View className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 mb-4 border border-amber-100 dark:border-amber-800/30">
                        <Text className="text-amber-800 dark:text-amber-200 text-xs font-semibold leading-relaxed">
                            Orders typically release 4–6 weeks after selection.{' '}
                            <Text className="font-black">Est. {estimatedDate}</Text>
                        </Text>
                    </View>
                )}

                {/* ── Your Billet ───────────────────────────────────────── */}
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Your Billet
                </Text>
                <View className="bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 mb-4 border border-slate-100 dark:border-slate-700/40">
                    <View className="flex-row items-center gap-2.5 mb-1">
                        <Briefcase size={14} color={isDark ? '#fbbf24' : '#d97706'} />
                        <Text className="text-slate-900 dark:text-slate-100 text-sm font-bold flex-1" numberOfLines={1}>
                            {selectionDetails.billetTitle}
                        </Text>
                    </View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-[22px]">
                        {gainingCommand}
                        {selectionDetails.billetNec ? ` · NEC ${selectionDetails.billetNec}` : ''}
                        {` · ${selectionDetails.dutyType} Duty`}
                    </Text>
                </View>

                {/* ── Detailer Contact ──────────────────────────────────── */}
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Your Detailer
                </Text>
                <View className="bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700/40">
                    <View className="flex-row items-center gap-2.5 mb-2">
                        <User size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text className="text-slate-900 dark:text-slate-100 text-sm font-bold flex-1">
                            {selectionDetails.detailer.name}
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">
                            {selectionDetails.detailer.office}
                        </Text>
                    </View>
                    <View className="flex-row gap-2 ml-[22px]">
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${selectionDetails.detailer.phone}`)}
                            className="flex-row items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/40"
                        >
                            <Phone size={12} color={isDark ? '#60a5fa' : '#2563eb'} />
                            <Text className="text-blue-700 dark:text-blue-300 text-[10px] font-bold">Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`mailto:${selectionDetails.detailer.email}`)}
                            className="flex-row items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/40"
                        >
                            <Mail size={12} color={isDark ? '#60a5fa' : '#2563eb'} />
                            <Text className="text-blue-700 dark:text-blue-300 text-[10px] font-bold">Email</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </GlassView>
    );
}
