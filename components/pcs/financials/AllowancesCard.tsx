import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { Link } from 'expo-router';
import { ChevronRight, DollarSign } from 'lucide-react-native';
import React from 'react';
import { Platform, Switch, Text, useColorScheme, View } from 'react-native';

interface AllowancesCardProps {
  variant?: 'full' | 'widget';
}

export const AllowancesCard = ({ variant = 'full' }: AllowancesCardProps) => {
  const financials = usePCSStore((state) => state.financials);
  const updateFinancials = usePCSStore((state) => state.updateFinancials);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ─── Widget Variant ───────────────────────────────────────────
  if (variant === 'widget') {
    const dlaAmount = financials.dla.estimatedAmount;
    const advanceRequested = financials.advancePay.requested;
    const advanceAmount = financials.advancePay.amount;

    const handleCTA = () => {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    };

    return (
      <GlassView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        className="rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 p-5"
      >
        {/* Header */}
        <View className="flex-row items-center mb-3">
          <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
            <DollarSign size={20} color={isDark ? '#6EE7B7' : '#059669'} />
          </View>
          <Text className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
            Money Up Front
          </Text>
        </View>

        {/* DLA Amount */}
        <Text className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
          ${dlaAmount.toLocaleString()}
        </Text>
        <Text className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Estimated Dislocation Allowance
        </Text>

        {/* Divider */}
        <View className="h-[1px] bg-emerald-200/30 dark:bg-emerald-700/30 mb-4" />

        {/* Advance Pay Status */}
        <Text className="text-sm text-slate-600 dark:text-slate-300 mb-4">
          {advanceRequested
            ? `$${advanceAmount.toLocaleString()} Advance Requested`
            : 'No Advance Requested'}
        </Text>

        {/* Primary CTA */}
        <Link href="/pcs-wizard/financial-review" asChild>
          <ScalePressable
            onPress={handleCTA}
            className="bg-emerald-600 dark:bg-emerald-700 px-4 py-3 rounded-lg items-center"
            accessibilityRole="button"
            accessibilityLabel="Start DLA Request"
          >
            <Text className="text-white font-semibold text-sm">
              Start DLA Request
            </Text>
          </ScalePressable>
        </Link>
      </GlassView>
    );
  }

  // ─── Full Variant (default — unchanged) ───────────────────────
  const handleDLAToggle = (value: boolean) => {
    updateFinancials({
      dla: {
        ...financials.dla,
        receivedFY: value,
      },
    });
  };

  return (
    <View className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm mb-6">
      <Text className="text-lg font-bold text-slate-800 mb-6">Allowances</Text>

      {/* DLA Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-4">
            <Text className="font-semibold text-slate-700 text-base mb-1">
              Dislocation Allowance (DLA)
            </Text>
            <Text className="text-slate-500 text-sm leading-5">
              Partial reimbursement for relocation expenses.
            </Text>
          </View>
          <Text className="font-bold text-emerald-600 text-lg">
            ${financials.dla.estimatedAmount.toLocaleString()}
          </Text>
        </View>

        <View className="flex-row items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 mt-2">
          <Text className="text-slate-600 font-medium text-sm flex-1 pr-4">
            Received DLA this Fiscal Year?
          </Text>
          <Switch
            value={financials.dla.receivedFY}
            onValueChange={handleDLAToggle}
            trackColor={{ false: '#CBD5E1', true: '#10B981' }}
            thumbColor={'#FFFFFF'}
          />
        </View>
        {financials.dla.receivedFY && (
          <Text className="text-amber-600 text-xs mt-2 italic font-medium">
            * Eligibility reduced. Explanation required.
          </Text>
        )}
      </View>

      <View className="h-[1px] bg-slate-100 mb-6" />

      {/* Advance Pay Section */}
      <View>
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="font-semibold text-slate-700 text-base mb-1">
              Advance Pay
            </Text>
            <Text className="text-slate-500 text-sm">
              {financials.advancePay.requested
                ? `Requested: $${financials.advancePay.amount.toLocaleString()}`
                : 'None Requested'}
            </Text>
          </View>

          <Link href="/pcs-wizard/financial-review" asChild>
            <ScalePressable
              className="flex-row items-center bg-blue-50 px-3 py-2 rounded-lg active:bg-blue-100 border border-blue-100"
              accessibilityRole="button"
              accessibilityLabel="Edit Advance Pay"
            >
              <Text className="text-blue-600 font-medium text-sm mr-1">Edit</Text>
              <ChevronRight size={16} color="#2563EB" />
            </ScalePressable>
          </Link>
        </View>
      </View>
    </View>
  );
};
