import { GlassView } from '@/components/ui/GlassView';
import { usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, DollarSign, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { Text, useColorScheme, View } from 'react-native';

// ─── Helpers ───────────────────────────────────────────────────

function formatAmount(amount: number): string {
    return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

interface LineItemProps {
    label: string;
    amount: number;
    muted?: boolean;
}

function LineItem({ label, amount, muted }: LineItemProps) {
    return (
        <View className="flex-row justify-between items-center py-2">
            <Text
                className={`text-sm font-medium ${muted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'
                    }`}
            >
                {label}
            </Text>
            <Text
                className={`text-sm font-semibold tabular-nums ${muted ? 'text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'
                    }`}
            >
                {formatAmount(amount)}
            </Text>
        </View>
    );
}

// ─── Financial Snapshot ────────────────────────────────────────

/**
 * PCS Financial Snapshot — Consolidated Entitlement Summary
 *
 * Displays all PCS financial line items in one card:
 * DLA, MALT, Per Diem, Advance Pay, Total, and HHG over-limit risk.
 * Rendered inside Phase 2 of the UCT when ACTIVE.
 */
export function PCSFinancialSnapshot() {
    const financials = usePCSStore((s) => s.financials);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const { dla, advancePay, totalMalt, totalPerDiem, hhg } = financials;

    const total =
        dla.estimatedAmount +
        totalMalt +
        totalPerDiem +
        (advancePay.requested ? advancePay.amount : 0);

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
        >
            <LinearGradient
                colors={isDark ? ['rgba(16,185,129,0.15)', 'transparent'] : ['rgba(16,185,129,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-5">
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-[52px] h-[52px] rounded-full bg-emerald-500/10 dark:bg-emerald-900/40 items-center justify-center border-[1.5px] border-emerald-500/20 dark:border-emerald-800/60 shadow-sm">
                            <DollarSign size={26} color={isDark ? '#34D399' : '#10B981'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>Estimated Entitlements</Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>PCS Financial Snapshot</Text>
                        </View>
                    </View>
                </View>

                {/* Line Items */}
                <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-2">
                    <LineItem label="Dislocation Allowance (DLA)" amount={dla.estimatedAmount} />
                    <LineItem label="MALT (Mileage)" amount={totalMalt} />
                    <LineItem label="Per Diem" amount={totalPerDiem} />
                    <LineItem
                        label={advancePay.requested ? 'Advance Pay' : 'Advance Pay (not requested)'}
                        amount={advancePay.requested ? advancePay.amount : 0}
                        muted={!advancePay.requested}
                    />
                </View>

                {/* Total */}
                <View className="flex-row justify-between items-center pt-3 mt-1 border-t border-slate-200/50 dark:border-slate-600/50">
                    <View className="flex-row items-center">
                        <TrendingUp size={16} color={isDark ? '#4ADE80' : '#16A34A'} />
                        <Text className="text-base font-bold text-slate-800 dark:text-white ml-2">
                            Total Estimated
                        </Text>
                    </View>
                    <Text className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                        {formatAmount(total)}
                    </Text>
                </View>

                {/* HHG Over-Limit Warning */}
                {hhg.isOverLimit && (
                    <View className="flex-row items-center mt-3 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                        <AlertTriangle size={14} color={isDark ? '#FBBF24' : '#D97706'} />
                        <Text className="text-xs font-semibold text-amber-700 dark:text-amber-300 ml-2 flex-1">
                            HHG estimate exceeds weight limit — potential excess cost charges
                        </Text>
                    </View>
                )}
            </View>
        </GlassView>
    );
}
