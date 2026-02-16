import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { ReceiptCategory } from '@/types/pcs';
import { scanReceipt } from '@/utils/receiptOCR';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { AlertCircle, Camera, ChevronRight, DollarSign, Receipt } from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Platform, Text, TouchableOpacity, View } from 'react-native';

export function TravelClaimHUDWidget() {
  const activeOrder = useActiveOrder();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // Travel claim settlement state — from unified PCS store
  const draft = usePCSStore((s) => s.travelClaim.draft);
  const settlementStatus = usePCSStore((s) => s.travelClaim.status);
  const initSettlement = usePCSStore((s) => s.initSettlement);
  const financials = usePCSStore((s) => s.financials);

  // Receipt capture state (integrated from ReceiptScannerWidget)
  const receipts = usePCSStore((s) => s.receipts);
  const addReceipt = usePCSStore((s) => s.addReceipt);
  const [isCapturing, setIsCapturing] = useState(false);
  const capturedReceiptCount = receipts.length;
  const runningTotal = receipts.reduce((sum, r) => sum + (r.amount ?? 0), 0);

  const hasDraft = !!draft && ['draft', 'pending'].includes(draft.status);

  const estimatedPayout = useMemo(() => {
    if (draft) return draft.totalClaimAmount || 0;
    // Fallback: entitlement estimates from Phase 2
    return (financials.totalMalt || 0) + (financials.totalPerDiem || 0) + (financials.dla.estimatedAmount || 0);
  }, [draft, financials]);

  const handleCapture = useCallback(async () => {
    setIsCapturing(true);
    try {
      const permResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permResult.granted) {
        Alert.alert('Camera Required', 'Please allow camera access to scan receipts.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const imageUri = result.assets[0].uri;
      let amount: number | null = null;
      let category: ReceiptCategory = 'OTHER';
      let confidence: 'high' | 'medium' | 'low' = 'low';

      try {
        const ocrResult = await scanReceipt(imageUri);
        amount = ocrResult.extractedAmount;
        category = ocrResult.detectedCategory;
        confidence = ocrResult.confidence;
      } catch {
        // OCR failed silently
      }

      addReceipt({ imageUri, amount, category, note: '', ocrConfidence: confidence });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      }
    } catch {
      Alert.alert('Error', 'Could not capture receipt. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  }, [addReceipt]);

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    // Initialize settlement if not already started, then navigate
    if (!hasDraft) {
      initSettlement();
    }
    router.push('/travel-claim/request');
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
      <View className="p-5">
        {/* Urgency Banner */}
        <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 mb-4 border border-amber-200 dark:border-amber-800/40">
          <View className="flex-row items-start">
            <AlertCircle size={16} color={isDark ? '#fcd34d' : '#d97706'} strokeWidth={2.2} />
            <Text className="ml-2 flex-1 text-xs leading-5 text-amber-700 dark:text-amber-300">
              JTR regulations require submission within 5 days of arrival to receive reimbursement and pay off your Government Travel Charge Card (GTCC).
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-4">
          {/* Receipts — tappable to capture */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleCapture}
            disabled={isCapturing}
            className="flex-1 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700"
          >
            <View className="flex-row items-center justify-between mb-1">
              <View className="flex-row items-center">
                <Receipt size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text className="ml-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Receipts
                </Text>
              </View>
              <Camera size={14} color={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.2} />
            </View>
            <View className="flex-row items-baseline">
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">
                {capturedReceiptCount}
              </Text>
              {runningTotal > 0 && (
                <Text className="ml-2 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  ${runningTotal.toFixed(2)}
                </Text>
              )}
            </View>
          </TouchableOpacity>

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
          accessibilityLabel={hasDraft ? 'Continue Settlement' : 'Settle Travel Claim'}
        >
          <Text className="text-base font-bold text-white">
            {hasDraft ? 'Continue Settlement' : 'Settle Travel Claim'}
          </Text>
          <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
        </ScalePressable>
      </View>
    </GlassView>
  );
}
