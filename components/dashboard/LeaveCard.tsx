import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { LeaveBalance, LeaveRequest } from '@/types/schema';
import { formatDays } from '@/utils/formatDays';
import { projectLeaveBalance } from '@/utils/leaveProjection';
import { differenceInDays, format, parseISO } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight, Clock, Plus, Umbrella, Zap } from 'lucide-react-native';
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
        <View className="mx-4 mb-6">
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10"
            >
                <LinearGradient
                    colors={isDark ? ['rgba(244,63,94,0.15)', 'transparent'] : ['rgba(244,63,94,0.08)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />
                <View className="p-5">
                    {/* Header Row: Balance + Action Buttons */}
                    <View className="flex-row items-center justify-between mb-5">
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-[52px] h-[52px] rounded-full bg-rose-500/10 dark:bg-rose-900/40 items-center justify-center border-[1.5px] border-rose-500/20 dark:border-rose-800/60 shadow-sm">
                                <Umbrella size={26} color={isDark ? '#FDA4AF' : '#E11D48'} />
                            </View>
                            <View className="flex-1 mr-2">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                                    Leave Balance
                                </Text>
                                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>
                                    {balance} Available Days
                                </Text>
                            </View>
                        </View>

                        {/* Right: Action Buttons */}
                        <View className="flex-row items-center gap-2">
                            {/* Quick Leave */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={onQuickRequest}
                                className="w-10 h-10 rounded-full bg-amber-500/10 items-center justify-center border border-amber-500/20 shadow-sm"
                            >
                                <Zap size={18} color={isDark ? '#FBBF24' : '#D97706'} strokeWidth={2.5} />
                            </TouchableOpacity>

                            {/* Full Request */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={onFullRequest}
                                className="w-10 h-10 rounded-full bg-slate-900/5 dark:bg-white/10 items-center justify-center border border-slate-900/10 dark:border-white/20 shadow-sm"
                            >
                                <Plus size={18} color={isDark ? '#FFFFFF' : '#0F172A'} strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Request Smart Stack */}
                    <View className="w-full border-t border-slate-200/50 dark:border-slate-700/50 pt-5">

                        {!hasRequests ? (
                            // Empty State
                            <View className="h-6" /> // Spacer
                        ) : (
                            // Request Tabs with Projection Data
                            <View className="w-full gap-2">
                                {activeRequests.map((req, index) => {
                                    const getStatusColors = (status: string) => {
                                        switch (status) {
                                            // Draft -> Slate/Neutral (was Orange)
                                            case 'draft':
                                                return {
                                                    bg: 'bg-slate-100 dark:bg-slate-800',
                                                    border: 'border-slate-200 dark:border-slate-700',
                                                    text: 'text-slate-700 dark:text-slate-300',
                                                    label: 'text-slate-500 dark:text-slate-400',
                                                    icon: isDark ? "#94a3b8" : "#64748b",
                                                    projText: isDark ? '#94a3b8' : '#475569'
                                                };
                                            // Pending -> Amber (was Sky)
                                            case 'pending':
                                                return {
                                                    bg: 'bg-amber-50 dark:bg-amber-950/40',
                                                    border: 'border-amber-200 dark:border-amber-800',
                                                    text: 'text-amber-900 dark:text-amber-100',
                                                    label: 'text-amber-800 dark:text-amber-200',
                                                    icon: isDark ? "#C8921C" : "#d97706",
                                                    projText: isDark ? '#C8921C' : '#b45309'
                                                };
                                            // Approved -> Slate-900/Navy (was Emerald) - "Official"
                                            case 'approved':
                                                return {
                                                    bg: 'bg-white dark:bg-slate-900',
                                                    border: 'border-slate-300 dark:border-slate-700',
                                                    text: 'text-slate-900 dark:text-white',
                                                    label: 'text-slate-700 dark:text-slate-300',
                                                    icon: isDark ? "#f8fafc" : "#0f172a",
                                                    projText: isDark ? '#f8fafc' : '#0f172a'
                                                };
                                            case 'returned':
                                            case 'denied':
                                                return {
                                                    bg: 'bg-red-50 dark:bg-red-950/50',
                                                    border: 'border-red-200 dark:border-red-800',
                                                    text: 'text-red-900 dark:text-red-100',
                                                    label: 'text-red-800 dark:text-red-200',
                                                    icon: isDark ? "#C84444" : "#A02020",
                                                    projText: isDark ? '#C07070' : '#7f1d1d'
                                                };
                                            default:
                                                return {
                                                    bg: 'bg-slate-50 dark:bg-slate-800',
                                                    border: 'border-slate-200 dark:border-slate-700',
                                                    text: 'text-slate-700 dark:text-slate-200',
                                                    label: 'text-slate-500 dark:text-slate-400',
                                                    icon: isDark ? "#94a3b8" : "#64748b",
                                                    projText: isDark ? '#94a3b8' : '#334155'
                                                };
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
