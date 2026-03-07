import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
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
        className="rounded-[24px] overflow-hidden mx-4 mb-6 shadow-sm border border-black/5 dark:border-white/10"
      >
        <LinearGradient
          colors={isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.08)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        <View className="p-5">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-4 flex-1">
              <View className="w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-800/60 shadow-sm">
                <Building2 size={26} color={isDark ? '#60A5FA' : '#2563EB'} />
              </View>
              <View className="flex-1">
                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1}>{name}</Text>
                <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>Base Welcome Kit</Text>
              </View>
            </View>

            {/* Status chip — CHECK IN (tappable) */}
            <ScalePressable
              onPress={() => router.push('/pcs/check-in' as any)}
              className="bg-green-500/20 border border-green-500/30 rounded-[12px] px-3 py-1.5 ml-2"
              accessibilityRole="button"
              accessibilityLabel="Go to check-in flow"
            >
              <Text className="text-[11px] font-black text-green-600 dark:text-green-400 tracking-wide">
                CHECK IN
              </Text>
            </ScalePressable>
          </View>

          {/* Content */}
          <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5" style={{ gap: 14 }}>
            {/* Uniform of the Day */}
            {displayUniform && (
              <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200/60 dark:border-slate-700/60 flex-row items-center shadow-sm">
                <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center mr-3">
                  <Shirt size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                </View>
                <View className="flex-1">
                  <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Reporting Uniform
                  </Text>
                  <Text className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">
                    {displayUniform}
                  </Text>
                </View>
              </View>
            )}

            {/* Navigate to Quarterdeck */}
            {hasLocation && (
              <ScalePressable
                onPress={handleMapPress}
                className="bg-green-500/10 rounded-xl px-4 py-3 border border-green-500/20 shadow-sm"
                style={{ minHeight: 48 }}
                accessibilityRole="button"
                accessibilityLabel="Navigate to Quarterdeck"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <MapPin size={18} color={isDark ? '#86efac' : '#15803d'} strokeWidth={2.2} />
                    <Text className="ml-2 text-[15px] font-bold text-green-700 dark:text-green-300">
                      Navigate to Quarterdeck
                    </Text>
                  </View>
                  <Text className="text-[10px] uppercase font-bold text-green-600 dark:text-green-400 tracking-wider">Get Directions</Text>
                </View>
              </ScalePressable>
            )}

            {/* Command Sponsor — Compact Inline (matches Hero Banner) */}
            {hasSponsor && (
              <View style={{ gap: 10 }}>
                <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">
                  Command Sponsor
                </Text>

                <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 items-center justify-center mr-3">
                      <User size={18} color={isDark ? '#94a3b8' : '#64748b'} strokeWidth={2.2} />
                    </View>

                    <View className="flex-1">
                      {sponsor?.name && (
                        <Text className="text-sm font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                          {sponsor.name}
                        </Text>
                      )}
                      <Text className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
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
                className="bg-blue-500/10 rounded-xl px-4 py-3 border border-blue-500/20 flex-row items-center justify-between shadow-sm"
                style={{ minHeight: 48 }}
                accessibilityRole="button"
                accessibilityLabel="Call Quarterdeck"
              >
                <View className="flex-row items-center">
                  <Phone size={18} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                  <Text className="ml-2 text-[15px] font-bold text-blue-700 dark:text-blue-300">
                    Quarterdeck
                  </Text>
                </View>
                <Text className="text-[15px] font-bold text-blue-700 dark:text-blue-300 tracking-tight">{quarterdeckPhone}</Text>
              </ScalePressable>
            )}

            {/* Reporting Instructions */}
            <View className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20 shadow-sm mt-2">
              <View className="flex-row items-center mb-4">
                <ClipboardList size={18} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                <Text className="ml-2 text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
                  Reporting Instructions
                </Text>
              </View>
              <View style={{ gap: 12 }}>
                {REPORT_TIPS.map((tip, i) => (
                  <View key={i} className="flex-row items-start">
                    <View className="w-5 h-5 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                      <Text className="text-[10px] font-black text-blue-700 dark:text-blue-300">{i + 1}</Text>
                    </View>
                    <Text className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 flex-1 leading-5">
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </GlassView>
    </Animated.View>
  );
}
