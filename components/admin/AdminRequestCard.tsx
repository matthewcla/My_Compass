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
            <View style={getShadow({ shadowColor: isDark ? '#94a3b8' : '#64748b', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2 })}>
                <GlassView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    className="rounded-[20px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10"
                >
                    <View className="flex-row items-center px-4 py-4 gap-4">
                        {/* Days counter */}
                        <View className="items-center" style={{ minWidth: 40 }}>
                            <Text className={`text-[20px] font-black tracking-tight ${request.slaStatus === 'red' ? 'text-red-500' :
                                request.slaStatus === 'amber' ? 'text-amber-500' :
                                    'text-slate-600 dark:text-slate-300'
                                }`} numberOfLines={1}>
                                {request.daysSinceLastAction}
                            </Text>
                            <Text className="text-[9px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                days
                            </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                            <Text className="text-[15px] font-[800] text-slate-900 dark:text-white tracking-[-0.2px] mb-1" numberOfLines={1}>
                                {request.label}
                            </Text>
                            <View className="flex-row items-center gap-2">
                                <View className="bg-slate-200/80 dark:bg-slate-700/80 px-2 py-0.5 rounded-md border border-slate-300/50 dark:border-slate-600/50">
                                    <Text className="text-[9px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                        {level}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Issue icon or Chevron */}
                        {hasIssue ? (
                            <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center border border-red-500/20">
                                <AlertCircle size={18} color="#EF4444" strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : (
                            <View className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800/80 items-center justify-center border border-slate-200 dark:border-slate-700/80">
                                <ChevronRight size={18} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.5} />
                            </View>
                        )}
                    </View>
                </GlassView>
            </View>
        </TouchableOpacity>
    );
}
