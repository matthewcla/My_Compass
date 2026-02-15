import { ScalePressable } from '@/components/ScalePressable';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassView } from '@/components/ui/GlassView';
import { useActiveOrder } from '@/store/usePCSStore';
import { useTravelClaimStore } from '@/store/useTravelClaimStore';
import { useUserStore } from '@/store/useUserStore';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { AlertCircle, ChevronRight, DollarSign, Receipt } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Platform, Text, View } from 'react-native';

export function TravelClaimHUDWidget() {
  const activeOrder = useActiveOrder();
  const user = useUserStore((state) => state.user);
  const travelClaims = useTravelClaimStore((state) => state.travelClaims);
  const createDraft = useTravelClaimStore((state) => state.createDraft);
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  const pcsClaimDraft = useMemo(() => {
    return Object.values(travelClaims).find(
      (c) => c.travelType === 'pcs' && ['draft', 'pending'].includes(c.status)
    );
  }, [travelClaims]);

  const receiptCount = useMemo(() => {
    if (!pcsClaimDraft) return 0;
    return pcsClaimDraft.expenses.reduce(
      (acc, e) => acc + (e.receipts?.length || 0),
      0
    );
  }, [pcsClaimDraft]);

  const estimatedPayout = useMemo(() => {
    if (!pcsClaimDraft) return 0;
    return pcsClaimDraft.totalClaimAmount || 0;
  }, [pcsClaimDraft]);

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    if (pcsClaimDraft) {
      router.push(`/travel-claim/request?draftId=${pcsClaimDraft.id}`);
    } else {
      // Create new draft
      if (!user || !activeOrder) return;

      const claimId = `tc-pcs-${Date.now()}`;
      const newClaim = {
        id: claimId,
        userId: user.id,
        orderNumber: activeOrder.orderNumber,
        travelType: 'pcs' as const,
        departureDate: activeOrder.segments[0]?.dates.projectedDeparture || '',
        returnDate: activeOrder.segments[activeOrder.segments.length - 1]?.dates.projectedArrival || '',
        departureLocation: activeOrder.segments[0]?.location.name || '',
        destinationLocation: activeOrder.gainingCommand.name,
        isOconus: activeOrder.isOconus,
        travelMode: 'pov' as const,
        maltAmount: 0,
        maltMiles: 0,
        dlaAmount: 0,
        tleDays: 0,
        tleAmount: 0,
        perDiemDays: [],
        expenses: [],
        totalExpenses: 0,
        totalEntitlements: 0,
        totalClaimAmount: 0,
        advanceAmount: 0,
        netPayable: 0,
        status: 'draft' as const,
        statusHistory: [],
        approvalChain: [],
        memberCertification: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        syncStatus: 'pending_upload' as const,
        lastSyncTimestamp: new Date().toISOString(),
      };

      await createDraft(newClaim);
      router.push(`/travel-claim/request?draftId=${claimId}`);
    }
  };

  if (!activeOrder) return null;

  return (
    <GlassView
      intensity={75}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10"
    >
      {/* Header */}
      <View className="bg-amber-50/30 dark:bg-amber-900/20 px-4 py-3.5">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 items-center justify-center mr-3">
            <DollarSign size={22} color={isDark ? '#fcd34d' : '#d97706'} strokeWidth={2.2} />
          </View>
          <View className="flex-1">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-300">
              DD 1351-2 Travel Claim
            </Text>
            <Text className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
              File Within 5 Days
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="p-4">
        {/* Urgency Banner */}
        <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-3 border border-amber-200 dark:border-amber-800/40">
          <View className="flex-row items-start">
            <AlertCircle size={16} color={isDark ? '#fcd34d' : '#d97706'} strokeWidth={2.2} />
            <Text className="ml-2 flex-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
              JTR regulations require submission within 5 days of arrival to receive reimbursement and pay off your Government Travel Charge Card (GTCC).
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-3">
          <View className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <View className="flex-row items-center mb-1">
              <Receipt size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
              <Text className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Receipts
              </Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              {receiptCount}
            </Text>
          </View>

          <View className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <View className="flex-row items-center mb-1">
              <DollarSign size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
              <Text className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Estimated
              </Text>
            </View>
            <Text className="text-2xl font-bold text-slate-900 dark:text-white">
              ${estimatedPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
          </View>
        </View>

        {/* CTA Button */}
        <ScalePressable
          onPress={handlePress}
          className="bg-blue-600 dark:bg-blue-500 rounded-lg p-3.5 flex-row items-center justify-between"
          accessibilityRole="button"
          accessibilityLabel={pcsClaimDraft ? 'Continue Travel Claim' : 'Start Travel Claim'}
        >
          <Text className="text-base font-bold text-white">
            {pcsClaimDraft ? 'Continue Claim' : 'Start Travel Claim'}
          </Text>
          <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
        </ScalePressable>
      </View>
    </GlassView>
  );
}
