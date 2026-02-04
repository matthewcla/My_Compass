import { Colors } from '@/constants/Colors';
import { SmartBenchItem } from '@/store/useAssignmentStore';
import { Billet } from '@/types/schema';
import { ArrowRight } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { BenchCard } from './BenchCard';

interface ManifestRailProps {
    items: SmartBenchItem[];
    onSelect: (billet: Billet) => void;
    onSeeAll?: () => void;
}

export const ManifestRail: React.FC<ManifestRailProps> = React.memo(({ items, onSelect, onSeeAll }) => {

    const renderItem = useCallback(({ item }: { item: SmartBenchItem }) => (
        <BenchCard
            billet={item.billet}
            type={item.type}
            onPress={() => onSelect(item.billet)}
        />
    ), [onSelect]);

    const renderFooter = () => (
        <TouchableOpacity
            onPress={onSeeAll}
            className="w-40 mr-3 p-3 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 justify-center items-center h-32 bg-slate-50 dark:bg-slate-900/50"
        >
            <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mb-2">
                <ArrowRight size={20} color={Colors.light.systemGray} />
            </View>
            <Text className="text-slate-500 dark:text-slate-400 font-medium text-sm">Find More</Text>
        </TouchableOpacity>
    );

    if (!items || items.length === 0) {
        return (
            <View className="h-32 justify-center items-center border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                <Text className="text-slate-400 font-medium">Your bench is empty.</Text>
                <Text className="text-slate-400 text-xs mt-1">Swipe on jobs to add them here.</Text>
            </View>
        )
    }

    return (
        <View className="min-h-[140px]">
            <FlatList
                data={items}
                renderItem={renderItem}
                horizontal
                showsHorizontalScrollIndicator={false}
                ListFooterComponent={renderFooter}
                keyExtractor={(item) => item.billet.id}
                contentContainerStyle={{ paddingRight: 20 }}
            />
        </View>
    );
});
