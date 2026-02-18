import { AllowancesCard } from '@/components/pcs/financials/AllowancesCard';
import { EntitlementsMeter } from '@/components/pcs/financials/EntitlementsMeter';

import { SegmentBreakdownList } from '@/components/pcs/financials/SegmentBreakdownList';
import { ScalePressable } from '@/components/ScalePressable';
import { usePCSStore } from '@/store/usePCSStore';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle2, FileText, Receipt } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { useEffect } from 'react';

export default function FinancialSummaryScreen() {
  const financials = usePCSStore((state) => state.financials);
  const checklist = usePCSStore((state) => state.checklist);
  const setChecklistItemStatus = usePCSStore((state) => state.setChecklistItemStatus);
  const { initializeOrders, activeOrder } = usePCSStore();
  const router = useRouter();

  useEffect(() => {
    if (!activeOrder) {
      initializeOrders();
    }
  }, [activeOrder, initializeOrders]);

  const totalPayout =
    financials.totalMalt + financials.totalPerDiem + financials.dla.estimatedAmount;

  const handleConfirm = () => {
    // Find "Financial Review" checklist item
    const reviewItem = checklist.find((item) => item.label === 'Financial Review');
    if (reviewItem) {
      setChecklistItemStatus(reviewItem.id, 'COMPLETE');
    }
    router.back();
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Estimated Entitlements' }} />
      <ScrollView
        className="flex-1 bg-slate-50 p-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <EntitlementsMeter />
        </View>

        <SegmentBreakdownList />
        <AllowancesCard />

        <View className="mt-4 mb-8">
          <View className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl items-center mb-6 shadow-sm">
            <Text className="text-emerald-700 font-bold mb-2 uppercase tracking-wider text-xs">
              Total Estimated Payout
            </Text>
            <Text className="text-emerald-800 font-bold text-4xl">
              ${totalPayout.toLocaleString()}
            </Text>
          </View>

          {/* Travel Claim Card */}
          <View className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row items-center mb-3">
              <View className="w-10 h-10 rounded-full bg-blue-600 items-center justify-center mr-3">
                <Receipt size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-blue-900 dark:text-blue-100 font-bold text-base">
                  Travel Claim (DD 1351-2)
                </Text>
                <Text className="text-blue-700 dark:text-blue-300 text-xs mt-0.5">
                  File your travel voucher with receipt photos
                </Text>
              </View>
            </View>

            <ScalePressable
              className="bg-blue-600 py-3 rounded-lg items-center flex-row justify-center active:bg-blue-700"
              onPress={() => router.push('/travel-claim/request')}
              accessibilityRole="button"
              accessibilityLabel="File Travel Claim"
            >
              <FileText size={18} color="white" />
              <Text className="text-white font-semibold text-sm ml-2">
                File Travel Claim
              </Text>
            </ScalePressable>
          </View>

          <ScalePressable
            className="bg-slate-900 py-4 rounded-xl items-center flex-row justify-center active:bg-slate-800 shadow-md"
            onPress={handleConfirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm Financial Plan"
          >
            <CheckCircle2 size={20} color="white" />
            <Text className="text-white font-bold text-lg ml-2">
              Confirm Financial Plan
            </Text>
          </ScalePressable>
        </View>
      </ScrollView>
    </>
  );
}
