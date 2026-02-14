import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { FileDown, RefreshCw, Share2 } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Text, View } from 'react-native';

export interface DigitalOrdersWalletProps {
  variant?: 'widget';
}

const STALE_DAYS_THRESHOLD = 30;

const formatWalletDate = (value?: string): string => {
  if (!value) return 'UNKNOWN';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'UNKNOWN';
  return format(parsed, 'dd MMM yyyy').toUpperCase();
};

const daysSince = (value?: string): number => {
  if (!value) return 999;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 999;
  const elapsedMs = Date.now() - parsed.getTime();
  return Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
};

const ageLabel = (days: number): string => {
  if (days <= 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

export function DigitalOrdersWallet({ variant = 'widget' }: DigitalOrdersWalletProps) {
  void variant;

  const cachedOrders = usePCSStore((state) => state.cachedOrders);
  const activeOrder = usePCSStore((state) => state.activeOrder);
  const cacheOrders = usePCSStore((state) => state.cacheOrders);

  const [isOffline, setIsOffline] = useState(false);
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      setIsOffline(false);
      return;
    }

    const updateOnlineState = () => {
      setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);
    };

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);

    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const validateCachedFile = async () => {
      if (!cachedOrders?.localUri) {
        if (isMounted) setIsCorrupted(false);
        return;
      }

      try {
        const fileInfo = await FileSystem.getInfoAsync(cachedOrders.localUri);
        if (isMounted) {
          setIsCorrupted(!fileInfo.exists);
        }
      } catch {
        if (isMounted) {
          setIsCorrupted(true);
        }
      }
    };

    void validateCachedFile();

    return () => {
      isMounted = false;
    };
  }, [cachedOrders?.localUri]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style).catch(() => undefined);
    }
  };

  const trySharePDF = async (dialogTitle?: string) => {
    if (!cachedOrders?.localUri) return false;

    const fileInfo = await FileSystem.getInfoAsync(cachedOrders.localUri);
    if (!fileInfo.exists) {
      setIsCorrupted(true);
      Alert.alert('Orders File Unavailable', 'Cached orders appear corrupted. Please re-download.');
      return false;
    }

    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      Alert.alert('Sharing Unavailable', 'This device does not support file sharing.');
      return false;
    }

    await Sharing.shareAsync(cachedOrders.localUri, {
      mimeType: 'application/pdf',
      dialogTitle: dialogTitle || 'Orders',
      UTI: 'com.adobe.pdf',
    });

    return true;
  };

  const handleViewPDF = async () => {
    if (!cachedOrders) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await trySharePDF('View Orders');
    } catch {
      Alert.alert('Unable to Open PDF', 'Please try re-downloading your orders.');
    }
  };

  const handleShare = async () => {
    if (!cachedOrders) return;
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);

    try {
      await trySharePDF('Share Orders');
    } catch {
      Alert.alert('Unable to Share', 'Please try again.');
    }
  };

  const handleRedownload = async () => {
    if (isRefreshing) return;

    const ordersUrl = (activeOrder as any)?.ordersUrl || cachedOrders?.originalUrl;
    if (!ordersUrl) {
      Alert.alert('Orders URL Missing', 'No source URL is available to re-download orders.');
      return;
    }

    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setIsRefreshing(true);
    const beforeUri = cachedOrders?.localUri || '';

    try {
      await cacheOrders(ordersUrl);
      const refreshed = usePCSStore.getState().cachedOrders;
      const success = !!refreshed?.localUri && refreshed.localUri !== beforeUri;

      if (success) {
        setIsCorrupted(false);
        Alert.alert('Orders Updated', 'Latest orders were cached for offline use.');
      } else {
        Alert.alert('Refresh Failed', 'Unable to refresh orders. Check your connection and try again.');
      }
    } catch {
      Alert.alert('Refresh Failed', 'Unable to refresh orders. Check your connection and try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCacheOrders = async () => {
    const ordersUrl = (activeOrder as any)?.ordersUrl || cachedOrders?.originalUrl;
    if (!ordersUrl) {
      Alert.alert('Orders URL Missing', 'No source URL is available for download.');
      return;
    }
    await handleRedownload();
  };

  const cachedAgeDays = useMemo(() => daysSince(cachedOrders?.cachedAt), [cachedOrders?.cachedAt]);
  const isStale = cachedAgeDays > STALE_DAYS_THRESHOLD;

  if (!cachedOrders || !activeOrder) {
    return (
      <GlassView
        intensity={90}
        tint="dark"
        className="rounded-2xl border border-slate-700 dark:border-slate-800 overflow-hidden"
      >
        <View className="bg-slate-900 dark:bg-black p-4">
          <Text className="text-xs uppercase tracking-widest font-semibold text-gray-300">
            Official Orders
          </Text>
          <Text className="mt-3 text-lg font-bold text-white">No Orders Cached</Text>

          <Text
            className={`mt-2 text-sm ${
              isOffline
                ? 'text-red-300'
                : 'text-gray-300'
            }`}
          >
            {isOffline
              ? 'No orders available offline.'
              : 'Download your orders to keep them available without network.'}
          </Text>

          <ScalePressable
            onPress={handleCacheOrders}
            className="mt-4 h-12 rounded-xl border border-blue-600/60 bg-blue-600/20 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Download orders"
          >
            <Text className="text-sm font-semibold text-blue-300">Download Orders</Text>
          </ScalePressable>
        </View>
      </GlassView>
    );
  }

  const detachingFrom = activeOrder.segments[0]?.location?.name || 'Unknown Command';
  const effectiveDate = formatWalletDate(activeOrder.reportNLT);
  const gainingCommand = activeOrder.gainingCommand?.name?.toUpperCase() || 'UNKNOWN COMMAND';

  return (
    <GlassView
      intensity={90}
      tint="dark"
      className="rounded-2xl border border-slate-700 dark:border-slate-800 overflow-hidden"
    >
      <View className="bg-slate-900 dark:bg-black p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-xs uppercase tracking-widest font-semibold text-white">
            Official Orders
          </Text>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-xs font-medium text-green-400">Cached</Text>
          </View>
        </View>

        <View className="mt-4">
          <Text className="text-xl font-bold text-white">#{activeOrder.orderNumber}</Text>
          <Text className="mt-1 text-sm text-gray-300">Effective Date: {effectiveDate}</Text>
          <Text className="mt-3 text-base font-semibold text-white">
            Gaining Command: {gainingCommand}
          </Text>
          <Text className="mt-1 text-sm text-gray-400">
            Detaching From: {detachingFrom}
          </Text>
        </View>

        {isStale ? (
          <View className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-2">
            <Text className="text-xs font-medium text-amber-300">
              Orders may be outdated (cached over 30 days ago).
            </Text>
          </View>
        ) : null}

        {isCorrupted ? (
          <View className="mt-3 rounded-lg border border-red-500/40 bg-red-500/15 px-3 py-2">
            <Text className="text-xs font-medium text-red-300">
              Cached PDF appears corrupted. Re-download required.
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row gap-2">
          <ScalePressable
            onPress={handleViewPDF}
            disabled={isCorrupted}
            className={`flex-1 h-12 rounded-xl border items-center justify-center ${
              isCorrupted
                ? 'border-slate-700 bg-slate-800/70'
                : 'border-blue-600/50 bg-blue-600/20'
            }`}
            accessibilityRole="button"
            accessibilityLabel="View PDF"
          >
            <FileDown size={16} color={isCorrupted ? '#64748b' : '#93c5fd'} />
            <Text className={`mt-1 text-xs font-semibold ${isCorrupted ? 'text-slate-500' : 'text-blue-200'}`}>
              View PDF
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={handleShare}
            disabled={isCorrupted}
            className={`flex-1 h-12 rounded-xl border items-center justify-center ${
              isCorrupted
                ? 'border-slate-700 bg-slate-800/70'
                : 'border-blue-600/50 bg-blue-600/20'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Share orders"
          >
            <Share2 size={16} color={isCorrupted ? '#64748b' : '#93c5fd'} />
            <Text className={`mt-1 text-xs font-semibold ${isCorrupted ? 'text-slate-500' : 'text-blue-200'}`}>
              Share
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={handleRedownload}
            disabled={isRefreshing}
            className={`flex-1 h-12 rounded-xl border items-center justify-center ${
              isRefreshing
                ? 'border-slate-700 bg-slate-800/70'
                : 'border-blue-600/50 bg-blue-600/20'
            }`}
            accessibilityRole="button"
            accessibilityLabel="Re-download orders"
          >
            <RefreshCw size={16} color={isRefreshing ? '#64748b' : '#93c5fd'} />
            <Text className={`mt-1 text-xs font-semibold ${isRefreshing ? 'text-slate-500' : 'text-blue-200'}`}>
              Re-download
            </Text>
          </ScalePressable>
        </View>

        <Text className="mt-4 text-xs text-gray-500">Last cached: {ageLabel(cachedAgeDays)}</Text>
      </View>
    </GlassView>
  );
}
