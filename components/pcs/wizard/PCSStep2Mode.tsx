import { WizardCard } from '@/components/wizard/WizardCard';
import { usePCSStore } from '@/store/usePCSStore';
import { PCSSegmentMode } from '@/types/pcs';
import { Car, Plane, Shuffle } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

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

interface PCSStep2ModeProps {
    embedded?: boolean;
}

export function PCSStep2Mode({ embedded = false }: PCSStep2ModeProps) {
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
    };

    if (!currentDraft) return null;

    const content = (
        <View>
            <Text className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                How will you travel?
            </Text>

            <View className="gap-4">
                {MODE_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.mode}
                        onPress={() => handleSelect(option.mode)}
                        className={`p-4 rounded-xl border-2 flex-row items-center gap-4 ${currentDraft.userPlan.mode === option.mode
                            ? 'bg-blue-50 border-blue-600 dark:bg-blue-900/20 dark:border-blue-500'
                            : 'bg-white border-transparent dark:bg-slate-900'
                            }`}
                    >
                        <View className={`w-12 h-12 rounded-full items-center justify-center ${currentDraft.userPlan.mode === option.mode
                            ? 'bg-blue-100 dark:bg-blue-800'
                            : 'bg-slate-100 dark:bg-slate-800'
                            }`}>
                            <option.icon
                                size={24}
                                color={currentDraft.userPlan.mode === option.mode ? '#2563eb' : '#64748b'}
                            />
                        </View>
                        <View className="flex-1">
                            <Text className={`font-bold text-lg ${currentDraft.userPlan.mode === option.mode ? 'text-blue-700 dark:text-blue-400' : 'text-slate-900 dark:text-white'
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
        </View>
    );

    if (embedded) return content;

    return (
        <WizardCard title="Travel Mode" scrollable={false}>
            {content}
        </WizardCard>
    );
}
