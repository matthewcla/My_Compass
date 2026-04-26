// components/admin/AdminRequestCard.tsx
// Minimal admin card: title, approval level badge, days counter, issue icon affordance.

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SolidView } from '@/components/ui/SolidView';
import { AdminRequest, SlaStatus } from '@/store/useAdminStore';
import { getShadow } from '@/utils/getShadow';
import { AlertCircle, ChevronRight, PenTool } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const level = getCurrentLevel(request);
    const hasIssue = request.status === 'action_required';
    const isActionable = request.isUserActionable;

    return (
        <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
            <View style={getShadow({ 
                shadowColor: isDark ? '#000' : '#64748b',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.4 : 0.1,
                shadowRadius: 12,
                elevation: 8
            })}>
                <SolidView
                    intensity={100}
                    tint="default"
                    className={`rounded-none overflow-hidden border-2 ${isActionable ? 'border-amber-400/50 bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                >
                    <View className="flex-row items-center px-4 py-4 gap-4">
                        {/* Days counter */}
                        <View className="items-center" style={{ minWidth: 40 }}>
                            <Text className={`text-[20px] font-black tracking-tight ${request.slaStatus === 'red' ? 'text-red-600 dark:text-red-500' :
                                request.slaStatus === 'amber' ? 'text-amber-600 dark:text-amber-500' :
                                    'text-slate-900 dark:text-slate-300'
                                }`} numberOfLines={1}>
                                {request.daysSinceLastAction}
                            </Text>
                            <Text className="text-[9px] font-bold uppercase text-slate-600 dark:text-slate-500 tracking-wider">
                                days
                            </Text>
                        </View>

                        {/* Content */}
                        <View className="flex-1">
                            <Text className="text-[15px] font-[800] text-slate-900 dark:text-white tracking-[-0.2px] mb-1" numberOfLines={1}>
                                {request.label}
                            </Text>
                            <View className="flex-row items-center gap-2">
                                <View className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-none border border-slate-300 dark:border-slate-700">
                                    <Text className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                        {level}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {isActionable ? (
                            <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="w-8 h-8 rounded-none bg-amber-100 dark:bg-amber-400/20 items-center justify-center border-2 border-amber-300 dark:border-amber-400/40">
                                <PenTool size={16} color={isDark ? Colors.dark.status.warning : '#B45309'} strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : hasIssue ? (
                            <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} className="w-8 h-8 rounded-none bg-red-100 dark:bg-red-500/10 items-center justify-center border-2 border-red-500 dark:border-red-500/20">
                                <AlertCircle size={18} color={Colors[colorScheme].status.error} strokeWidth={2.5} />
                            </TouchableOpacity>
                        ) : (
                            <View className="w-8 h-8 rounded-none bg-slate-100 dark:bg-slate-800/80 items-center justify-center border-2 border-slate-200 dark:border-slate-700/80">
                                <ChevronRight size={18} color={isDark ? '#64748B' : '#94A3B8'} strokeWidth={2.5} />
                            </View>
                        )}
                    </View>
                </SolidView>
            </View>
        </TouchableOpacity>
    );
}
