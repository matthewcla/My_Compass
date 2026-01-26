import { Star, ThumbsUp, X } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface StatsCardProps {
    liked: number;
    superLiked: number;
    passed: number;
    onPressSuperLiked?: () => void;
}

export function StatsCard({ liked, superLiked, passed, onPressSuperLiked }: StatsCardProps) {
    const totalSaved = liked + superLiked;
    const radius = 14;
    const strokeWidth = 3;
    // Approximation of the donut visual - in a real app this would likely be calculated based on data
    // The mockup had a static hardcoded visual, so we will replicate that "look" loosely:
    // "border-slate-50 border-r-emerald-500 border-t-emerald-500" 
    // This implies about 50% emerald (top and right) and 50% slate (bottom and left).

    return (
        <View className="bg-white rounded-xl p-3 shadow-sm border border-slate-100 mb-3 flex flex-col justify-between" style={{ elevation: 2 }}>
            <View className="flex-row justify-between items-start mb-2">
                <View>
                    <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">My Shortlist</Text>
                    <View className="flex-row items-baseline gap-1 mt-0.5">
                        <Text className="text-xl font-bold text-slate-800 tracking-tight">{totalSaved}</Text>
                        <Text className="text-[10px] text-slate-400 font-medium">Billets Saved</Text>
                    </View>
                </View>

                {/* Mini Donut Chart Representation */}
                <View className="w-8 h-8 flex items-center justify-center relative">
                    <Svg height="32" width="32" viewBox="0 0 32 32">
                        {/* Background Circle (Slate-50) */}
                        <Circle
                            cx="16"
                            cy="16"
                            r={radius}
                            stroke="#F8FAFC"
                            strokeWidth={strokeWidth}
                            fill="transparent"
                        />
                        {/* Foreground Arc (Emerald-500) - approx 50% dasharray */}
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
                        <Text className="text-[9px] font-bold text-slate-400">14</Text>
                    </View>
                </View>
            </View>

            <View className="flex-row gap-2">
                <TouchableOpacity onPress={onPressSuperLiked} activeOpacity={0.7} className="flex-1 bg-rose-50 rounded-lg py-1.5 flex flex-col items-center justify-center border border-rose-100/50">
                    <Star size={14} color="#F43F5E" fill="#F43F5E" className="text-rose-500 mb-0.5" />
                    <Text className="text-[10px] font-bold text-rose-700 leading-none">{superLiked}</Text>
                </TouchableOpacity>
                <View className="flex-1 bg-blue-50 rounded-lg py-1.5 flex flex-col items-center justify-center border border-blue-100/50">
                    <ThumbsUp size={14} color="#3B82F6" className="text-blue-500 mb-0.5" />
                    <Text className="text-[10px] font-bold text-blue-700 leading-none">{liked}</Text>
                </View>
                <View className="flex-1 bg-slate-100 rounded-lg py-1.5 flex flex-col items-center justify-center border border-slate-200/50">
                    <X size={14} color="#64748B" className="text-slate-500 mb-0.5" />
                    <Text className="text-[10px] font-bold text-slate-600 leading-none">{passed}</Text>
                </View>
            </View>
        </View>
    );
}
