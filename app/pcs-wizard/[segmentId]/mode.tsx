import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { usePCSStore } from '@/store/usePCSStore';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Car, Plane, Shuffle, ChevronLeft } from 'lucide-react-native';
import { PCSSegmentMode } from '@/types/pcs';

const MODE_OPTIONS: { mode: PCSSegmentMode; label: string; icon: any; description: string }[] = [
  {
    mode: 'POV',
    label: 'POV (Privately Owned Vehicle)',
    icon: Car,
    description: 'Drive your own car. Reimbursement per mile + Per Diem.',
  },
  {
    mode: 'AIR',
    label: 'Commercial Air',
    icon: Plane,
    description: 'Fly via government procurement. Quickest option.',
  },
  {
    mode: 'MIXED',
    label: 'Mixed Mode',
    icon: Shuffle,
    description: 'Drive part of the way, fly the rest. Flexible.',
  },
];

export default function ModeSelectionScreen() {
  const router = useRouter();
  const currentDraft = usePCSStore((state) => state.currentDraft);
  const updateDraft = usePCSStore((state) => state.updateDraft);

  const handleSelect = (mode: PCSSegmentMode) => {
    if (!currentDraft) return;

    updateDraft({
        userPlan: {
            ...currentDraft.userPlan,
            mode: mode,
        }
    });

    if (mode === 'POV') {
        router.push('./pov-details');
    } else {
        router.push('./dependents');
    }
  };

  if (!currentDraft) return null;

  return (
    <View className="flex-1 bg-slate-50 dark:bg-slate-950">
      <ScreenHeader
        title="Travel Mode"
        subtitle="Step 2 of 3: Mode"
        leftAction={{ icon: ChevronLeft, onPress: () => router.back() }}
      />

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
            How will you travel?
        </Text>

        <View className="gap-4">
            {MODE_OPTIONS.map((option) => (
                <TouchableOpacity
                    key={option.mode}
                    onPress={() => handleSelect(option.mode)}
                    className={`p-4 rounded-xl border-2 flex-row items-center gap-4 ${
                        currentDraft.userPlan.mode === option.mode
                            ? 'bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500'
                            : 'bg-white border-transparent dark:bg-slate-900'
                    }`}
                >
                    <View className={`w-12 h-12 rounded-full items-center justify-center ${
                        currentDraft.userPlan.mode === option.mode
                            ? 'bg-blue-100 dark:bg-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800'
                    }`}>
                        <option.icon
                            size={24}
                            color={currentDraft.userPlan.mode === option.mode ? '#2563eb' : '#64748b'}
                        />
                    </View>
                    <View className="flex-1">
                        <Text className={`font-bold text-lg ${
                             currentDraft.userPlan.mode === option.mode ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'
                        }`}>
                            {option.label}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            {option.description}
                        </Text>
                    </View>
                </TouchableOpacity>
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
