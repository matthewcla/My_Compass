import { LeaveBalanceCard } from '@/components/LeaveBalanceCard';
import { SyncStatus, SyncStatusBadge } from '@/components/SyncStatusBadge';
import { useLeaveStore } from '@/store/useLeaveStore';
import { Link, useRouter } from 'expo-router';
import { Calculator, Calendar, ChevronRight, Plus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export default function AdminScreen() {
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
            default: return 'bg-gray-100 text-gray-800';
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
        <ScrollView className="flex-1 bg-slate-50">
            <View className="px-5 py-6">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-2xl font-bold text-slate-900">My Leave</Text>
                    <View className="flex-row items-center space-x-2 gap-2">
                        <SyncStatusBadge status={getSyncStatus()} />
                        <Pressable className="bg-slate-200 p-2 rounded-full">
                            <Calculator size={20} color="#64748b" />
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
                    <View className="bg-white h-48 rounded-xl items-center justify-center mb-4">
                        <Text className="text-slate-400">Loading balance...</Text>
                    </View>
                )}

                {/* Actions */}
                <Link href="/leave/request" asChild>
                    <Pressable className="flex-row items-center justify-center bg-blue-600 py-4 rounded-xl shadow-sm mb-8 active:opacity-90">
                        <Plus color="white" size={24} className="mr-2" />
                        <Text className="text-white font-semibold text-lg">Request Leave</Text>
                    </Pressable>
                </Link>

                {/* Requests List */}
                <View>
                    <View className="flex-row justify-between items-center mb-4">
                        <Text className="text-lg font-bold text-slate-900">Recent Requests</Text>
                        <Link href="/leave/history" asChild>
                            <Pressable>
                                <Text className="text-blue-600 font-medium">View All</Text>
                            </Pressable>
                        </Link>
                    </View>

                    {requestsList.length === 0 ? (
                        <View className="bg-white rounded-xl p-8 items-center border border-dashed border-gray-300">
                            <Calendar size={48} color="#cbd5e1" className="mb-2" />
                            <Text className="text-slate-400 text-center">No recent leave requests</Text>
                        </View>
                    ) : (
                        <View className="bg-white rounded-xl overflow-hidden border border-gray-100">
                            {requestsList.map((req, index) => (
                                <View key={req.id}>
                                    <Pressable
                                        className={`flex-row items-center justify-between p-4 ${index !== requestsList.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        onPress={() => router.push(`/leave/${req.id}`)}
                                    >
                                        <View>
                                            <View className="flex-row items-center mb-1">
                                                <Text className="font-semibold text-slate-900 text-base mr-2">
                                                    {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                                </Text>
                                            </View>
                                            <Text className="text-slate-500 text-xs capitalize">{req.leaveType}</Text>
                                        </View>

                                        <View className="flex-row items-center">
                                            <View className={`px-2 py-1 rounded-md mr-3 ${getStatusColor(req.status).split(' ')[0]}`}>
                                                <Text className={`text-xs font-medium capitalize ${getStatusColor(req.status).split(' ')[1]}`}>
                                                    {req.status}
                                                </Text>
                                            </View>
                                            <ChevronRight size={20} color="#cbd5e1" />
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
