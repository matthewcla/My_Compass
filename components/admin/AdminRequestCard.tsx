// components/admin/AdminRequestCard.tsx
// Minimal admin card: title, approval level badge, days counter, issue icon affordance.

import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { AdminRequest, SlaStatus } from '@/store/useAdminStore';
import { getShadow } from '@/utils/getShadow';
import { AlertCircle, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

const SLA_COLOR: Record<SlaStatus, string> = { green: '#22c55e', amber: '#f59e0b', red: '#ef4444' };

// Map current approval step to display label
function getCurrentLevel(request: AdminRequest): string {
    const current = request.approvalChain.find(s => s.status === 'current');
    if (current) return current.label.toUpperCase();
    const lastApproved = [...request.approvalChain].reverse().find(s => s.status === 'approved');
    if (lastApproved) return lastApproved.label.toUpperCase();
    return request.approvalChain[0]?.label.toUpperCase() ?? '';
}

interface AdminRequestCardProps {
    request: AdminRequest;
    onPress?: () => void;
    onAction?: () => void;
}

export function AdminRequestCard({ request, onPress, onAction }: AdminRequestCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const level = getCurrentLevel(request);
    const hasIssue = request.status === 'action_required';

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <View style={getShadow({ shadowColor: isDark ? '#000' : '#64748b', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 })}>
                <GlassView
                    intensity={60}
                    tint={isDark ? 'dark' : 'light'}
                    className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    style={{ borderLeftWidth: 3, borderLeftColor: SLA_COLOR[request.slaStatus] }}
                >
                    <View className="flex-row items-center px-3.5 py-3 gap-3">
                        {/* Days counter */}
                        <View className="items-center" style={{ minWidth: 36 }}>
                            <Text className={`text-lg font-black ${request.slaStatus === 'red' ? 'text-red-500' :
                                    request.slaStatus === 'amber' ? 'text-amber-500' :
                                        'text-slate-600 dark:text-slate-300'
                                }`}>
                                {request.daysSinceLastAction}
                            </Text>
                            <Text className="text-[8px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                days
                            </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                            <Text className="text-[14px] font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                                {request.label}
                            </Text>
                            <View className="flex-row items-center gap-2 mt-1">
                                <View className="bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                                    <Text className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        {level}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Issue icon or Chevron */}
                        {hasIssue ? (
                            <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <AlertCircle size={20} color="#ef4444" strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : (
                            <ChevronRight size={16} color={isDark ? '#475569' : '#94a3b8'} />
                        )}
                    </View>
                </GlassView>
            </View>
        </TouchableOpacity>
    );
}
