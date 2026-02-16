import { LeaveBalanceCard } from '@/components/LeaveBalanceCard';
import { ObliservBanner } from '@/components/pcs/financials/ObliservBanner';
import { ScreenGradient } from '@/components/ScreenGradient';
import { SyncStatus } from '@/components/SyncStatusBadge';
import Colors from '@/constants/Colors';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useCurrentProfile } from '@/store/useDemoStore';
import { useLeaveStore } from '@/store/useLeaveStore';
import { usePCSStore } from '@/store/usePCSStore';
import { LeaveRequest } from '@/types/schema';
import { Link, useRouter } from 'expo-router';
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import React, { useEffect, useMemo } from 'react';
import { FlatList, Pressable, Text, View, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminScreen() {
    const insets = useSafeAreaInsets();
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const router = useRouter();
    const currentUser = useCurrentProfile();
    const userId = currentUser?.id ?? 'user-123';
    const {
        leaveBalance,
        leaveRequests,
        fetchLeaveData,
        isSyncingRequests
    } = useLeaveStore();
    const obliserv = usePCSStore(state => state.financials.obliserv);

    useScreenHeader("MY ADMIN", "Leave & Actions", undefined, null, {
        icon: ChevronLeft,
        onPress: () => router.back()
    });

    useEffect(() => {
        fetchLeaveData(userId);
    }, [userId]);

    const requestsList = useMemo(() => Object.values(leaveRequests).sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
    ), [leaveRequests]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'denied': return 'bg-red-100 text-red-800';
            default: return 'bg-systemGray6 text-labelPrimary';
        }
    };

    // Determine Sync Status
    const syncStatus = useMemo((): SyncStatus => {
        if (isSyncingRequests) return 'pending_upload';
        const hasError = requestsList.some(r => r.syncStatus === 'error');
        if (hasError) return 'error';
        return 'synced';
    }, [isSyncingRequests, requestsList]);

    const renderHeader = () => (
        <View>
            {/* Pending Actions — OBLISERV */}
            {obliserv.required && obliserv.status !== 'COMPLETE' && (
                <View className="mb-6">
                    <Text className="text-xs font-black tracking-[2px] uppercase text-slate-400 dark:text-slate-500 mb-3">
                        Pending Actions
                    </Text>
                    <ObliservBanner variant="full" />
                </View>
            )}

            {/* Balance Card */}
            {leaveBalance ? (
                <LeaveBalanceCard
                    daysAvailable={leaveBalance.currentBalance}
                    useOrLose={leaveBalance.useOrLoseDays}
                    projectedBalance={leaveBalance.projectedEndOfYearBalance}
                />
            ) : (
                <View className="bg-white dark:bg-slate-900 h-48 rounded-xl items-center justify-center mb-4 border border-gray-200 dark:border-gray-800">
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

            {/* Requests List Header */}
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-slate-900 dark:text-white">Recent Requests</Text>
                <Link href="/leave/history" asChild>
                    <Pressable>
                        <Text className="text-systemBlue font-medium">View All</Text>
                    </Pressable>
                </Link>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View className="bg-white dark:bg-slate-900 rounded-xl p-8 items-center border border-dashed border-gray-300 dark:border-gray-700">
            <Calendar size={48} color={themeColors.tabIconDefault} className="mb-2" strokeWidth={1.5} />
            <Text className="text-labelSecondary text-center">No recent leave requests</Text>
        </View>
    );

    const renderItem = ({ item: req, index }: { item: LeaveRequest, index: number }) => {
        const isFirst = index === 0;
        const isLast = index === requestsList.length - 1;

        // Container styles
        let containerClass = "flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border-l border-r border-gray-200 dark:border-gray-800";
        if (isFirst) containerClass += " rounded-t-xl border-t";
        if (isLast) containerClass += " rounded-b-xl border-b";

        // Separator logic: if not last, add a border bottom that is lighter
        if (!isLast) containerClass += " border-b border-b-gray-100 dark:border-b-gray-800";

        return (
            <Pressable
                className={containerClass}
                onPress={() => router.push(`/leave/${req.id}`)}
            >
                <View>
                    <View className="flex-row items-center mb-1">
                        <Text className="font-semibold text-slate-900 dark:text-white text-base mr-2">
                            {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                        </Text>
                    </View>
                    <Text className="text-slate-500 dark:text-slate-400 text-xs capitalize">{req.leaveType}</Text>
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
        );
    };



    return (
        <ScreenGradient>
            {/* <ScreenHeader
                title="MY ADMIN"
                subtitle="Leave & Actions"
            /> */}
            <FlatList
                className="flex-1"
                contentContainerStyle={{
                    paddingTop: 0,
                    paddingBottom: 24,
                    paddingHorizontal: 20
                }}
                showsVerticalScrollIndicator={false}
                data={requestsList}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader}
                ListEmptyComponent={renderEmpty}
            />
        </ScreenGradient>
    );
}
