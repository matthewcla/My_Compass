import { ScalePressable } from '@/components/ScalePressable';
import { useColorScheme } from '@/components/useColorScheme';
import { GlassView } from '@/components/ui/GlassView';
import { useActiveOrder } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { Building2, MapPin, Phone, Shirt } from 'lucide-react-native';
import React from 'react';
import { Linking, Platform, Text, View } from 'react-native';

export function BaseWelcomeKit() {
  const activeOrder = useActiveOrder();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  if (!activeOrder) return null;

  const {
    name,
    address,
    uniformOfDay,
    quarterdeckPhone,
    psdPhone,
    oodPhone,
    quarterdeckLocation,
  } = activeOrder.gainingCommand;

  const hasLocation = quarterdeckLocation?.latitude && quarterdeckLocation?.longitude;
  const hasUniform = uniformOfDay?.trim();
  const hasContacts = quarterdeckPhone || psdPhone || oodPhone;

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

  return (
    <GlassView
      intensity={75}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10"
    >
      {/* Header */}
      <View className="bg-blue-50/30 dark:bg-blue-900/20 px-4 py-3.5">
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
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {address}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="p-4 space-y-3">
        {/* Uniform of the Day */}
        {hasUniform && (
          <View className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
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
            className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800/40"
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
              <Text className="text-xs text-green-600 dark:text-green-400">Open Maps</Text>
            </View>
          </ScalePressable>
        )}

        {/* Quick Contacts */}
        {hasContacts && (
          <View className="space-y-2">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-slate-500 dark:text-slate-400">
              Quick Contacts
            </Text>

            {oodPhone && (
              <ScalePressable
                onPress={() => handlePhonePress(oodPhone)}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/40 flex-row items-center justify-between"
                accessibilityRole="button"
                accessibilityLabel="Call Officer of the Deck"
                accessibilityHint="Calls Officer of the Deck"
              >
                <View className="flex-row items-center">
                  <Phone size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                  <Text className="ml-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Officer of the Deck
                  </Text>
                </View>
                <Text className="text-xs text-blue-600 dark:text-blue-400">{oodPhone}</Text>
              </ScalePressable>
            )}

            {psdPhone && (
              <ScalePressable
                onPress={() => handlePhonePress(psdPhone)}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/40 flex-row items-center justify-between"
                accessibilityRole="button"
                accessibilityLabel="Call Personnel Support Detachment"
              >
                <View className="flex-row items-center">
                  <Phone size={16} color={isDark ? '#93c5fd' : '#1d4ed8'} strokeWidth={2.2} />
                  <Text className="ml-2 text-sm font-semibold text-blue-700 dark:text-blue-300">
                    Personnel Support Detachment
                  </Text>
                </View>
                <Text className="text-xs text-blue-600 dark:text-blue-400">{psdPhone}</Text>
              </ScalePressable>
            )}

            {quarterdeckPhone && (
              <ScalePressable
                onPress={() => handlePhonePress(quarterdeckPhone)}
                className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800/40 flex-row items-center justify-between"
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
          </View>
        )}
      </View>
    </GlassView>
  );
}
