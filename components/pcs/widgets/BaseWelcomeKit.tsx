import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import {
  Building2,
  ClipboardList,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Shirt,
  User,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Reporting Instructions (Day-1 Tips) ───────────────────────

const REPORT_TIPS = [
  'Bring the original copy of your orders',
  'Report in dress uniform',
  'Have your military ID / CAC ready',
  "Know your sponsor's contact info",
];

export function BaseWelcomeKit() {
  const activeOrder = useActiveOrder();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  if (!activeOrder) return null;

  const {
    name,
    address,
    uniformOfDay,
    quarterdeckPhone,
    quarterdeckLocation,
  } = activeOrder.gainingCommand;

  const sponsor = activeOrder.sponsor;
  const hasLocation = quarterdeckLocation?.latitude && quarterdeckLocation?.longitude;
  const hasSponsor = sponsor?.phone || sponsor?.email;

  const isDemoMode = useDemoStore((s) => s.isDemoMode);
  const demoTimeline = useDemoStore((s) => s.demoTimelineOverride);

  // Day 1: override uniform to seasonal dress uniform
  // Use demo timeline when available
  const daysOnStation = useMemo(() => {
    if (isDemoMode && demoTimeline && demoTimeline.daysOnStation > 0) {
      return demoTimeline.daysOnStation;
    }
    if (!activeOrder?.reportNLT) return 0;
    const report = new Date(activeOrder.reportNLT);
    const today = new Date();
    report.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [activeOrder?.reportNLT, isDemoMode, demoTimeline]);

  const displayUniform = useMemo(() => {
    const month = new Date().getMonth(); // 0-indexed
    // Oct(9)–Mar(2) = Blues, Apr(3)–Sep(8) = Whites
    return month >= 3 && month <= 8 ? 'Service Dress Whites' : 'Service Dress Blues';
  }, []);

  // ── Handlers ──────────────────────────────────────────────────

  const handleMapPress = async () => {
    if (!hasLocation) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    const { latitude, longitude } = quarterdeckLocation!;
    const url = Platform.select({
      ios: `maps:?q=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}`,
      web: `https://maps.google.com/?q=${latitude},${longitude}`,
    });

    try {
      if (url) await Linking.openURL(url);
    } catch {
      // Silently fail
    }
  };

  const handlePhonePress = async (phone: string) => {
    if (!phone) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      // Silently fail
    }
  };

  const handleEmailPress = async (email: string) => {
    if (!email) return;

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }

    try {
      await Linking.openURL(`mailto:${email}?subject=${encodeURIComponent('My Check-In')}`);
    } catch {
      // Silently fail
    }
  };


  return (
    <Animated.View entering={FadeInDown.delay(50).springify()}>
      <GlassView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        className="rounded-2xl overflow-hidden mx-4 mb-8"
        style={{
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
        }}
      >
        {/* Header */}
        <View className="bg-slate-900/5 dark:bg-slate-900/70 p-5 pb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-white/10 dark:bg-slate-800/60 border border-slate-200/20 items-center justify-center mr-3">
              <Building2 size={22} color={isDark ? '#93c5fd' : '#2563eb'} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-600 dark:text-slate-300">
                Base Welcome Kit
              </Text>
              <Text className="mt-0.5 text-base font-bold text-slate-800 dark:text-white">
                {name}
              </Text>
              {address && (
                <Text
                  className="mt-0.5 text-xs text-slate-400"
                  numberOfLines={2}
                >
                  {address}
                </Text>
              )}
            </View>
            {/* Status chip — CHECK IN (tappable) */}
            <ScalePressable
              onPress={() => router.push('/pcs/check-in' as any)}
              className="bg-green-500/20 border border-green-500/30 rounded-lg px-2.5 py-1.5 ml-2"
              accessibilityRole="button"
              accessibilityLabel="Go to check-in flow"
            >
              <Text className="text-[11px] font-black text-green-400 tracking-wide">
                CHECK IN
              </Text>
            </ScalePressable>
          </View>
        </View>

        {/* Content */}
        <View className="bg-white/40 dark:bg-slate-950/40 px-5 pt-4 pb-4 border-t border-slate-200/50 dark:border-slate-700/50" style={{ gap: 14 }}>
          {/* Uniform of the Day */}
          {displayUniform && (
            <View className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700/60">
              <View className="flex-row items-center">
                <Shirt size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reporting Uniform
                </Text>
              </View>
              <Text className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                {displayUniform}
              </Text>
            </View>
          )}

          {/* Navigate to Quarterdeck */}
          {hasLocation && (
            <ScalePressable
              onPress={handleMapPress}
              className="bg-green-500/10 rounded-lg px-3.5 py-3 border border-green-500/20"
              style={{ minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Navigate to Quarterdeck"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <MapPin size={18} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                  <Text className="ml-2 text-sm font-semibold text-green-700 dark:text-green-300">
                    Navigate to Quarterdeck
                  </Text>
                </View>
                <Text className="text-xs text-green-600 dark:text-green-400">Get Directions</Text>
              </View>
            </ScalePressable>
          )}

          {/* Command Sponsor — Compact Inline (matches Hero Banner) */}
          {hasSponsor && (
            <View style={{ gap: 10 }}>
              <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-400">
                Command Sponsor
              </Text>

              <View className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700/60">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 items-center justify-center mr-3">
                    <User size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                  </View>

                  <View className="flex-1">
                    {sponsor?.name && (
                      <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                        {sponsor.name}
                      </Text>
                    )}
                    <Text className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Command Sponsor
                    </Text>
                  </View>

                  {/* Compact contact icon buttons */}
                  <View className="flex-row gap-2">
                    {sponsor?.phone && (
                      <ScalePressable
                        onPress={() => handlePhonePress(sponsor.phone!)}
                        className="w-9 h-9 rounded-full bg-green-500/10 items-center justify-center border border-green-500/20"
                        accessibilityRole="button"
                        accessibilityLabel={`Call ${sponsor.name}`}
                      >
                        <Phone size={14} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                      </ScalePressable>
                    )}
                    {sponsor?.phone && (
                      <ScalePressable
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
                          }
                          Linking.openURL(`sms:${sponsor.phone}`).catch(() => undefined);
                        }}
                        className="w-9 h-9 rounded-full bg-blue-500/10 items-center justify-center border border-blue-500/20"
                        accessibilityRole="button"
                        accessibilityLabel={`Text ${sponsor.name}`}
                      >
                        <MessageSquare size={14} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                      </ScalePressable>
                    )}
                    {sponsor?.email && (
                      <ScalePressable
                        onPress={() => handleEmailPress(sponsor.email!)}
                        className="w-9 h-9 rounded-full bg-slate-500/10 items-center justify-center border border-slate-500/20"
                        accessibilityRole="button"
                        accessibilityLabel={`Email ${sponsor.name}`}
                      >
                        <Mail size={14} color={isDark ? '#cbd5e1' : '#475569'} strokeWidth={2.2} />
                      </ScalePressable>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Quarterdeck Phone */}
          {quarterdeckPhone && (
            <ScalePressable
              onPress={() => handlePhonePress(quarterdeckPhone)}
              className="bg-blue-500/10 rounded-lg px-3.5 py-3 border border-blue-500/20 flex-row items-center justify-between"
              style={{ minHeight: 44 }}
              accessibilityRole="button"
              accessibilityLabel="Call Quarterdeck"
            >
              <View className="flex-row items-center">
                <Phone size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                <Text className="ml-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  Quarterdeck
                </Text>
              </View>
              <Text className="text-sm font-bold text-blue-700 dark:text-blue-300">{quarterdeckPhone}</Text>
            </ScalePressable>
          )}

          {/* Reporting Instructions */}
          <View className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
            <View className="flex-row items-center mb-3">
              <ClipboardList size={18} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-[1.4px] text-blue-800 dark:text-blue-300">
                Reporting Instructions
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {REPORT_TIPS.map((tip, i) => (
                <View key={i} className="flex-row items-start">
                  <View className="w-5 h-5 rounded-full bg-blue-500/20 items-center justify-center mr-2.5 mt-px">
                    <Text className="text-[10px] font-black text-blue-700 dark:text-blue-300">{i + 1}</Text>
                  </View>
                  <Text className="text-sm font-medium text-slate-800 dark:text-slate-200 flex-1">
                    {tip}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
}
