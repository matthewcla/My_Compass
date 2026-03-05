import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { usePCSStore } from '@/store/usePCSStore';
import { format } from 'date-fns';
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
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

  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

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
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        className="rounded-2xl overflow-hidden mx-4 mb-8"
        style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
      >
        <View className="bg-slate-900/5 dark:bg-slate-900/70 p-5 pb-4">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-600 dark:text-slate-300">
            Official Orders
          </Text>
        </View>
        <View className="bg-white/40 dark:bg-slate-950/40 px-5 pt-4 pb-5 border-t border-slate-200/50 dark:border-slate-700/50">
          <Text className="text-xl font-bold text-slate-900 dark:text-white">No Orders Cached</Text>

          <Text
            className={`mt-2 text-[13px] leading-5 ${isOffline
              ? 'text-red-500 dark:text-red-400'
              : 'text-slate-600 dark:text-slate-400'
              }`}
          >
            {isOffline
              ? 'No orders available offline.'
              : 'Download your orders to keep them available without network connection.'}
          </Text>

          <ScalePressable
            onPress={handleCacheOrders}
            className="mt-5 h-12 rounded-xl border border-blue-500/20 bg-blue-500/10 items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Download orders"
          >
            <Text className="text-sm font-bold text-blue-700 dark:text-blue-300">Download Orders</Text>
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
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-2xl overflow-hidden mx-4 mb-8"
      style={{ borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}
    >
      <View className="bg-slate-900/5 dark:bg-slate-900/70 p-5 pb-4 flex-row items-center justify-between">
        <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-600 dark:text-slate-300">
          Official Orders
        </Text>
        <View className="flex-row items-center bg-green-500/20 px-2 py-1 rounded border border-green-500/30">
          <View className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5" />
          <Text className="text-[10px] font-bold uppercase tracking-wider text-green-300">Cached</Text>
        </View>
      </View>

      <View className="bg-white/40 dark:bg-slate-950/40 px-5 pt-4 pb-5 border-t border-slate-200/50 dark:border-slate-700/50">
        <View>
          <Text className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">#{activeOrder.orderNumber}</Text>
          <Text className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1">Effective Date: {effectiveDate}</Text>

          <View className="mt-4 bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60">
            <Text className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1">Gaining Command</Text>
            <Text className="text-[14px] font-bold text-slate-800 dark:text-slate-200">
              {gainingCommand}
            </Text>

            <View className="h-[1px] bg-slate-200 dark:bg-slate-700 my-2" />

            <Text className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 mb-1">Detaching From</Text>
            <Text className="text-[13px] font-semibold text-slate-600 dark:text-slate-400">
              {detachingFrom}
            </Text>
          </View>
        </View>

        {isStale ? (
          <View className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2">
            <Text className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              Orders may be outdated (cached over 30 days ago).
            </Text>
          </View>
        ) : null}

        {isCorrupted ? (
          <View className="mt-4 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2">
            <Text className="text-xs font-semibold text-red-700 dark:text-red-400">
              Cached PDF appears corrupted. Re-download required.
            </Text>
          </View>
        ) : null}

        <View className="mt-4 flex-row gap-2">
          <ScalePressable
            onPress={handleViewPDF}
            disabled={isCorrupted}
            className={`flex-1 h-12 rounded-xl border items-center justify-center flex-row ${isCorrupted
              ? 'border-slate-200/50 bg-slate-100/50 dark:border-slate-700/50 dark:bg-slate-800/50'
              : 'border-blue-500/20 bg-blue-500/10'
              }`}
            accessibilityRole="button"
            accessibilityLabel="View PDF"
          >
            <FileDown size={14} color={isCorrupted ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#60a5fa' : '#2563eb')} strokeWidth={2.5} />
            <Text className={`ml-1.5 text-xs font-bold ${isCorrupted ? 'text-slate-400 dark:text-slate-500' : 'text-blue-700 dark:text-blue-400'}`}>
              View
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={handleShare}
            disabled={isCorrupted}
            className={`flex-1 h-12 rounded-xl border items-center justify-center flex-row ${isCorrupted
              ? 'border-slate-200/50 bg-slate-100/50 dark:border-slate-700/50 dark:bg-slate-800/50'
              : 'border-blue-500/20 bg-blue-500/10'
              }`}
            accessibilityRole="button"
            accessibilityLabel="Share orders"
          >
            <Share2 size={14} color={isCorrupted ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#60a5fa' : '#2563eb')} strokeWidth={2.5} />
            <Text className={`ml-1.5 text-xs font-bold ${isCorrupted ? 'text-slate-400 dark:text-slate-500' : 'text-blue-700 dark:text-blue-400'}`}>
              Share
            </Text>
          </ScalePressable>

          <ScalePressable
            onPress={handleRedownload}
            disabled={isRefreshing}
            className={`flex-1 h-12 rounded-xl border items-center justify-center flex-row ${isRefreshing
              ? 'border-slate-200/50 bg-slate-100/50 dark:border-slate-700/50 dark:bg-slate-800/50'
              : 'border-blue-500/20 bg-blue-500/10'
              }`}
            accessibilityRole="button"
            accessibilityLabel="Re-download orders"
          >
            <RefreshCw size={14} color={isRefreshing ? (isDark ? '#64748b' : '#94a3b8') : (isDark ? '#60a5fa' : '#2563eb')} strokeWidth={2.5} />
            <Text className={`ml-1.5 text-xs font-bold ${isRefreshing ? 'text-slate-400 dark:text-slate-500' : 'text-blue-700 dark:text-blue-400'}`}>
              Refresh
            </Text>
          </ScalePressable>
        </View>

        <View className="items-center mt-5">
          <Text className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">Last cached {ageLabel(cachedAgeDays)}</Text>
        </View>
      </View>
    </GlassView>
  );
}
