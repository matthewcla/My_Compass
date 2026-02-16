import { usePCSStore } from '@/store/usePCSStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin } from 'lucide-react-native';
import React from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

export default function TravelClaimDetail() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    // Read from unified PCS store — only the current draft is stored now
    const claim = usePCSStore((state) => state.travelClaim.draft?.id === id ? state.travelClaim.draft : null);
    const isDark = useColorScheme() === 'dark';

    if (!claim) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Text className="text-slate-500">Claim not found.</Text>
                <Pressable onPress={() => router.back()} className="mt-4">
                    <Text className="text-blue-500">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <Stack.Screen options={{
                title: 'Claim Details',
                headerLeft: () => (
                    <Pressable onPress={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
                    </Pressable>
                )
            }} />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                {/* Header Card */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                    <View className="flex-row items-center gap-3 mb-4">
                        <View className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
                            <MapPin size={24} className="text-blue-600 dark:text-blue-400" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-xl font-bold text-slate-900 dark:text-white">
                                {claim.destinationLocation}
                            </Text>
                            <Text className="text-sm text-slate-500 dark:text-slate-400">
                                {claim.travelType.toUpperCase()}
                            </Text>
                        </View>
                        <View className={`px-3 py-1 rounded-full ${getStatusColor(claim.status)}`}>
                            <Text className="text-white text-xs font-bold uppercase">{claim.status}</Text>
                        </View>
                    </View>

                    <View className="flex-row gap-4 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                        <View className="flex-1">
                            <Text className="text-xs text-slate-400 uppercase tracking-wider mb-1">Departure</Text>
                            <Text className="font-semibold text-slate-700 dark:text-slate-200">
                                {format(new Date(claim.departureDate), 'MMM d, yyyy')}
                            </Text>
                        </View>
                        <View className="flex-1 border-l border-slate-100 dark:border-slate-700/50 pl-4">
                            <Text className="text-xs text-slate-400 uppercase tracking-wider mb-1">Return</Text>
                            <Text className="font-semibold text-slate-700 dark:text-slate-200">
                                {format(new Date(claim.returnDate), 'MMM d, yyyy')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Financials */}
                <View className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-700 mb-4">
                    <Text className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Financial Summary</Text>

                    <Row label="Total Entitlements" value={claim.totalEntitlements} bold />
                    <Row label="Total Expenses" value={claim.totalExpenses} />
                    <Row label="Advance Received" value={claim.advanceAmount} negative />

                    <View className="h-px bg-slate-200 dark:bg-slate-700 my-3" />

                    <View className="flex-row justify-between items-center">
                        <Text className="text-base font-bold text-slate-900 dark:text-white">Net Payable</Text>
                        <Text className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(claim.netPayable)}
                        </Text>
                    </View>
                </View>

                {/* Actions */}
                {claim.status === 'draft' && (
                    <Pressable
                        onPress={() => router.push({ pathname: '/travel-claim/request', params: { draftId: claim.id } })}
                        className="bg-blue-600 rounded-xl py-4 items-center mb-4"
                    >
                        <Text className="text-white font-bold text-base">Continue Editing</Text>
                    </Pressable>
                )}

            </ScrollView>
        </View>
    );
}

function Row({ label, value, bold, negative }: any) {
    return (
        <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-600 dark:text-slate-400">{label}</Text>
            <Text className={`text-slate-900 dark:text-white ${bold ? 'font-bold' : ''} ${negative ? 'text-red-500' : ''}`}>
                {negative ? '-' : ''}{formatCurrency(value)}
            </Text>
        </View>
    )
}

function getStatusColor(status: string) {
    switch (status) {
        case 'draft': return 'bg-slate-400';
        case 'pending': return 'bg-amber-500';
        case 'approved': return 'bg-emerald-500';
        case 'returned': return 'bg-red-500';
        case 'paid': return 'bg-blue-500';
        default: return 'bg-slate-400';
    }
}
