import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import {
  Building2,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Shirt,
  User,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

// ─── Reporting Instructions (Day-1 Tips) ───────────────────────

const REPORT_TIPS = [
  'Bring 5 copies of your orders',
  'Report in uniform of the day',
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

  // Day 1: override uniform to seasonal dress uniform
  const daysOnStation = useMemo(() => {
    if (!activeOrder?.reportNLT) return 0;
    const report = new Date(activeOrder.reportNLT);
    const today = new Date();
    report.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - report.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff + 1);
  }, [activeOrder?.reportNLT]);

  const displayUniform = useMemo(() => {
    if (daysOnStation === 1) {
      const month = new Date().getMonth(); // 0-indexed
      // Oct(9)–Mar(2) = Blues, Apr(3)–Sep(8) = Whites
      return month >= 3 && month <= 8 ? 'Service Dress Whites' : 'Service Dress Blues';
    }
    return uniformOfDay?.trim() || null;
  }, [daysOnStation, uniformOfDay]);

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
        intensity={75}
        tint={isDark ? 'dark' : 'light'}
        className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10"
      >
        {/* Header */}
        <View className="bg-blue-50/30 dark:bg-blue-900/20 px-5 py-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 items-center justify-center mr-3">
              <Building2 size={22} color={isDark ? '#93c5fd' : '#2563eb'} strokeWidth={2.2} />
            </View>
            <View className="flex-1">
              <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-300">
                Base Welcome Kit
              </Text>
              <Text className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                {name}
              </Text>
              {address && (
                <Text
                  className="mt-0.5 text-xs text-slate-500 dark:text-slate-400"
                  numberOfLines={2}
                >
                  {address}
                </Text>
              )}
            </View>
            {/* Status chip — CHECK IN (tappable) */}
            <ScalePressable
              onPress={() => router.push('/pcs-wizard/check-in' as any)}
              className="bg-green-600/90 dark:bg-green-700/80 rounded-lg px-2.5 py-1.5 ml-2"
              accessibilityRole="button"
              accessibilityLabel="Go to check-in flow"
            >
              <Text className="text-[11px] font-black text-white tracking-wide">
                CHECK IN
              </Text>
            </ScalePressable>
          </View>
        </View>

        {/* Content */}
        <View className="p-5" style={{ gap: 14 }}>
          {/* Uniform of the Day */}
          {displayUniform && (
            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center">
                <Shirt size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {daysOnStation === 1 ? 'Report In' : 'Uniform of the Day'}
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
              className="bg-green-50 dark:bg-green-900/20 rounded-lg px-3.5 py-3 border border-green-200 dark:border-green-800/40"
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

          {/* Command Sponsor — Elevated Card */}
          {hasSponsor && (
            <View style={{ gap: 10 }}>
              <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-400">
                Command Sponsor
              </Text>

              <View className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3.5 border border-amber-200 dark:border-amber-800/40">
                {/* Sponsor identity */}
                <View className="flex-row items-center mb-2.5">
                  <View className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/40 items-center justify-center mr-2.5">
                    <User size={20} color={isDark ? '#fcd34d' : '#b45309'} strokeWidth={2.2} />
                  </View>
                  <View className="flex-1">
                    {sponsor?.name && (
                      <Text className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        {sponsor.name}
                      </Text>
                    )}

                  </View>
                </View>

                {/* Contact actions */}
                <View style={{ gap: 6 }}>
                  {sponsor?.phone && (
                    <ScalePressable
                      onPress={() => handlePhonePress(sponsor.phone!)}
                      className="flex-row items-center justify-between bg-amber-100/60 dark:bg-amber-900/30 rounded-md px-3 py-2.5"
                      style={{ minHeight: 44 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${sponsor.name}`}
                    >
                      <View className="flex-row items-center">
                        <Phone size={14} color={isDark ? '#fcd34d' : '#92400e'} strokeWidth={2.2} />
                        <Text className="ml-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          Call
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {sponsor.phone}
                      </Text>
                    </ScalePressable>
                  )}

                  {sponsor?.email && (
                    <ScalePressable
                      onPress={() => handleEmailPress(sponsor.email!)}
                      className="flex-row items-center justify-between bg-amber-100/60 dark:bg-amber-900/30 rounded-md px-3 py-2.5"
                      style={{ minHeight: 44 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Email ${sponsor.name}`}
                    >
                      <View className="flex-row items-center">
                        <Mail size={14} color={isDark ? '#fcd34d' : '#92400e'} strokeWidth={2.2} />
                        <Text className="ml-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                          Email
                        </Text>
                      </View>
                      <Text className="text-sm font-bold text-amber-700 dark:text-amber-300">
                        {sponsor.email}
                      </Text>
                    </ScalePressable>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* Quarterdeck Phone */}
          {quarterdeckPhone && (
            <ScalePressable
              onPress={() => handlePhonePress(quarterdeckPhone)}
              className="bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3.5 py-3 border border-blue-200 dark:border-blue-800/40 flex-row items-center justify-between"
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
          <View className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200/60 dark:border-blue-800/30">
            <View className="flex-row items-center mb-3">
              <ClipboardList size={18} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-[1.4px] text-blue-800 dark:text-blue-300">
                Reporting Instructions
              </Text>
            </View>
            <View style={{ gap: 8 }}>
              {REPORT_TIPS.map((tip, i) => (
                <View key={i} className="flex-row items-start">
                  <View className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center mr-2.5 mt-px">
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
