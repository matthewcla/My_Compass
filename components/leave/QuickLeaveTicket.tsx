
import { GlassView } from '@/components/ui/GlassView';
import { SignatureButton } from '@/components/ui/SignatureButton';
import Colors from '@/constants/Colors';
import { useLeaveStore } from '@/store/useLeaveStore';
import { CreateLeaveRequestPayload } from '@/types/api';
import { LeaveRequest } from '@/types/schema';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Calendar, Edit2, MapPin, Phone } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Platform, Pressable, Text, View, useColorScheme } from 'react-native';

interface QuickLeaveTicketProps {
    draft: LeaveRequest;
    onSubmit: () => void;
    onEdit: () => void;
}

export function QuickLeaveTicket({ draft, onSubmit, onEdit }: QuickLeaveTicketProps) {
    const colorScheme = useColorScheme() ?? 'light';
    const themeColors = Colors[colorScheme];
    const isDark = colorScheme === 'dark';

    const submitRequest = useLeaveStore((state) => state.submitRequest);

    const [startDate, setStartDate] = useState(new Date(draft.startDate));
    const [endDate, setEndDate] = useState(new Date(draft.endDate));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Date Picker State
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const handleSign = async () => {
        setIsSubmitting(true);
        try {
            // Construct payload from draft + current dates
            // Note: We assume draft has the required defaults.
            // If strictly enforcing schema, we might need validation here.
            // For "Smart Defaults", we trust they are present.

            if (!draft.leaveAddress || !draft.leavePhoneNumber || !draft.emergencyContact) {
                Alert.alert('Missing Info', 'Some required information is missing. Please edit the full request.');
                setIsSubmitting(false);
                return;
            }

            const payload: CreateLeaveRequestPayload = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                leaveType: draft.leaveType,
                leaveAddress: draft.leaveAddress,
                leavePhoneNumber: draft.leavePhoneNumber,
                emergencyContact: draft.emergencyContact,
                dutySection: draft.dutySection,
                deptDiv: draft.deptDiv,
                dutyPhone: draft.dutyPhone,
                rationStatus: draft.rationStatus,
                modeOfTravel: draft.modeOfTravel,
                destinationCountry: draft.destinationCountry,
                memberRemarks: draft.memberRemarks,
                // Add default times if not present in draft dates
                startTime: format(startDate, 'HH:mm'),
                endTime: format(endDate, 'HH:mm'),
                leaveInConus: draft.leaveInConus,
                normalWorkingHours: draft.normalWorkingHours,
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

    const onStartDateChange = (event: any, selectedDate?: Date) => {
        setShowStartPicker(Platform.OS === 'ios'); // Keep open on iOS if needed or close? usually standard behavior
        if (selectedDate) {
            setStartDate(selectedDate);
            // Auto-adjust end date if start is after end
            if (selectedDate > endDate) {
                const newEnd = new Date(selectedDate);
                newEnd.setDate(newEnd.getDate() + 1);
                setEndDate(newEnd);
            }
        }
        if (Platform.OS === 'android') setShowStartPicker(false);
    };

    const onEndDateChange = (event: any, selectedDate?: Date) => {
        setShowEndPicker(Platform.OS === 'ios');
        if (selectedDate) {
            setEndDate(selectedDate);
        }
        if (Platform.OS === 'android') setShowEndPicker(false);
    };

    return (
        <GlassView intensity={80} tint={isDark ? 'dark' : 'light'} className="p-0 rounded-3xl overflow-hidden mx-4 my-auto shadow-xl border border-white/20">
            {/* Header / Top Strip */}
            <View className="bg-blue-600 p-4 pt-6 items-center">
                <Text className="text-white font-bold text-sm uppercase tracking-widest opacity-80 mb-1">
                    Quick Leave Ticket
                </Text>
                <View className="flex-row items-center gap-2 mb-2">
                    <Calendar size={20} color="white" />
                    <Text className="text-white font-bold text-3xl">
                        {format(startDate, 'MMM dd')} - {format(endDate, 'MMM dd')}
                    </Text>
                    <Pressable
                        onPress={() => setShowStartPicker(true)}
                        className="bg-white/20 p-2 rounded-full ml-2 active:bg-white/30"
                        hitSlop={8}
                    >
                        <Edit2 size={16} color="white" />
                    </Pressable>
                </View>
                <Text className="text-blue-100 text-xs font-medium">
                    {draft.leaveType.toUpperCase()} • {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} DAYS
                </Text>
            </View>

            {/* Date Pickers (Hidden/Modal Logic) */}
            {(showStartPicker || showEndPicker) && (
                <View className="bg-slate-100 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
                    <Text className="text-xs font-bold text-slate-500 mb-2">ADJUST DATES</Text>
                    <View className="flex-row gap-4 justify-between">
                        <View>
                            <Text className="text-xs text-slate-400 mb-1">Start</Text>
                            <DateTimePicker
                                testID="dateTimePickerStart"
                                value={startDate}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onStartDateChange}
                                style={{ width: 120 }}
                            />
                        </View>
                        <View>
                            <Text className="text-xs text-slate-400 mb-1">End</Text>
                            <DateTimePicker
                                testID="dateTimePickerEnd"
                                value={endDate}
                                mode="date"
                                is24Hour={true}
                                display="default"
                                onChange={onEndDateChange}
                                minimumDate={startDate}
                                style={{ width: 120 }}
                            />
                        </View>
                    </View>
                    <Pressable
                        className="mt-4 self-end bg-blue-100 dark:bg-blue-900 px-4 py-2 rounded-lg"
                        onPress={() => { setShowStartPicker(false); setShowEndPicker(false); }}
                    >
                        <Text className="text-blue-700 dark:text-blue-300 font-bold text-xs">DONE</Text>
                    </Pressable>
                </View>
            )}

            {/* Middle: Defaults */}
            <View className="p-6 gap-6 bg-white/50 dark:bg-black/20">
                {/* Location */}
                <View className="flex-row gap-4">
                    <View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 items-center justify-center">
                        <MapPin size={20} color={themeColors.primary} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-0.5">Location</Text>
                        <Text className="text-slate-900 dark:text-slate-100 font-semibold text-base" numberOfLines={1}>
                            {draft.leaveAddress}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">
                            {draft.leavePhoneNumber}
                        </Text>
                    </View>
                </View>

                {/* Emergency Contact */}
                <View className="flex-row gap-4">
                    <View className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 items-center justify-center">
                        <Phone size={20} color={Colors.light.danger} />
                    </View>
                    <View className="flex-1">
                        <Text className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase mb-0.5">Emergency</Text>
                        <Text className="text-slate-900 dark:text-slate-100 font-semibold text-base" numberOfLines={1}>
                            {draft.emergencyContact?.name}
                        </Text>
                        <Text className="text-slate-500 dark:text-slate-400 text-sm">
                            {draft.emergencyContact?.relationship} • {draft.emergencyContact?.phoneNumber}
                        </Text>
                    </View>
                </View>

                {/* Edit Action */}
                <Pressable onPress={onEdit} className="self-center py-2 px-4 rounded-full active:bg-slate-100 dark:active:bg-slate-800">
                    <Text className="text-blue-600 dark:text-blue-400 font-semibold text-sm">
                        Not correct? Edit Details
                    </Text>
                </Pressable>
            </View>

            {/* Bottom: Sign */}
            <View className="p-6 pt-2 bg-white/50 dark:bg-black/20 pb-8">
                <SignatureButton
                    onSign={handleSign}
                    isSubmitting={isSubmitting}
                />
            </View>
        </GlassView>
    );
}
