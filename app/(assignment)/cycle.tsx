import { useScreenHeader } from '@/hooks/useScreenHeader';
import { RotateCcw } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MyCycleScreen() {
    const insets = useSafeAreaInsets();
    // Default mock data for the view
    const cycleId = "24-02";
    const status = "Open";

    useScreenHeader("MY CYCLE", `Cycle ${cycleId} • ${status}`);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            {/* <ScreenHeader title="MY CYCLE" subtitle={`Cycle ${cycleId} • ${status}`} /> */}

            <View className="flex-1 items-center justify-center p-8">
                <View className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 items-center justify-center mb-4">
                    <RotateCcw size={32} className="text-slate-400" color="#94a3b8" />
                </View>
                <Text className="text-lg font-bold text-slate-900 dark:text-white mb-2">Cycle Applications</Text>
                <Text className="text-center text-slate-500 dark:text-slate-400">
                    This is where you will review your applications and maximize your chances for Cycle {cycleId}.
                </Text>
            </View>
        </View>
    );
}
