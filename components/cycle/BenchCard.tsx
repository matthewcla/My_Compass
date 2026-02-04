import { Colors } from '@/constants/Colors';
import { Billet } from '@/types/schema';
import { Briefcase, MapPin, Sparkles } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface BenchCardProps {
    billet: Billet;
    type: 'manifest' | 'suggestion';
    onPress?: () => void;
}

export const BenchCard: React.FC<BenchCardProps> = ({ billet, type, onPress }) => {
    const isSuggestion = type === 'suggestion';

    const containerStyle = isSuggestion
        ? 'bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 opacity-90'
        : 'bg-white dark:bg-slate-800 border-solid border-slate-200 dark:border-slate-700';

    return (
        <TouchableOpacity
            onPress={onPress}
            className={`w-40 mr-3 p-3 rounded-xl border ${containerStyle} justify-between flex-col h-32 shadow-sm`}
        >
            {/* HEADER */}
            <View>
                <View className="flex-row items-center justify-between mb-2">
                    <View className="bg-slate-100 dark:bg-slate-700 p-1 rounded-md">
                        <Briefcase size={14} color={Colors.light.systemGray} />
                    </View>
                    {isSuggestion && (
                        <View className="bg-purple-100 dark:bg-purple-900 px-1.5 py-0.5 rounded-full flex-row items-center">
                            <Sparkles size={10} color="#a855f7" />
                            <Text className="text-[9px] font-bold text-purple-600 dark:text-purple-300 ml-0.5">AI PICK</Text>
                        </View>
                    )}
                </View>

                <Text className="font-bold text-slate-900 dark:text-white text-sm leading-tight mb-1" numberOfLines={2}>
                    {billet.title}
                </Text>
            </View>

            {/* FOOTER */}
            <View>
                <View className="flex-row items-center mb-1">
                    <MapPin size={10} color={Colors.gray[400]} />
                    <Text className="text-xs text-slate-500 dark:text-slate-400 ml-1" numberOfLines={1}>
                        {billet.location}
                    </Text>
                </View>

                {/* Match Score */}
                {billet.compass?.matchScore && (
                    <Text className="text-xs font-semibold text-green-600 dark:text-green-400">
                        {billet.compass.matchScore}% Match
                    </Text>
                )}
            </View>
        </TouchableOpacity>
    );
};
