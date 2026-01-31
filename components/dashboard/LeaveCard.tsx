import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { LeaveRequest } from '@/types/schema';
import { getShadow } from '@/utils/getShadow';
import { format } from 'date-fns';
import { Clock, Plus, Zap } from 'lucide-react-native';
import { MotiView } from 'moti';
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

interface LeaveCardProps {
    balance: number;
    requests?: LeaveRequest[];
    onPressRequest?: (request: LeaveRequest) => void;
    onQuickRequest?: () => void;
}

export function LeaveCard({ balance, requests = [], onPressRequest, onQuickRequest }: LeaveCardProps) {
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
        <View style={getShadow({ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 })}>
            <GlassView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-xl overflow-hidden border border-slate-200/50 dark:border-slate-700/50"
            >
                {/* Decorative Corner */}
                <View className="absolute top-0 right-0 w-4 h-4 bg-amber-500 rounded-bl-xl z-20 pointer-events-none" />

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
                    <View className="flex-1 ml-6 relative items-end z-10">
                        {!hasRequests ? (
                            // Empty State: Quick Request Button
                            <Pressable
                                onPress={onQuickRequest}
                                className="bg-blue-600 dark:bg-blue-500 rounded-lg px-3 py-2.5 flex-row items-center gap-2 self-end mt-1"
                                style={getShadow({ shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 })}
                            >
                                <Zap size={14} color="white" fill="white" />
                                <Text className="text-white font-bold text-xs uppercase tracking-wide">Quick Request</Text>
                            </Pressable>
                        ) : (
                            // Stack State
                            <View className="w-full items-end">
                                {activeRequests.map((req, index) => {
                                    // Stack Logic
                                    const isTop = index === 0;
                                    const zIndex = activeRequests.length - index;

                                    return (
                                        <MotiView
                                            key={req.id}
                                            animate={{
                                                translateY: expanded ? index * 8 : (index * 6),
                                                scale: expanded ? 1 : 1 - (index * 0.05),
                                                opacity: expanded ? 1 : 1 - (index * 0.2),
                                                marginTop: expanded ? index === 0 ? 0 : 8 : 0,
                                            }}
                                            transition={{ type: 'spring', damping: 15 }}
                                            style={{
                                                position: expanded ? 'relative' : 'absolute',
                                                top: 0,
                                                right: 0,
                                                width: '100%',
                                                maxWidth: 180,
                                                zIndex,
                                            }}
                                        >
                                            <Pressable
                                                onPress={() => {
                                                    if (!expanded) {
                                                        setExpanded(true);
                                                    } else {
                                                        onPressRequest?.(req);
                                                    }
                                                }}
                                                className={`
                                                    rounded-lg px-3 py-2.5 border flex-row items-center justify-between
                                                    ${req.status === 'draft'
                                                        ? 'bg-orange-50 dark:bg-orange-500/20 border-orange-100 dark:border-orange-500/30'
                                                        : 'bg-slate-50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-700'}
                                                `}
                                            >
                                                <View className="flex-col">
                                                    <View className="flex-row items-center gap-1.5 mb-0.5">
                                                        <Text className={`text-[10px] font-bold uppercase ${req.status === 'draft' ? 'text-orange-700 dark:text-orange-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {req.status}
                                                        </Text>
                                                        {req.status === 'draft' && <Clock size={10} color={isDark ? "#fdba74" : "#c2410c"} />}
                                                    </View>
                                                    <Text className={`text-xs font-bold ${req.status === 'draft' ? 'text-orange-900 dark:text-orange-100' : 'text-slate-700 dark:text-slate-200'}`}>
                                                        {formatDateRange(req.startDate, req.endDate)}
                                                    </Text>
                                                </View>
                                            </Pressable>
                                        </MotiView>
                                    );
                                })}

                                {/* Collapse / Add Actions */}
                                {expanded && (
                                    <MotiView
                                        from={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="flex-row gap-2 mt-4 justify-end w-full"
                                    >
                                        <Pressable
                                            onPress={() => setExpanded(false)}
                                            className="px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-800"
                                        >
                                            <Text className="text-xs font-bold text-slate-600 dark:text-slate-400">Close</Text>
                                        </Pressable>
                                        <Pressable
                                            onPress={onQuickRequest}
                                            className="px-3 py-2 rounded-lg bg-blue-600 dark:bg-blue-500 flex-row items-center gap-1.5"
                                        >
                                            <Plus size={12} color="white" />
                                            <Text className="text-xs font-bold text-white">New</Text>
                                        </Pressable>
                                    </MotiView>
                                )}
                            </View>
                        )}
                    </View>
                </View>
            </GlassView>
        </View>
    );
}
