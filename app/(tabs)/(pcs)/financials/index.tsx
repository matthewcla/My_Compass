import { AllowancesCard } from '@/components/pcs/financials/AllowancesCard';
import { EntitlementsMeter } from '@/components/pcs/financials/EntitlementsMeter';
import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { SegmentBreakdownList } from '@/components/pcs/financials/SegmentBreakdownList';
import { ScalePressable } from '@/components/ScalePressable';
import { usePCSStore } from '@/store/usePCSStore';
import { Stack, useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
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
      >
        <View className="mb-6">
          <EntitlementsMeter />
        </View>
        <ObliservBanner />
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
