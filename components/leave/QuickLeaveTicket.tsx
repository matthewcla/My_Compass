import { GlassCalendarModal } from '@/components/ui/GlassCalendarModal';
import { SignatureButton } from '@/components/ui/SignatureButton';
import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { LeaveRequest } from '@/types/schema';
import { formatDays } from '@/utils/formatDays';
import { projectLeaveBalance } from '@/utils/leaveProjection';
import { format } from 'date-fns';
import { MapPin, Phone, Triangle, X } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface QuickLeaveTicketProps {
    draft: LeaveRequest;
    onSubmit: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function QuickLeaveTicket({ draft, onSubmit, onEdit, onClose }: QuickLeaveTicketProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    const submitRequest = useLeaveStore((state) => state.submitRequest);
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);
    const leaveRequests = useLeaveStore((state) => state.leaveRequests);

    const [startDate, setStartDate] = useState(new Date(draft.startDate));
    const [endDate, setEndDate] = useState(new Date(draft.endDate));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dummy Default Address if missing
    const displayAddress = draft.leaveAddress || "123 Sailor Blvd, Norfolk, VA";

    // Date Picker State
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const onStartDateChange = (selectedDate: Date) => {
        setStartDate(selectedDate);
        if (endDate < selectedDate) {
            setEndDate(selectedDate);
        }
    };

    const onEndDateChange = (selectedDate: Date) => {
        setEndDate(selectedDate);
    };

    const handleSign = async () => {
        setIsSubmitting(true);
        try {
            const finalAddress = draft.leaveAddress || displayAddress;

            if (!finalAddress || !draft.leavePhoneNumber || !draft.emergencyContact) {
                Alert.alert('Missing Info', 'Some required information is missing. Please edit the full request.');
                setIsSubmitting(false);
                return;
            }

            const payload: CreateLeaveRequestPayload = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                leaveType: draft.leaveType,
                leaveAddress: finalAddress,
                leavePhoneNumber: draft.leavePhoneNumber,
                emergencyContact: draft.emergencyContact,
                dutySection: draft.dutySection,
                deptDiv: draft.deptDiv,
                dutyPhone: draft.dutyPhone,
                rationStatus: draft.rationStatus,
                modeOfTravel: draft.modeOfTravel,
                destinationCountry: draft.destinationCountry,
                memberRemarks: draft.memberRemarks ?? undefined,
                startTime: format(startDate, 'HH:mm'),
                endTime: format(endDate, 'HH:mm'),
                leaveInConus: draft.leaveInConus,
            };

            await submitRequest(payload, draft.userId);
            onSubmit();
        } catch (error) {
            console.error('Quick Submit Error:', error);
            Alert.alert('Error', 'Failed to submit leave request. Please try again.');
            setIsSubmitting(false);
        }
    };

    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    // --- Projection ---
    const projection = useMemo(() => {
        const balance = leaveBalance?.currentBalance ?? 30;
        const maxCarryOver = leaveBalance?.maxCarryOver ?? 60;
        const allRequests = Object.values(leaveRequests);

        return projectLeaveBalance({
            currentBalance: balance,
            maxCarryOver,
            departureDate: startDate,
            returnDate: endDate,
            chargeableDays: daysCount,
            leaveType: draft.leaveType,
            allRequests,
            currentRequestId: draft.id,
        });
    }, [startDate, endDate, daysCount, draft.leaveType, draft.id, leaveBalance, leaveRequests]);

    return (
        <View style={{ alignSelf: 'stretch', marginHorizontal: 20 }}>
            {/* Glass Cockpit Card */}
            <View
                className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xl bg-white dark:bg-slate-800"
                style={{ shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 40, elevation: 10 }}
            >
                {/* Status Indicator Strip (Left) */}
                <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />

                {/* Header */}
                <View className="flex-row items-center justify-between p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs tracking-widest uppercase">
                        QUICK LEAVE REQUEST
                    </Text>
                    <Pressable
                        onPress={onClose}
                        className="p-1 rounded-full bg-slate-200/50 dark:bg-white/10 active:opacity-70"
                        hitSlop={8}
                    >
                        <X size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                    </Pressable>
                </View>

                {/* Main Content */}
                <View className="p-5 gap-5">

                    {/* Hero: Date Pills (centered) */}
                    <View className="items-center gap-2">
                        <View className="flex-row items-center gap-3">
                            <TouchableOpacity
                                onPress={() => setShowStartPicker(true)}
                                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200/70 dark:border-slate-600/40"
                            >
                                <Text className="text-slate-900 dark:text-white text-lg font-mono font-semibold tracking-tight">
                                    {format(startDate, 'dd MMM')}
                                </Text>
                            </TouchableOpacity>

                            <Triangle size={8} color={isDark ? "#94a3b8" : "#64748b"} rotation={90} fill={isDark ? "#94a3b8" : "#64748b"} />

                            <TouchableOpacity
                                onPress={() => setShowEndPicker(true)}
                                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200/70 dark:border-slate-600/40"
                            >
                                <Text className="text-slate-900 dark:text-white text-lg font-mono font-semibold tracking-tight">
                                    {format(endDate, 'dd MMM')}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Chargeable days subtitle */}
                        <Text className="text-slate-400 dark:text-slate-500 text-xs font-medium">
                            {daysCount} chargeable {daysCount === 1 ? 'day' : 'days'}
                        </Text>
                    </View>

                    {/* Projection Strip: Avail | Charge | Remain */}
                    <View className="flex-row items-center justify-between bg-slate-50 dark:bg-slate-700/30 rounded-xl px-3 py-3 border border-slate-200/70 dark:border-slate-600/30">
                        {projection.isUnchargeable ? (
                            <View className="flex-1 items-center">
                                <Text className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                    No charge to leave balance
                                </Text>
                            </View>
                        ) : (
                            <>
                                {/* Available */}
                                <View className="flex-1 items-center">
                                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        Avail
                                    </Text>
                                    <Text className="text-green-600 dark:text-green-400 text-xl font-mono font-bold">
                                        {formatDays(projection.availableOnDeparture)}
                                    </Text>
                                </View>

                                {/* Divider */}
                                <View className="h-8 w-[1px] bg-slate-200 dark:bg-slate-600" />

                                {/* Charge */}
                                <View className="flex-1 items-center">
                                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        Charge
                                    </Text>
                                    <Text className="text-slate-900 dark:text-white text-xl font-mono font-bold">
                                        {daysCount}.0
                                    </Text>
                                </View>

                                {/* Divider */}
                                <View className="h-8 w-[1px] bg-slate-200 dark:bg-slate-600" />

                                {/* Remaining */}
                                <View className="flex-1 items-center">
                                    <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                                        Remain
                                    </Text>
                                    <Text className={`text-xl font-mono font-bold ${projection.isOverdraft ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                                        {formatDays(projection.remainingOnReturn)}
                                    </Text>
                                </View>
                            </>
                        )}
                    </View>

                    {/* Secondary Information */}
                    <View className="gap-4">
                        {/* Location */}
                        <View className="flex-row items-center gap-3">
                            <View className="w-7 h-7 rounded-full items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                                <MapPin size={14} color={!draft.leaveAddress ? '#ef4444' : (isDark ? '#60a5fa' : '#3b82f6')} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-center mb-0.5">
                                    <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Location</Text>
                                    <Pressable onPress={onEdit} hitSlop={10}>
                                        <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">CHANGE</Text>
                                    </Pressable>
                                </View>
                                <Text className={`text-sm font-medium ${!draft.leaveAddress ? 'text-red-500 italic' : 'text-slate-900 dark:text-slate-200'}`} numberOfLines={1}>
                                    {displayAddress}
                                </Text>
                            </View>
                        </View>

                        {/* Emergency Contact */}
                        <View className="flex-row items-center gap-3">
                            <View className="w-7 h-7 rounded-full items-center justify-center bg-slate-100 dark:bg-slate-700/50">
                                <Phone size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                            </View>
                            <View className="flex-1">
                                <View className="flex-row justify-between items-center mb-0.5">
                                    <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Emergency</Text>
                                    <Pressable onPress={onEdit} hitSlop={10}>
                                        <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold">EDIT</Text>
                                    </Pressable>
                                </View>
                                <Text className="text-slate-900 dark:text-slate-200 text-sm font-medium">
                                    {draft.emergencyContact?.name || "None Set"}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Footer Action */}
                <View className="p-4 bg-slate-50 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-700 -z-10">
                    <SignatureButton
                        onSign={handleSign}
                        isSubmitting={isSubmitting}
                    />
                </View>
            </View>

            {/* Glass Calendar Modals */}
            <GlassCalendarModal
                visible={showStartPicker}
                onClose={() => setShowStartPicker(false)}
                onSelect={onStartDateChange}
                selectedDate={startDate}
                minDate={new Date()}
                title="Select Start Date"
            />

            <GlassCalendarModal
                visible={showEndPicker}
                onClose={() => setShowEndPicker(false)}
                onSelect={onEndDateChange}
                selectedDate={endDate}
                minDate={startDate}
                title="Select End Date"
            />
        </View>
    );
}
