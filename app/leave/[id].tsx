import { useColorScheme } from '@/components/useColorScheme';
import { useLeaveStore } from '@/store/useLeaveStore';
import { format } from 'date-fns';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Calendar, FileText, MapPin } from 'lucide-react-native';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LeaveDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const request = useLeaveStore(state => state.leaveRequests[id!]);
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const cancelRequest = useLeaveStore(state => state.cancelRequest);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (!request) {
        return (
            <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Stack.Screen options={{ headerTitle: 'Not Found' }} />
                <Text className="text-slate-500 font-bold">Request not found</Text>
                <Pressable onPress={() => router.back()} className="mt-4 p-3 bg-blue-600 rounded-lg">
                    <Text className="text-white font-bold">Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30';
            case 'pending': return 'text-sky-600 dark:text-sky-400 bg-sky-100 dark:bg-sky-900/30';
            case 'returned': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
            default: return 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800';
        }
    };

    const statusStyle = getStatusColor(request.status);

    return (
        <View className="flex-1 bg-slate-50 dark:bg-slate-950">
            <Stack.Screen options={{
                headerTitle: 'Leave Details',
                headerStyle: { backgroundColor: isDark ? '#0f172a' : '#fff' },
                headerTintColor: isDark ? '#fff' : '#0f172a',
                headerShadowVisible: false,
                headerLeft: () => (
                    <Pressable onPress={() => router.back()} className="mr-4">
                        <ArrowLeft size={24} color={isDark ? '#fff' : '#0f172a'} />
                    </Pressable>
                ),
            }} />

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
                {/* Header Card */}
                <View className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                    <View className="flex-row justify-between items-start mb-4">
                        <View>
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Status</Text>
                            <View className={`px-3 py-1.5 rounded-full self-start ${statusStyle.split(' ').slice(2).join(' ')}`}>
                                <Text className={`text-xs font-bold uppercase ${statusStyle.split(' ').slice(0, 2).join(' ')}`}>
                                    {request.status}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Days</Text>
                            <Text className="text-2xl font-bold text-slate-900 dark:text-white">{request.chargeDays}</Text>
                        </View>
                    </View>

                    <View className="flex-row items-center gap-3 mb-2">
                        <Calendar size={18} className="text-slate-400" color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text className="text-lg font-semibold text-slate-900 dark:text-white">
                            {format(new Date(request.startDate), 'MMM d, yyyy')} - {format(new Date(request.endDate), 'MMM d, yyyy')}
                        </Text>
                    </View>
                    <Text className="text-sm text-slate-500 ml-8 capitalize">{request.leaveType.replace('_', ' ')} Leave</Text>
                </View>

                {/* Details Section */}
                <View className="space-y-4">
                    <View className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <View className="flex-row items-center gap-2 mb-3">
                            <MapPin size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                            <Text className="text-sm font-bold text-slate-900 dark:text-white">Leave Address</Text>
                        </View>
                        <Text className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6">
                            {request.leaveAddress}
                        </Text>
                    </View>

                    {request.memberRemarks && (
                        <View className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <View className="flex-row items-center gap-2 mb-3">
                                <FileText size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                                <Text className="text-sm font-bold text-slate-900 dark:text-white">Remarks</Text>
                            </View>
                            <Text className="text-slate-600 dark:text-slate-300 leading-relaxed pl-6 italic">
                                "{request.memberRemarks}"
                            </Text>
                        </View>
                    )}
                </View>

                {/* Actions (if pending/draft) */}
                {request.status === 'pending' && (
                    <View className="mt-8">
                        <Pressable
                            onPress={() => {
                                Alert.alert(
                                    "Cancel Request",
                                    "Are you sure you want to cancel this leave request?",
                                    [
                                        { text: "No", style: "cancel" },
                                        {
                                            text: "Yes, Cancel",
                                            style: 'destructive',
                                            onPress: async () => {
                                                await cancelRequest(request.id);
                                                router.back();
                                            }
                                        }
                                    ]
                                );
                            }}
                            className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl items-center border border-red-100 dark:border-red-900/50"
                        >
                            <Text className="text-red-600 dark:text-red-400 font-bold">Cancel Request</Text>
                        </Pressable>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}
