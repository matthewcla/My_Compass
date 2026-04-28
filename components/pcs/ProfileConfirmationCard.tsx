import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useUserStore } from '@/store/useUserStore';
import { usePCSStore } from '@/store/usePCSStore';

export const ProfileConfirmationCard = () => {
  const user = useUserStore((state) => state.user);
  const { checklist, setChecklistItemStatus } = usePCSStore();

  const confirmationItem = checklist.find((item) => item.label === 'Profile Confirmation');

  if (!confirmationItem || confirmationItem.status === 'COMPLETE') {
    return null;
  }

  const handleConfirm = () => {
    setChecklistItemStatus(confirmationItem.id, 'COMPLETE');
  };

  return (
    <View className="bg-white dark:bg-slate-800 rounded-xl p-6 mb-6 shadow-sm mx-4 border border-slate-200 dark:border-slate-700">
      <Text className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
        Here's what we have on file...
      </Text>

      <View className="mb-6 space-y-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-500 dark:text-slate-400 text-base">Rank</Text>
          <Text className="font-semibold text-slate-900 dark:text-white text-base">{user?.rank || 'Unknown'}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-500 dark:text-slate-400 text-base">Name</Text>
          <Text className="font-semibold text-slate-900 dark:text-white text-base">{user?.displayName || 'Unknown'}</Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-slate-500 dark:text-slate-400 text-base">Dependents</Text>
          <Text className="font-semibold text-slate-900 dark:text-white text-base">{user?.dependents ?? 'None'}</Text>
        </View>
      </View>

      <Pressable
        onPress={handleConfirm}
        className="bg-blue-600 rounded-lg py-3 items-center active:bg-blue-700"
      >
        <Text className="text-white font-bold text-lg">Confirm & Start</Text>
      </Pressable>
    </View>
  );
};
