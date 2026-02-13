import { ScalePressable } from '@/components/ScalePressable';
import { GlassView } from '@/components/ui/GlassView';
import { usePCSStore } from '@/store/usePCSStore';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { TriangleAlert } from 'lucide-react-native';
import React from 'react';
import { Platform, Text, View, useColorScheme } from 'react-native';

interface ObliservBannerProps {
  variant?: 'full' | 'widget';
}

export const ObliservBanner = ({ variant = 'full' }: ObliservBannerProps) => {
  const obliserv = usePCSStore((state) => state.financials.obliserv);
  const updateFinancials = usePCSStore((state) => state.updateFinancials);
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  if (!obliserv.required || obliserv.status === 'COMPLETE') return null;

  // ── Full Variant (original design, unchanged) ─────────────────────
  if (variant === 'full') {
    const handleAction = () => {
      updateFinancials((prev) => ({
        obliserv: {
          ...prev.obliserv,
          status: 'COMPLETE',
        },
      }));
    };

    return (
      <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <View className="flex-row items-center mb-2">
          <TriangleAlert size={20} color="#DC2626" />
          <Text className="text-red-700 font-bold ml-2 text-base">
            Action Required: OBLISERV
          </Text>
        </View>

        <Text className="text-red-800 mb-4 leading-5">
          You need 14 months additional service to execute these orders.
        </Text>

        <View className="flex-row gap-3">
          <ScalePressable
            className="bg-red-600 px-4 py-3 rounded-lg flex-1 items-center active:bg-red-700"
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel="Intend to Reenlist"
          >
            <Text className="text-white font-semibold text-sm">Intend to Reenlist</Text>
          </ScalePressable>

          <ScalePressable
            className="bg-white border border-red-200 px-4 py-3 rounded-lg flex-1 items-center active:bg-red-50"
            onPress={handleAction}
            accessibilityRole="button"
            accessibilityLabel="Intend to Extend"
          >
            <Text className="text-red-700 font-semibold text-sm">Intend to Extend</Text>
          </ScalePressable>
        </View>
      </View>
    );
  }

  // ── Widget Variant (compact GlassView) ────────────────────────────
  const handleWidgetPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push('/pcs-wizard/financials/page-13-extension' as any);
  };

  return (
    <GlassView
      intensity={80}
      tint={isDark ? 'dark' : 'light'}
      className="rounded-2xl overflow-hidden border border-red-200/50 dark:border-red-900/50"
    >
      <View className="bg-red-50/30 dark:bg-red-900/20 p-3">
        <View className="flex-row items-center gap-3">
          {/* Icon Badge */}
          <View className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center">
            <TriangleAlert size={16} color={isDark ? '#FCA5A5' : '#DC2626'} />
          </View>

          {/* Text */}
          <View className="flex-1">
            <Text className="font-bold text-sm text-red-700 dark:text-red-300">
              OBLISERV Required
            </Text>
            <Text className="text-xs text-red-600/80 dark:text-red-400/80">
              14 months additional service needed
            </Text>
          </View>

          {/* Action Button */}
          <ScalePressable
            className="bg-red-600 dark:bg-red-700 px-4 py-2.5 rounded-lg"
            onPress={handleWidgetPress}
            accessibilityRole="button"
            accessibilityLabel="Route Page 13 Extension"
          >
            <Text className="text-white font-semibold text-xs">
              Page 13
            </Text>
          </ScalePressable>
        </View>
      </View>
    </GlassView>
  );
};
