import { LeaveBalance, LeaveRequest } from '@/types/schema';
import { formatDays } from '@/utils/formatDays';
import { projectLeaveBalance, calculate90DayProjection } from '@/utils/leaveProjection';
import { differenceInDays, format, parseISO } from 'date-fns';
import { ChevronRight, Clock, Plus, Umbrella, Zap } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';

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
    const [expanded, setExpanded] = useState(false);
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';

    const hasRequests = requests.length > 0;
    const activeRequests = requests.slice(0, 3); // Limit to top 3 for stack preview

    // Calculate 90-day projection
    const ninetyDayProjection = useMemo(() => {
        const currentBalance = leaveBalance?.currentBalance ?? balance;
        const allReqs = allRequests ?? requests;
        return calculate90DayProjection(currentBalance, allReqs);
    }, [leaveBalance, balance, allRequests, requests]);

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
            <View className="bg-surface-container-lowest border-t-[4px] border-t-secondary-container border-outline-variant border-l border-r border-b">
                <View className="p-5">
                    {/* Header Row: Balance + Action Buttons */}
                    <View className="flex-row items-center justify-between mb-5">
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-[52px] h-[52px] bg-secondary-container items-center justify-center">
                                <Umbrella size={26} color={isDark ? '#6C5200' : '#6D5200'} className="text-on-secondary-container" />
                            </View>
                            <View className="flex-1 mr-2">
                                <Text className="text-on-surface text-[20px] font-display uppercase tracking-wide leading-tight mb-0.5" numberOfLines={2}>
                                    Leave Balance
                                </Text>
                                <Text className="text-on-surface-variant text-[13px] font-headline uppercase tracking-wider leading-tight" numberOfLines={2}>
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
                                className="w-10 h-10 bg-secondary-container items-center justify-center"
                            >
                                <Zap size={18} color={isDark ? '#6C5200' : '#6D5200'} className="text-on-secondary-container" strokeWidth={2.5} />
                            </TouchableOpacity>

                            {/* Full Request */}
                            <TouchableOpacity
                                activeOpacity={0.7}
                                onPress={onFullRequest}
                                className="w-10 h-10 bg-transparent border-2 border-outline-variant items-center justify-center"
                            >
                                <Plus size={18} color={isDark ? '#E5E2E1' : '#1A1B1F'} className="text-on-surface" strokeWidth={2.5} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 3-Month Projection */}
                    <View className="mb-5 bg-surface-container border border-outline-variant p-3">
                        <View className="flex-row items-center justify-between">
                            <Text className="text-on-surface-variant text-[11px] font-headline uppercase tracking-widest">
                                90-Day Projection
                            </Text>
                            <Text className="text-secondary-container text-[13px] font-mono font-bold">
                                {formatDays(ninetyDayProjection)} DAYS
                            </Text>
                        </View>
                    </View>

                    {/* Request Smart Stack */}
                    <View className="w-full border-t border-outline-variant pt-5">

                        {!hasRequests ? (
                            // Empty State
                            <View className="h-6" /> // Spacer
                        ) : (
                            // Request Tabs with Projection Data
                            <View className="w-full gap-2">
                                {activeRequests.map((req, index) => {
                                    const getStatusColors = (status: string) => {
                                        switch (status) {
                                            case 'approved':
                                                return {
                                                    bg: 'bg-secondary-container',
                                                    border: 'border-transparent',
                                                    text: 'text-on-secondary-container',
                                                    label: 'text-on-secondary-container',
                                                    iconClass: 'text-on-secondary-container',
                                                    projTextClass: 'text-on-secondary-container'
                                                };
                                            case 'returned':
                                            case 'denied':
                                                return {
                                                    bg: 'bg-error',
                                                    border: 'border-transparent',
                                                    text: 'text-on-error',
                                                    label: 'text-on-error',
                                                    iconClass: 'text-on-error',
                                                    projTextClass: 'text-on-error'
                                                };
                                            default: // draft, pending
                                                return {
                                                    bg: 'bg-transparent',
                                                    border: 'border-[1.5px] border-outline-variant',
                                                    text: 'text-on-surface',
                                                    label: 'text-on-surface-variant',
                                                    iconClass: 'text-on-surface',
                                                    projTextClass: 'text-on-surface'
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
                                                w-full px-3 py-2.5 items-start justify-center mb-2 border-[1.5px]
                                                ${colors.bg} ${colors.border}
                                            `}
                                        >
                                            {/* Top Row: Status + Date Range */}
                                            <View className="flex-row items-center w-full justify-between">
                                                <View className="flex-col">
                                                    <View className="flex-row items-center gap-1.5 mb-0.5">
                                                        <Text className={`text-[10px] font-headline uppercase ${colors.label}`}>
                                                            {req.status}
                                                        </Text>
                                                        {(req.status === 'draft' || req.status === 'pending') && (
                                                            <Clock size={10} color={
                                                                req.status === 'draft' || req.status === 'pending'
                                                                    ? (isDark ? '#E5E2E1' : '#1A1B1F')
                                                                    : undefined
                                                            } className={colors.iconClass} />
                                                        )}
                                                    </View>
                                                    <Text className={`text-xs font-headline ${colors.text}`}>
                                                        {formatDateRange(req.startDate, req.endDate)}
                                                    </Text>
                                                </View>
                                                <ChevronRight size={14} color={isDark ? '#44474F' : '#C4C6D0'} className="text-outline-variant" />
                                            </View>

                                            {/* Bottom Row: Projection Data */}
                                            {showProjection && (
                                                <View className="flex-row items-center gap-3 mt-1.5 pt-1.5 border-t border-dashed border-outline-variant">
                                                    {proj.isUnchargeable ? (
                                                        <Text className="text-[10px] font-headline text-on-surface-variant uppercase tracking-wider">
                                                            No Charge
                                                        </Text>
                                                    ) : (
                                                        <>
                                                            <View className="flex-row items-center gap-1">
                                                                <Text className="text-[9px] font-headline uppercase text-on-surface-variant">Avail</Text>
                                                                <Text className={`text-[11px] font-bold font-mono ${colors.projTextClass}`}>
                                                                    {formatDays(proj.availableOnDeparture)}
                                                                </Text>
                                                            </View>
                                                            <View className="flex-row items-center gap-1">
                                                                <Text className="text-[9px] font-headline uppercase text-on-surface-variant">Chg</Text>
                                                                <Text className={`text-[11px] font-bold font-mono ${colors.projTextClass}`}>
                                                                    {formatDays(req.chargeDays || proj.availableOnDeparture - proj.remainingOnReturn)}
                                                                </Text>
                                                            </View>
                                                            <View className="flex-row items-center gap-1">
                                                                <Text className="text-[9px] font-headline uppercase text-on-surface-variant">Rem</Text>
                                                                <Text className={`text-[11px] font-bold font-mono ${proj.isOverdraft ? 'text-error' : colors.projTextClass}`}>
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
            </View>
        </View>
    );
}
