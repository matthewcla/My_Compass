import React from 'react';
import { View, Text, Switch } from 'react-native';
import { usePCSStore } from '@/store/usePCSStore';
import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { ScalePressable } from '@/components/ScalePressable';

export const AllowancesCard = () => {
  const financials = usePCSStore((state) => state.financials);
  const updateFinancials = usePCSStore((state) => state.updateFinancials);

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

          <Link href="/pcs-wizard/financials/advance-pay" asChild>
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
