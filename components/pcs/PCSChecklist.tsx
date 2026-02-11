import React from 'react';
import { View, Text } from 'react-native';
import { usePCSStore } from '@/store/usePCSStore';
import { Check } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import { ChecklistItem } from '@/types/pcs';

export const PCSChecklist = () => {
    const { checklist, activeOrder } = usePCSStore();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (!checklist.length) return null;

    // Helper to determine status category
    const getItemStatus = (item: ChecklistItem) => {
        if (item.status === 'COMPLETE') return 'completed';

        // Check if linked segment is locked
        if (item.segmentId && activeOrder) {
            const segment = activeOrder.segments.find(s => s.id === item.segmentId);
            if (segment && segment.status === 'LOCKED') {
                return 'upcoming';
            }
        }
        return 'action_required';
    };

    const groupedItems = checklist.reduce((acc, item) => {
        const status = getItemStatus(item);
        if (!acc[status]) acc[status] = [];
        acc[status].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    const renderGroup = (title: string, items: ChecklistItem[], isActionRequired = false) => {
        if (!items || items.length === 0) return null;

        return (
            <View className="mb-6">
                <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-1">
                    {title}
                </Text>
                <View className="bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                    {items.map((item, index) => {
                        const isLast = index === items.length - 1;
                        const isComplete = item.status === 'COMPLETE';

                        return (
                            <View key={item.id} className={`flex-row items-center p-4 ${!isLast ? 'border-b border-slate-100 dark:border-slate-700' : ''}`}>
                                <View className={`w-5 h-5 rounded-full border items-center justify-center mr-3 ${
                                    isComplete ? 'bg-green-500 border-green-500' :
                                    isActionRequired ? 'border-blue-500' :
                                    'border-slate-300 dark:border-slate-600'
                                }`}>
                                    {isComplete && <Check size={12} color="white" />}
                                    {isActionRequired && !isComplete && <View className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                </View>
                                <View className="flex-1">
                                    <Text className={`text-base font-medium ${
                                        isComplete ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'
                                    }`}>
                                        {item.label}
                                    </Text>
                                    <Text className="text-xs text-slate-400 uppercase mt-0.5">
                                        {item.category.replace('_', ' ')}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    return (
        <View className="px-4 pb-8">
            {renderGroup('Action Required', groupedItems['action_required'], true)}
            {renderGroup('Upcoming', groupedItems['upcoming'])}
            {renderGroup('Completed', groupedItems['completed'])}
        </View>
    );
};
