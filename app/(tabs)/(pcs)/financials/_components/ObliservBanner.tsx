import React from 'react';
import { View, Text } from 'react-native';
import { usePCSStore } from '@/store/usePCSStore';
import { ScalePressable } from '@/components/ScalePressable';
import { TriangleAlert } from 'lucide-react-native';

export const ObliservBanner = () => {
  const obliserv = usePCSStore((state) => state.financials.obliserv);
  const updateFinancials = usePCSStore((state) => state.updateFinancials);

  if (!obliserv.required || obliserv.status === 'COMPLETE') return null;

  const handleAction = () => {
    // Mark as complete to simulate action resolution
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
};
