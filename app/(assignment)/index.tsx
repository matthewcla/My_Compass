import { ScalePressable } from '@/components/ScalePressable';
import DiscoveryEntryWidget from '@/components/assignment/DiscoveryEntryWidget';
import SlateSummaryWidget from '@/components/assignment/SlateSummaryWidget';
import { useRouter } from 'expo-router';
import { Clock } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AssignmentDashboard() {
    const router = useRouter();

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-slate-50 dark:bg-slate-950">

            {/* Header */}
            <View className="flex-row justify-between items-center px-6 py-4 bg-slate-50 dark:bg-slate-950">
                <Text className="text-3xl font-bold text-slate-900 dark:text-white">
                    Assignments
                </Text>

                <ScalePressable onPress={() => console.log('Navigate to History')}>
                    {/* Discrete History/Clock Icon - Slate-400 */}
                    <Clock size={24} color="#94a3b8" />
                </ScalePressable>
            </View>

            <ScrollView
                className="flex-1 bg-slate-50 dark:bg-slate-950"
                contentContainerStyle={{ padding: 24, gap: 20 }}
            >

                {/* Content */}
                <SlateSummaryWidget onPress={() => router.push('/(assignment)/cycle')} />

                <DiscoveryEntryWidget onPress={() => router.push('/(career)/discovery')} />

                {/* Footer Info */}
                <View className="mt-4 mb-8">
                    <Text className="text-center text-slate-400 text-sm">
                        Cycle 24-02 closes in 2 days.
                    </Text>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}
