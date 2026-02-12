import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { LeaveRequest } from '@/types/schema';
import { getShadow } from '@/utils/getShadow';
import { format } from 'date-fns';
import { ChevronRight, Clock, Plus, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LeaveCardProps {
    balance: number;
    requests?: LeaveRequest[];
    onPressRequest?: (request: LeaveRequest) => void;
    onQuickRequest?: () => void;
    onFullRequest?: () => void;
    onExpand?: (expanded: boolean) => void;
}

export function LeaveCard({ balance, requests = [], onPressRequest, onQuickRequest, onFullRequest, onExpand }: LeaveCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [expanded, setExpanded] = useState(false);

    const hasRequests = requests.length > 0;
    const activeRequests = requests.slice(0, 3); // Limit to top 3 for stack preview

    // Format helper
    const formatDateRange = (start: string, end: string) => {
        try {
            const s = new Date(start);
            const e = new Date(end);
            return `${format(s, 'MMM d')} - ${format(e, 'MMM d')}`;
        } catch {
            return 'Invalid Dates';
        }
    };

    return (
        <View style={getShadow({
            shadowColor: isDark ? '#94a3b8' : '#64748b',
            shadowOpacity: isDark ? 0.12 : 0.14,
            shadowRadius: isDark ? 10 : 14,
            elevation: 3,
        })}>
            <GlassView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
            >
                {/* Premium Glass Action Buttons */}
                <View className="absolute top-4 right-4 z-50 flex-row items-center gap-3">
                    {/* Quick Leave (Lightning) */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={onQuickRequest}
                        style={getShadow({ shadowColor: isDark ? '#fbbf24' : '#d97706', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 })}
                    >
                        <GlassView
                            intensity={40}
                            tint={isDark ? 'dark' : 'light'}
                            className="w-11 h-11 rounded-full items-center justify-center border border-white/20 bg-amber-500/10"
                        >
                            <Zap size={20} color={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.5} />
                        </GlassView>
                    </TouchableOpacity>

                    {/* Full Request (Plus) */}
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={onFullRequest}
                        style={getShadow({ shadowColor: isDark ? '#60a5fa' : '#3b82f6', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 })}
                    >
                        <GlassView
                            intensity={40}
                            tint={isDark ? 'dark' : 'light'}
                            className="w-11 h-11 rounded-full items-center justify-center border border-white/20 bg-blue-500/10"
                        >
                            <Plus size={22} color={isDark ? '#60a5fa' : '#3b82f6'} strokeWidth={2.5} />
                        </GlassView>
                    </TouchableOpacity>
                </View>


                <View className="p-5 flex-row items-start justify-between min-h-[100px]">
                    {/* Left Column: Balance */}
                    <View className="flex-col pt-1">
                        <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Leave Balance</Text>
                        <View className="flex-row items-baseline gap-1.5">
                            <Text className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{balance}</Text>
                            <Text className="text-sm text-slate-400 font-medium">Days</Text>
                        </View>
                    </View>

                    {/* Right Column: Smart Stack */}
                    <View className="flex-1 ml-6 relative items-end z-10 pt-[30px] pb-[3px]">
                        {/* Persistent Quick Request (Absolute Top Right of Card, visual only in this column context? No, put absolute in container) */}

                        {!hasRequests ? (
                            // Empty State
                            <View className="h-6" /> // Spacer
                        ) : (
                            // Simplified Vertical List (Debug Mode)
                            <View className="w-full gap-2">
                                {activeRequests.map((req) => {
                                    const getStatusColors = (status: string) => {
                                        switch (status) {
                                            case 'draft': return { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-100', label: 'text-orange-800 dark:text-orange-200', icon: isDark ? "#fdba74" : "#c2410c" };
                                            case 'pending': return { bg: 'bg-sky-50 dark:bg-sky-950', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-900 dark:text-sky-100', label: 'text-sky-800 dark:text-sky-200', icon: isDark ? "#7dd3fc" : "#0369a1" };
                                            case 'approved': return { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-100', label: 'text-emerald-800 dark:text-emerald-200', icon: isDark ? "#6ee7b7" : "#047857" };
                                            case 'returned':
                                            case 'denied': return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-100', label: 'text-red-800 dark:text-red-200', icon: isDark ? "#fca5a5" : "#b91c1c" };
                                            default: return { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-200', label: 'text-slate-500 dark:text-slate-400', icon: isDark ? "#94a3b8" : "#64748b" };
                                        }
                                    };

                                    const colors = getStatusColors(req.status);

                                    return (
                                        <TouchableOpacity
                                            key={req.id}
                                            activeOpacity={0.7}
                                            onPress={() => onPressRequest?.(req)}
                                            className={`
                                                w-full rounded-lg px-3 py-2.5 border-[1.5px] items-start justify-center
                                                ${colors.bg} ${colors.border}
                                            `}
                                        >
                                            <View className="flex-row items-center w-full justify-between">
                                                <View className="flex-col">
                                                    <View className="flex-row items-center gap-1.5 mb-0.5">
                                                        <Text className={`text-[10px] font-bold uppercase ${colors.label}`}>
                                                            {req.status}
                                                        </Text>
                                                        {(req.status === 'draft' || req.status === 'pending') && <Clock size={10} color={colors.icon} />}
                                                    </View>
                                                    <Text className={`text-xs font-bold ${colors.text}`}>
                                                        {formatDateRange(req.startDate, req.endDate)}
                                                    </Text>
                                                </View>
                                                <ChevronRight size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </View>
            </GlassView>
        </View>
    );
}
