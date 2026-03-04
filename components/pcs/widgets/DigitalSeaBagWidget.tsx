import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { Anchor, Archive, Ship } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export function DigitalSeaBagWidget() {
    const isDark = useColorScheme() === 'dark';

    return (
        <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-2xl p-5 shadow-sm border border-black/5 dark:border-white/10 mb-6 mt-2">
            <View className="items-center mb-6 mt-4">
                <View className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mb-4">
                    <Anchor size={28} color={isDark ? '#60a5fa' : '#3b82f6'} />
                </View>
                <Text className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">
                    Digital Sea Bag
                </Text>
                <Text className="text-xs text-slate-500 dark:text-slate-400 text-center leading-5 max-w-[280px]">
                    Your active orders and past move history are stored securely here.
                </Text>
            </View>

            <View className="gap-3">
                <View className="bg-black/5 dark:bg-white/10 rounded-xl p-4 border border-black/5 dark:border-white/10">
                    <View className="flex-row items-center gap-3 mb-2">
                        <View className="w-8 h-8 rounded-full bg-green-500/10 items-center justify-center">
                            <Ship size={16} color={isDark ? '#4ade80' : '#16a34a'} />
                        </View>
                        <Text className="text-sm font-bold text-slate-900 dark:text-white">Ready to Move</Text>
                    </View>
                    <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        When your next set of orders are issued, we'll build your tailored moving checklist right here.
                    </Text>
                </View>

                {/* Entry point to the actual Archive Grid Screen */}
                <TouchableOpacity
                    onPress={() => Alert.alert('Past Moves', 'Archive grid coming soon to the profile menu.')}
                    className="bg-black/5 dark:bg-white/10 rounded-xl p-4 border border-black/5 dark:border-white/10 flex-row items-center"
                    activeOpacity={0.7}
                >
                    <View className="flex-1">
                        <View className="flex-row items-center gap-3 mb-2">
                            <View className="w-8 h-8 rounded-full bg-amber-500/10 items-center justify-center">
                                <Archive size={16} color={isDark ? '#fbbf24' : '#d97706'} />
                            </View>
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">Past Moves</Text>
                        </View>
                        <Text className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            Access your completed moves, travel claims, and uploaded receipts.
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </GlassView>
    );
}
