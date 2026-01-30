import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { getShadow } from '@/utils/getShadow';
import { Star, ThumbsUp, X } from 'lucide-react-native';
import React from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface StatsCardProps {
    liked: number;
    superLiked: number;
    passed: number;
    onPressSuperLiked?: () => void;
}

export function StatsCard({ liked, superLiked, passed, onPressSuperLiked }: StatsCardProps) {
    const totalSaved = liked + superLiked;
    const radius = 12.5;
    const strokeWidth = Platform.OS === 'web' ? 6 : 4;
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Approximation of the donut visual
    return (
        <GlassView
            intensity={60}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-xl p-5 border border-slate-200/50 dark:border-slate-700/50 flex flex-col justify-between"
            style={getShadow({ shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 })}
        >
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-widest">My Shortlist</Text>
                    <View className="flex-row items-baseline gap-1 mt-0.5">
                        <Text className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{totalSaved}</Text>
                        <Text className="text-xs text-slate-400 font-medium">Billets Saved</Text>
                    </View>
                </View>

                {/* Mini Donut Chart Representation */}
                <View className="w-8 h-8 flex items-center justify-center relative">
                    <Svg height="32" width="32" viewBox="0 0 32 32">
                        {/* Background Circle */}
                        <Circle
                            cx="16"
                            cy="16"
                            r={radius}
                            stroke={isDark ? "#334155" : "#F1F5F9"}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        {/* Foreground Arc (Emerald-500) */}
                        <Circle
                            cx="16"
                            cy="16"
                            r={radius}
                            stroke="#10B981"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            strokeDasharray={`${Math.PI * radius}, ${Math.PI * radius}`}
                            strokeDashoffset={0}
                            rotation="-90"
                            origin="16, 16"
                            strokeLinecap="round"
                        />
                    </Svg>
                    <View className="absolute inset-0 flex items-center justify-center w-full h-full">
                        <Text className="text-[10px] font-bold text-slate-400">14</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row gap-4 h-14">
                <Pressable
                    onPress={onPressSuperLiked}
                    hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    className="flex-1 bg-rose-50 dark:bg-rose-500/20 rounded-lg flex flex-col items-center justify-center border border-rose-100/50 dark:border-rose-500/30 h-full gap-1"
                >
                    <Star size={18} color="#F43F5E" fill="#F43F5E" className="text-rose-500" />
                    <Text className="text-xs font-bold text-rose-700 dark:text-rose-300 leading-none">{superLiked}</Text>
                </Pressable>
                <Pressable
                    hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    className="flex-1 bg-blue-50 dark:bg-blue-500/20 rounded-lg flex flex-col items-center justify-center border border-blue-100/50 dark:border-blue-500/30 h-full gap-1"
                >
                    <ThumbsUp size={18} color="#3B82F6" className="text-blue-500" />
                    <Text className="text-xs font-bold text-blue-700 dark:text-blue-300 leading-none">{liked}</Text>
                </Pressable>
                <Pressable
                    hitSlop={{ top: 15, bottom: 15, left: 10, right: 10 }}
                    style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                    className="flex-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg flex flex-col items-center justify-center border border-slate-200/50 dark:border-slate-600/50 h-full gap-1"
                >
                    <X size={18} color={isDark ? "#94A3B8" : "#64748B"} className="text-slate-500" />
                    <Text className="text-xs font-bold text-slate-600 dark:text-slate-300 leading-none">{passed}</Text>
                </Pressable>
            </View>
        </GlassView>
    );
}
