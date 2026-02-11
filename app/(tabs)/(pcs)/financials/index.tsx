import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { usePCSStore } from '@/store/usePCSStore';
import { ObliservBanner } from './_components/ObliservBanner';
import { SegmentBreakdownList } from './_components/SegmentBreakdownList';
import { AllowancesCard } from './_components/AllowancesCard';
import { ScalePressable } from '@/components/ScalePressable';
import { CheckCircle2 } from 'lucide-react-native';

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
