import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { LinearGradient } from 'expo-linear-gradient';
import { Anchor, ChevronRight } from 'lucide-react-native';
import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

export function DigitalSeaBagWidget() {
    const isDark = useColorScheme() === 'dark';

    return (
        <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => Alert.alert('Secure Vault', 'Digital Sea Bag access requires physical network connection.')}
            className="mb-6 mt-2"
        >
            <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10">
                <LinearGradient
                    colors={isDark ? ['#0F2027', '#203A43', '#2C5364'] : ['rgba(56,189,248,0.15)', 'rgba(56,189,248,0.02)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                />

                {/* Explicit 20px padding for Tap-to-Focus hit area */}
                <View style={{ padding: 20 }}>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-4 flex-1">
                            <View className="w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-sky-500/20 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-sky-400/30 shadow-sm">
                                <Anchor size={26} color={isDark ? '#38bdf8' : '#0284c7'} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5">
                                    Digital Sea Bag
                                </Text>
                                <Text className="text-slate-600 dark:text-sky-200/80 text-[13px] font-[500] leading-tight" numberOfLines={1}>
                                    Secure Official Documents Vault
                                </Text>
                            </View>
                        </View>
                        <View className="bg-black/5 dark:bg-white/10 w-9 h-9 rounded-full items-center justify-center">
                            <ChevronRight size={20} color={isDark ? '#bae6fd' : '#0ea5e9'} />
                        </View>
                    </View>
                </View>
            </GlassView>
        </TouchableOpacity>
    );
}
