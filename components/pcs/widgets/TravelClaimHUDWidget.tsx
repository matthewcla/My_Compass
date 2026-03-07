import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder, usePCSStore } from '@/store/usePCSStore';
import { ReceiptCategory } from '@/types/pcs';
import { scanReceipt } from '@/utils/receiptOCR';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
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
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
    >
      <LinearGradient
        colors={isDark ? ['rgba(245,158,11,0.15)', 'rgba(217,119,6,0.05)'] : ['rgba(251,191,36,0.2)', 'rgba(245,158,11,0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      {/* Header */}
      <View className="p-5">
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center gap-4 flex-1">
            <View className="w-[52px] h-[52px] rounded-full bg-amber-500/10 dark:bg-amber-900/40 items-center justify-center border-[1.5px] border-amber-500/20 dark:border-amber-800/60 shadow-sm">
              <DollarSign size={26} color={isDark ? '#FBBF24' : '#D97706'} />
            </View>
            <View className="flex-1">
              <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>Travel Claim</Text>
              <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>File Within 5 Days</Text>
            </View>
          </View>
        </View>

        <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
          {/* Urgency Banner */}
          <View className="bg-amber-100/80 dark:bg-amber-900/40 rounded-lg p-3 mb-4 border border-amber-200 dark:border-amber-700/50">
            <View className="flex-row items-start">
              <AlertCircle size={16} color={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.2} />
              <Text className="ml-2 flex-1 text-xs leading-5 text-amber-900 dark:text-amber-100">
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
              className="flex-1 bg-white/70 dark:bg-slate-900/60 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/30 shadow-sm"
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Receipt size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                  <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Quick Scan
                  </Text>
                </View>
                <Camera size={14} color={isDark ? '#fbbf24' : '#d97706'} strokeWidth={2.2} />
              </View>
              <View className="flex-row items-baseline">
                <Text className="text-2xl font-black text-slate-900 dark:text-white">
                  {capturedReceiptCount}
                </Text>
                {runningTotal > 0 && (
                  <Text className="ml-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                    ${runningTotal.toFixed(2)}
                  </Text>
                )}
              </View>
            </TouchableOpacity>

            <View className="flex-1 bg-white/70 dark:bg-slate-900/60 rounded-xl p-3 border border-amber-200/50 dark:border-amber-700/30 shadow-sm">
              <View className="flex-row items-center mb-2">
                <DollarSign size={14} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Estimated
                </Text>
              </View>
              <Text className="text-2xl font-black text-slate-900 dark:text-white">
                ${estimatedPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
            </View>
          </View>

          {/* CTA Button */}
          <ScalePressable
            onPress={handlePress}
            className="bg-amber-600 dark:bg-amber-500 rounded-[16px] p-4 flex-row items-center justify-between shadow-sm"
            accessibilityRole="button"
            accessibilityLabel={hasDraft ? 'Continue Settlement' : 'Settle Travel Claim'}
          >
            <Text className="text-[15px] font-bold text-white tracking-wide pl-1">
              {hasDraft ? 'Continue Settlement' : 'Settle Travel Claim'}
            </Text>
            <View className="w-8 h-8 rounded-full bg-white/20 items-center justify-center">
              <ChevronRight size={18} color="#ffffff" strokeWidth={3} />
            </View>
          </ScalePressable>
        </View>
      </View>
    </GlassView>
  );
}
