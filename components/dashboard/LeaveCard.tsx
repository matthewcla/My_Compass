import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { LeaveBalance, LeaveRequest } from '@/types/schema';
import { formatDays } from '@/utils/formatDays';
import { getShadow } from '@/utils/getShadow';
import { projectLeaveBalance } from '@/utils/leaveProjection';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ChevronRight, Clock, Plus, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LeaveCardProps {
    balance: number;
    leaveBalance?: LeaveBalance | null;
    requests?: LeaveRequest[];
    allRequests?: LeaveRequest[];
    onPressRequest?: (request: LeaveRequest) => void;
    onQuickRequest?: () => void;
    onFullRequest?: () => void;
    onExpand?: (expanded: boolean) => void;
}

export function LeaveCard({
    balance,
    leaveBalance,
    requests = [],
    allRequests,
    onPressRequest,
    onQuickRequest,
    onFullRequest,
    onExpand,
}: LeaveCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const [expanded, setExpanded] = useState(false);

    const hasRequests = requests.length > 0;
    const activeRequests = requests.slice(0, 3); // Limit to top 3 for stack preview

    // Pre-compute projections for all active requests
    const projections = useMemo(() => {
        const currentBalance = leaveBalance?.currentBalance ?? balance;
        const maxCarryOver = leaveBalance?.maxCarryOver ?? 60;
        const allReqs = allRequests ?? requests;

        return activeRequests.map((req) => {
            try {
                const departureDate = parseISO(req.startDate);
                const returnDate = parseISO(req.endDate);
                const chargeableDays = req.chargeDays > 0
                    ? req.chargeDays
                    : Math.max(0, differenceInDays(returnDate, departureDate) + 1);

                return projectLeaveBalance({
                    currentBalance,
                    maxCarryOver,
                    departureDate,
                    returnDate,
                    chargeableDays,
                    leaveType: req.leaveType,
                    allRequests: allReqs,
                    currentRequestId: req.id,
                });
            } catch {
                return null;
            }
        });
    }, [activeRequests, leaveBalance, balance, allRequests, requests]);

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
                <View className="p-5">
                    {/* Header Row: Balance + Action Buttons */}
                    <View className="flex-row items-center justify-between mb-4">
                        {/* Left: Balance */}
                        <View className="flex-col">
                            <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Leave Balance</Text>
                            <View className="flex-row items-baseline gap-1.5">
                                <Text className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{balance}</Text>
                                <Text className="text-sm text-slate-400 font-medium">Days</Text>
                            </View>
                        </View>

                        {/* Right: Action Buttons */}
                        <View className="flex-row items-center gap-3">
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
                    </View>

                    {/* Request Smart Stack */}
                    <View className="w-full">

                        {!hasRequests ? (
                            // Empty State
                            <View className="h-6" /> // Spacer
                        ) : (
                            // Request Tabs with Projection Data
                            <View className="w-full gap-2">
                                {activeRequests.map((req, index) => {
                                    const getStatusColors = (status: string) => {
                                        switch (status) {
                                            case 'draft': return { bg: 'bg-orange-50 dark:bg-orange-950', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-100', label: 'text-orange-800 dark:text-orange-200', icon: isDark ? "#fdba74" : "#c2410c", projText: isDark ? '#fdba74' : '#9a3412' };
                                            case 'pending': return { bg: 'bg-sky-50 dark:bg-sky-950', border: 'border-sky-200 dark:border-sky-800', text: 'text-sky-900 dark:text-sky-100', label: 'text-sky-800 dark:text-sky-200', icon: isDark ? "#7dd3fc" : "#0369a1", projText: isDark ? '#7dd3fc' : '#0c4a6e' };
                                            case 'approved': return { bg: 'bg-emerald-50 dark:bg-emerald-950', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-100', label: 'text-emerald-800 dark:text-emerald-200', icon: isDark ? "#6ee7b7" : "#047857", projText: isDark ? '#6ee7b7' : '#064e3b' };
                                            case 'returned':
                                            case 'denied': return { bg: 'bg-red-50 dark:bg-red-950', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-100', label: 'text-red-800 dark:text-red-200', icon: isDark ? "#fca5a5" : "#b91c1c", projText: isDark ? '#fca5a5' : '#7f1d1d' };
                                            default: return { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700', text: 'text-slate-700 dark:text-slate-200', label: 'text-slate-500 dark:text-slate-400', icon: isDark ? "#94a3b8" : "#64748b", projText: isDark ? '#94a3b8' : '#334155' };
                                        }
                                    };

                                    const colors = getStatusColors(req.status);
                                    const proj = projections[index];
                                    const showProjection = proj && ['draft', 'pending', 'approved'].includes(req.status);

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
                                            {/* Top Row: Status + Date Range */}
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

                                            {/* Bottom Row: Projection Data */}
                                            {showProjection && (
                                                <View className="flex-row items-center gap-3 mt-1.5 pt-1.5 border-t border-dashed"
                                                    style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }}
                                                >
                                                    {proj.isUnchargeable ? (
                                                        <Text className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                                                            No Charge
                                                        </Text>
                                                    ) : (
                                                        <>
                                                            <View className="flex-row items-center gap-1">
                                                                <Text className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">Avail</Text>
                                                                <Text className="text-[11px] font-bold font-mono" style={{ color: colors.projText }}>
                                                                    {formatDays(proj.availableOnDeparture)}
                                                                </Text>
                                                            </View>
                                                            <View className="flex-row items-center gap-1">
                                                                <Text className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">Chg</Text>
                                                                <Text className="text-[11px] font-bold font-mono" style={{ color: colors.projText }}>
                                                                    {formatDays(req.chargeDays || proj.availableOnDeparture - proj.remainingOnReturn)}
                                                                </Text>
                                                            </View>
                                                            <View className="flex-row items-center gap-1">
                                                                <Text className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500">Rem</Text>
                                                                <Text className={`text-[11px] font-bold font-mono ${proj.isOverdraft ? 'text-red-500' : ''}`}
                                                                    style={!proj.isOverdraft ? { color: colors.projText } : undefined}
                                                                >
                                                                    {formatDays(proj.remainingOnReturn)}
                                                                </Text>
                                                            </View>
                                                        </>
                                                    )}
                                                </View>
                                            )}
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
