import { LeaveBalanceCard } from '@/components/LeaveBalanceCard';
import { SyncStatus, SyncStatusBadge } from '@/components/SyncStatusBadge';
import { useLeaveStore } from '@/store/useLeaveStore';
import Colors from '@/constants/Colors';
import { Link, useRouter } from 'expo-router';
import { Calculator, Calendar, ChevronRight, Plus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';

export default function AdminScreen() {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const router = useRouter();
    const {
        leaveBalance,
        leaveRequests,
        fetchLeaveData,
        isSyncingRequests
    } = useLeaveStore();

    // Mock User ID for Phase 1
    const MOCK_USER_ID = 'user-123';

    useEffect(() => {
        fetchLeaveData(MOCK_USER_ID);
    }, []);

    const requestsList = Object.values(leaveRequests).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'denied': return 'bg-red-100 text-red-800';
            default: return 'bg-systemGray6 text-labelPrimary';
        }
    };

    // Determine Sync Status
    const getSyncStatus = (): SyncStatus => {
        if (isSyncingRequests) return 'pending_upload';
        const hasError = Object.values(leaveRequests).some(r => r.syncStatus === 'error');
        if (hasError) return 'error';
        return 'synced';
    };

    return (
        <ScrollView className="flex-1 bg-systemGray6">
            <View className="px-5 py-6">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-labelPrimary">My Leave</Text>
                    <View className="flex-row items-center space-x-2 gap-2">
                        <SyncStatusBadge status={getSyncStatus()} />
                        <Pressable className="bg-systemGray6 p-2 rounded-full">
                            <Calculator size={20} color={themeColors.labelSecondary} strokeWidth={1.5} />
                        </Pressable>
                    </View>
                </View>

                {/* Balance Card */}
                {leaveBalance ? (
                    <LeaveBalanceCard
                        daysAvailable={leaveBalance.currentBalance}
                        useOrLose={leaveBalance.useOrLoseDays}
                        projectedBalance={leaveBalance.projectedEndOfYearBalance}
                    />
                ) : (
                    <View className="bg-systemBackground h-48 rounded-xl items-center justify-center mb-4">
                        <Text className="text-labelSecondary">Loading balance...</Text>
                    </View>
                )}

                {/* Actions */}
                <Link href="/leave/request" asChild>
                    <Pressable className="flex-row items-center justify-center bg-systemBlue py-4 rounded-xl shadow-sm mb-8 active:opacity-90">
                        <Plus color="white" size={24} className="mr-2" strokeWidth={1.5} />
                        <Text className="text-white font-semibold text-lg">Request Leave</Text>
                    </Pressable>
                </Link>

                {/* Requests List */}
                <View>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-labelPrimary">Recent Requests</Text>
                        <Link href="/leave/history" asChild>
                            <Pressable>
                                <Text className="text-systemBlue font-medium">View All</Text>
                            </Pressable>
                        </Link>
                    </View>

                    {requestsList.length === 0 ? (
                        <View className="bg-systemBackground rounded-xl p-8 items-center border border-dashed border-systemGray6">
                            <Calendar size={48} color={themeColors.tabIconDefault} className="mb-2" strokeWidth={1.5} />
                            <Text className="text-labelSecondary text-center">No recent leave requests</Text>
                        </View>
                    ) : (
                        <View className="bg-systemBackground rounded-xl overflow-hidden border border-systemGray6">
                            {requestsList.map((req, index) => (
                                <View key={req.id}>
                                    <Pressable
                                        className={`flex-row items-center justify-between p-4 ${index !== requestsList.length - 1 ? 'border-b border-systemGray6' : ''}`}
                                        onPress={() => router.push(`/leave/${req.id}`)}
                                    >
                                        <View>
                                            <View className="flex-row items-center mb-1">
                                                <Text className="font-semibold text-labelPrimary text-base mr-2">
                                                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <Text className="text-labelSecondary text-xs capitalize">{req.leaveType}</Text>
                                        </View>

                                        <View className="flex-row items-center">
                                            <View className={`px-2 py-1 rounded-md mr-3 ${getStatusColor(req.status).split(' ')[0]}`}>
                                                <Text className={`text-xs font-medium capitalize ${getStatusColor(req.status).split(' ')[1]}`}>
                                                    {req.status}
                                                </Text>
                                            </View>
                                            <ChevronRight size={20} color={themeColors.tabIconDefault} strokeWidth={1.5} />
                                        </View>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        </ScrollView>
    );
}
