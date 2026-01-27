import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { Clock } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LeaveCardProps {
    balance: number;
    pendingRequest?: {
        dates: string;
        status: string; // Not explicitly used in mockup visual but good for props
    };
    onPress?: () => void;
}

export function LeaveCard({ balance, pendingRequest, onPress }: LeaveCardProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={{ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 }}>
            <GlassView
                intensity={60}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 flex-row items-center justify-between relative overflow-hidden min-h-[80px]"
            >
                {/* Decorative Corner */}
                <View className="absolute top-0 right-0 w-4 h-4 bg-amber-500 rounded-bl-xl z-10" />

                <View className="flex flex-col">
                    <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Leave Balance</Text>
                    <View className="flex-row items-baseline gap-1.5">
                        <Text className="text-3xl font-bold text-slate-900 dark:text-white leading-none">{balance}</Text>
                        <Text className="text-sm text-slate-400 font-medium">Days Available</Text>
                    </View>
                </View>

                {pendingRequest && (
                    <View className="bg-orange-50 dark:bg-orange-500/20 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-500/30 flex-col items-end">
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                            <Text className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase">Pending Request</Text>
                            <Clock size={12} color={isDark ? "#fdba74" : "#c2410c"} />
                        </View>
                        <Text className="text-sm text-orange-800 dark:text-orange-200 font-bold">{pendingRequest.dates}</Text>
                    </View>
                )}
            </GlassView>
        </TouchableOpacity>
    );
}
