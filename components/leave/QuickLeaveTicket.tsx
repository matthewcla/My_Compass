import { GlassCalendarModal } from '@/components/ui/GlassCalendarModal';
import { SignatureButton } from '@/components/ui/SignatureButton';
import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { LeaveRequest } from '@/types/schema';
import { format } from 'date-fns';
import { MapPin, Phone, Shield, Triangle, Zap } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Pressable, Text, TouchableOpacity, View, useColorScheme } from 'react-native';

interface QuickLeaveTicketProps {
    draft: LeaveRequest;
    onSubmit: () => void;
    onEdit: () => void;
}

export function QuickLeaveTicket({ draft, onSubmit, onEdit }: QuickLeaveTicketProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    const submitRequest = useLeaveStore((state) => state.submitRequest);
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);

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
            // Use displayAddress for validation if draft address is empty
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
                memberRemarks: draft.memberRemarks,
                startTime: format(startDate, 'HH:mm'),
                endTime: format(endDate, 'HH:mm'),
                leaveInConus: draft.leaveInConus,
            };

            await submitRequest(payload, draft.userId);
            onSubmit();
        } catch (error) {
            console.error('Quick Submit Error:', error);
            Alert.alert('Error', 'Failed to submit leave request. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const daysCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <View className="mx-4 my-auto">
            {/* Glass Cockpit Card */}
            <View
                className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl bg-white/95 dark:bg-black/85"
                style={{ shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 30 }}
            >
                {/* Status Indicator Strip (Left) */}
                <View className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />

                {/* Header Section */}
                <View className="flex-row items-center justify-between p-4 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <View className="flex-row items-center gap-2">
                        <Shield size={16} color={isDark ? "#60a5fa" : "#3b82f6"} />
                        <Text className="text-blue-600 dark:text-blue-400 font-bold text-xs tracking-[0.2em] uppercase">
                            QUICK LEAVE REQUEST
                        </Text>
                    </View>

                    {/* Balance HUD */}
                    <View className="flex-row items-center gap-2 bg-slate-200/50 dark:bg-white/10 px-2 py-1 rounded border border-slate-300/50 dark:border-white/10">
                        <Zap size={10} color={isDark ? "#fbbf24" : "#d97706"} fill={isDark ? "#fbbf24" : "#d97706"} />
                        <Text className="text-slate-600 dark:text-amber-400 text-[10px] font-bold tracking-wider">
                            {leaveBalance?.currentBalance ?? 30.0} DAYS
                        </Text>
                    </View>
                </View>

                {/* Main Data Grid */}
                <View className="p-5 gap-6">
                    {/* Primary: Dates */}
                    <View className="flex-row items-baseline justify-between z-10">
                        <View>
                            <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                                Duration
                            </Text>
                            <View className="flex-row items-baseline gap-2">
                                <Text className="text-slate-900 dark:text-white text-3xl font-mono font-medium tracking-tight">
                                    {daysCount}
                                </Text>
                                <Text className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase">
                                    DAYS
                                </Text>
                            </View>
                        </View>

                        <View className="items-end">
                            <Text className="text-slate-500 dark:text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">
                                Period
                            </Text>
                            <View className="flex-row items-center gap-2">
                                <TouchableOpacity
                                    onPress={() => setShowStartPicker(true)}
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        borderColor: showStartPicker ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                                        borderWidth: 1,
                                    }}
                                >
                                    <Text className="text-slate-900 dark:text-white text-xl font-mono font-medium">
                                        {format(startDate, 'dd MMM')}
                                    </Text>
                                </TouchableOpacity>

                                <Triangle size={10} color={isDark ? "#94a3b8" : "#64748b"} rotation={90} fill={isDark ? "#94a3b8" : "#64748b"} />

                                <TouchableOpacity
                                    onPress={() => setShowEndPicker(true)}
                                    style={{
                                        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                                        paddingHorizontal: 8,
                                        paddingVertical: 2,
                                        borderRadius: 4,
                                        borderColor: showEndPicker ? '#3b82f6' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'),
                                        borderWidth: 1,
                                    }}
                                >
                                    <Text className="text-slate-900 dark:text-white text-xl font-mono font-medium">
                                        {format(endDate, 'dd MMM')}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Secondary: Location (Full Width now) */}
                    <View className="p-3 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/5 gap-2 -z-10">
                        <View className="flex-row justify-between items-center">
                            <Text className="text-slate-500 dark:text-slate-500 text-[10px] uppercase font-bold tracking-wider">Location</Text>
                            <Pressable onPress={onEdit} hitSlop={10}>
                                <MapPin size={12} color={!draft.leaveAddress ? '#ef4444' : (isDark ? '#60a5fa' : '#3b82f6')} />
                            </Pressable>
                        </View>
                        <Text className={`font-semibold ${!draft.leaveAddress ? 'text-red-500 italic' : 'text-slate-900 dark:text-white'}`} numberOfLines={1}>
                            {displayAddress}
                        </Text>
                    </View>

                    {/* Emergency Contact Line */}
                    <View className="flex-row items-center gap-3 p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-black/20 -z-10">
                        <Phone size={14} color={isDark ? "#94a3b8" : "#64748b"} />
                        <View className="flex-1 flex-row items-center justify-between">
                            <View>
                                <Text className="text-slate-500 text-[10px] uppercase font-bold">Emergency</Text>
                                <Text className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{draft.emergencyContact?.name || "None Set"}</Text>
                            </View>
                            <Pressable onPress={onEdit}>
                                <Text className="text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">EDIT</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Footer Action */}
                <View className="p-4 bg-slate-100/50 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 -z-10">
                    <SignatureButton
                        onSign={handleSign}
                        isSubmitting={isSubmitting}
                    />
                </View>

            </View>

            {/* Glass Calendar Modals */}
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
        </View >
    );
}
