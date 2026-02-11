import React, { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenGradient } from '@/components/ScreenGradient';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { ProfileConfirmationCard } from '@/components/pcs/ProfileConfirmationCard';
import { SegmentTimeline } from '@/components/pcs/SegmentTimeline';
import { usePCSStore } from '@/store/usePCSStore';
import { Check, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'react-native';

export default function PcsScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    useScreenHeader("My PCS", "Relocation Manager");

    const { checklist, initializeOrders, activeOrder } = usePCSStore();

    useEffect(() => {
        // Initialize if empty, but check if we need to force reset or just load mock
        if (!activeOrder) {
            initializeOrders();
        }
    }, [activeOrder, initializeOrders]);

    return (
        <ScreenGradient>
            <ScrollView
                contentContainerStyle={{
                    paddingTop: 24, // Spacing below header
                    paddingBottom: insets.bottom + 100, // Clear TabBar
                    paddingHorizontal: 16
                }}
                showsVerticalScrollIndicator={false}
            >
                <ProfileConfirmationCard />

                <SegmentTimeline />

                <View className="bg-white dark:bg-slate-800 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <Text className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Checklist</Text>

                    {checklist.map((item, index) => {
                        const isComplete = item.status === 'COMPLETE';
                        return (
                            <View key={item.id} className={`flex-row items-center py-3 ${index < checklist.length - 1 ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                    isComplete ? 'bg-green-500 border-green-500' : 'border-slate-300 dark:border-slate-600'
                                }`}>
                                    {isComplete && <Check size={14} color="white" />}
                                </View>

                                <View className="flex-1">
                                    <Text className={`text-base font-medium ${isComplete ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
                                        {item.label}
                                    </Text>
                                    <Text className="text-xs text-slate-400 uppercase mt-0.5">
                                        {item.category.replace('_', ' ')}
                                    </Text>
                                </View>

                                <ChevronRight size={20} color={isDark ? '#64748b' : '#94a3b8'} />
                            </View>
                        );
                    })}
                </View>
            </ScrollView>
        </ScreenGradient>
    );
}
