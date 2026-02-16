import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ClipboardList,
  Mail,
  MapPin,
  Phone,
  Shirt,
  User,
} from 'lucide-react-native';
import React, { useState } from 'react';
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
  const [tipsExpanded, setTipsExpanded] = useState(false);

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
  const hasUniform = uniformOfDay?.trim();
  const hasSponsor = sponsor?.phone || sponsor?.email;

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
      await Linking.openURL(`mailto:${email}`);
    } catch {
      // Silently fail
    }
  };

  const handleCheckInPress = async () => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => undefined);
    }
    router.push('/pcs-wizard/check-in' as any);
  };

  const toggleTips = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }
    setTipsExpanded((prev) => !prev);
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
            {/* Status chip — CHECK IN */}
            <View className="bg-green-600/90 dark:bg-green-700/80 rounded-lg px-2.5 py-1.5 ml-2">
              <Text className="text-[11px] font-black text-white tracking-wide">
                CHECK IN
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View className="p-5" style={{ gap: 14 }}>
          {/* Uniform of the Day */}
          {hasUniform && (
            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 border border-slate-200 dark:border-slate-700">
              <View className="flex-row items-center">
                <Shirt size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Uniform of the Day
                </Text>
              </View>
              <Text className="mt-1.5 text-base font-bold text-slate-900 dark:text-white">
                {uniformOfDay}
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
                      <Text className="text-xs text-amber-600 dark:text-amber-400">
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
                      <Text className="text-xs text-amber-600 dark:text-amber-400">
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
              <Text className="text-xs text-blue-600 dark:text-blue-400">{quarterdeckPhone}</Text>
            </ScalePressable>
          )}

          {/* Reporting Instructions (Collapsible) */}
          <View>
            <ScalePressable
              onPress={toggleTips}
              className="flex-row items-center justify-between py-1"
              accessibilityRole="button"
              accessibilityLabel={tipsExpanded ? 'Collapse reporting instructions' : 'Expand reporting instructions'}
            >
              <View className="flex-row items-center">
                <ClipboardList size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Reporting Instructions
                </Text>
              </View>
              {tipsExpanded
                ? <ChevronUp size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                : <ChevronDown size={16} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
              }
            </ScalePressable>

            {tipsExpanded && (
              <Animated.View entering={FadeInDown.duration(200)}>
                <View className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3.5 mt-2 border border-slate-200 dark:border-slate-700">
                  {REPORT_TIPS.map((tip, i) => (
                    <View key={i} className="flex-row items-start" style={{ marginBottom: i < REPORT_TIPS.length - 1 ? 8 : 0 }}>
                      <Text className="text-xs text-slate-400 dark:text-slate-500 mr-2 mt-px">•</Text>
                      <Text className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                        {tip}
                      </Text>
                    </View>
                  ))}
                </View>
              </Animated.View>
            )}
          </View>

          {/* Check In CTA */}
          <ScalePressable
            onPress={handleCheckInPress}
            className="bg-blue-600 dark:bg-blue-500 rounded-lg p-3.5 flex-row items-center justify-between"
            accessibilityRole="button"
            accessibilityLabel="Begin Command Check-In"
          >
            <Text className="text-base font-bold text-white">
              Begin Check-In
            </Text>
            <ChevronRight size={20} color="#ffffff" strokeWidth={2.5} />
          </ScalePressable>
        </View>
      </GlassView>
    </Animated.View>
  );
}
