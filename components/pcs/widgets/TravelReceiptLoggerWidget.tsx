import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSPhase, usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Camera, Receipt as ReceiptIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';

export function TravelReceiptLoggerWidget() {
    const isDark = useColorScheme() === 'dark';
    const router = useRouter();

    const pcsPhase = usePCSPhase();
    const receipts = usePCSStore(state => state.receipts);

    // Only render if in Phase 3
    if (pcsPhase !== 'TRANSIT_LEAVE') {
        return null;
    }

    const { totalExpenses, receiptCount } = useMemo(() => {
        return {
            totalExpenses: receipts.reduce((sum, r) => sum + (r.amount || 0), 0),
            receiptCount: receipts.length
        };
    }, [receipts]);

    return (
        <View className="mb-4">
            <GlassView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                className="rounded-[20px] overflow-hidden shadow-sm dark:shadow-none bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/10"
            >
                <View className="flex-row items-center justify-between p-4 border-b border-black/5 dark:border-white/10">
                    <View className="flex-row items-center gap-3">
                        <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60 items-center justify-center">
                            <ReceiptIcon size={20} color={isDark ? '#34d399' : '#059669'} />
                        </View>
                        <View>
                            <Text className="text-slate-900 dark:text-white text-[18px] font-black tracking-tight" numberOfLines={2}>Travel Receipts</Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[13px] font-medium" numberOfLines={2}>
                                {receiptCount} Logged Expenses
                            </Text>
                        </View>
                    </View>
                    <View className="items-end">
                        <Text className="text-emerald-700 dark:text-emerald-400 text-[20px] font-black font-mono tracking-tighter">${totalExpenses.toFixed(2)}</Text>
                    </View>
                </View>

                {/* Primary Action Button (Modal Isolation) */}
                <ScalePressable
                    onPress={() => router.push('/(screens)/receipt-scanner' as any)}
                    className="p-4"
                >
                    <View className="rounded-[16px] overflow-hidden border border-emerald-500/20 dark:border-emerald-400/30">
                        <LinearGradient
                            colors={isDark ? ['rgba(16,185,129,0.15)', 'rgba(5,150,105,0.05)'] : ['rgba(209,250,229,0.6)', 'rgba(167,243,208,0.3)']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <View className="flex-row items-center justify-center py-4 gap-3">
                                <Camera size={20} color={isDark ? '#34d399' : '#059669'} />
                                <Text className="text-emerald-800 dark:text-emerald-400 text-[16px] font-bold uppercase tracking-wider">Log New Receipt</Text>
                            </View>
                        </LinearGradient>
                    </View>
                </ScalePressable>
            </GlassView>
        </View>
    );
}
