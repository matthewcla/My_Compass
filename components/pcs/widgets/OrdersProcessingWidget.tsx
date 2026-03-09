import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { useRouter } from 'expo-router';
import { Briefcase, CheckCircle2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const PROCESSING_STEPS = [
    { title: 'Selection Confirmed' },
    { title: 'Detailer Review' },
    { title: 'Funding Approval' },
    { title: 'Orders Released' },
];

export function OrdersProcessingWidget() {
    const isDark = useColorScheme() === 'dark';
    const router = useRouter();

    const selectionDetails = useDemoStore(state => state.selectionDetails);
    const activeOrder = usePCSStore(state => state.activeOrder);

    if (!selectionDetails) return null;

    const gainingCommandName = activeOrder?.gainingCommand?.name || 'Gaining Command';
    const gainingCommandLocation = activeOrder?.gainingCommand?.homePort || 'Unknown Location';
    const rnltLabel = activeOrder?.reportNLT
        ? new Date(activeOrder.reportNLT).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
        : 'TBD';

    // Derive progress step based on pipelineStatus
    const activeStepIndex = useMemo(() => {
        switch (selectionDetails.pipelineStatus) {
            case 'MATCH_ANNOUNCED': return 0;
            case 'CO_ENDORSEMENT': return 1;
            case 'ORDERS_DRAFTING': return 2;
            default: return 0;
        }
    }, [selectionDetails.pipelineStatus]);

    return (
        <View className="flex flex-col gap-2">
            <GlassView
                intensity={80}
                tint={isDark ? "dark" : "light"}
                className="rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10 mx-4 mb-6"
            >

                {/* Header Area */}
                <View className="px-5 py-5 border-b border-black/5 dark:border-white/5">
                    <View className="flex-row items-center gap-4">
                        <View className="w-10 h-10 rounded-full bg-slate-100/50 dark:bg-slate-800/50 items-center justify-center border-[1.5px] border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                            <Briefcase size={20} color={isDark ? '#94A3B8' : '#64748B'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-[20px] font-[800] tracking-[-0.5px] leading-tight text-slate-900 dark:text-slate-100 mb-0.5" numberOfLines={2}>
                                {selectionDetails.billetTitle}
                            </Text>
                            <Text className="text-[13px] font-[500] leading-tight text-slate-600 dark:text-slate-400 opacity-80" numberOfLines={2}>
                                {gainingCommandName} • {gainingCommandLocation}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Body Area */}
                <View className="px-5 py-6 gap-6">

                    {/* Dynamic Progress Tracker */}
                    <View>
                        <View className="items-center mb-5">
                            <Text className="text-[16px] font-[800] tracking-[-0.5px] text-amber-700 dark:text-amber-400">
                                {PROCESSING_STEPS[activeStepIndex].title}
                            </Text>
                            <Text className="text-[12px] font-[500] text-slate-500 dark:text-slate-400 mt-1">
                                Orders are currently at this phase
                            </Text>
                            <Text className="text-[11px] font-[500] text-slate-400 dark:text-slate-500 text-center mt-2 mx-8">
                                {activeStepIndex === 1 && "Detailer review typically takes 7-14 days. No action required from you at this time."}
                                {activeStepIndex === 2 && "Average funding approval takes 14-21 days. No action required from you at this time."}
                                {activeStepIndex === 0 && "Your selection has been confirmed. Awaiting detailer review."}
                            </Text>
                        </View>

                        <View className="flex-row items-center justify-between px-2">
                            {PROCESSING_STEPS.map((step, index) => {
                                const isCompleted = index < activeStepIndex;
                                const isActive = index === activeStepIndex;
                                const isLast = index === PROCESSING_STEPS.length - 1;

                                return (
                                    <React.Fragment key={index}>
                                        <View className="items-center">
                                            {isActive ? (
                                                <View className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 items-center justify-center border-[1.5px] border-amber-500 shadow-sm">
                                                    <View className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                                                </View>
                                            ) : isCompleted ? (
                                                <View className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/40 items-center justify-center border-[1.5px] border-green-500/50">
                                                    <CheckCircle2 size={12} color={isDark ? '#34D399' : '#059669'} strokeWidth={3} />
                                                </View>
                                            ) : (
                                                <View className="w-5 h-5 rounded-full items-center justify-center border-[1.5px] border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                    <View className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                                                </View>
                                            )}
                                        </View>
                                        {!isLast && (
                                            <View className={`flex-1 h-[2px] mx-1 rounded-full ${isCompleted ? 'bg-green-500/50 dark:bg-green-600/50' : 'bg-slate-200 dark:bg-slate-700/50'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </View>
                    </View>

                    {/* Refined Report Info Pill */}
                    <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-3 border border-black/5 dark:border-white/5 shadow-sm flex-row justify-between items-center mt-2">
                        <View>
                            <Text className="text-[10px] uppercase font-[800] tracking-[0.5px] text-slate-500 dark:text-slate-400 mb-0.5">
                                Estimated Report Date
                            </Text>
                            <Text className="text-slate-900 dark:text-slate-100 text-[15px] font-[800]">
                                {rnltLabel}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/(assignment)' as any)}
                            className="bg-slate-100 dark:bg-slate-700/50 px-4 py-2.5 rounded-[12px] border border-slate-200 dark:border-slate-600 shadow-sm"
                        >
                            <Text className="text-[13px] font-[700] text-slate-700 dark:text-slate-300">Review</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Detailer Fallback */}
                    <View className="items-center mt-2.5">
                        <TouchableOpacity
                            onPress={() => router.push('/(tabs)/(career)' as any)}
                            hitSlop={8}
                        >
                            <Text className="text-[12px] font-[600] text-blue-600 dark:text-blue-400">
                                Taking too long? Contact your Detailer
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </GlassView>
        </View>
    );
}
