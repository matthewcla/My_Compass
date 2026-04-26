import { SolidCalendarModal } from '@/components/ui/SolidCalendarModal';
import { SignatureButton } from '@/components/ui/SignatureButton';
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
    const submitRequest = useLeaveStore((state) => state.submitRequest);
    const isDark = (useColorScheme() ?? 'light') === 'dark';
    const leaveBalance = useLeaveStore((state) => state.leaveBalance);
    const leaveRequests = useLeaveStore((state) => state.leaveRequests);

    const [startDate, setStartDate] = useState(new Date(draft.startDate));
    const [endDate, setEndDate] = useState(new Date(draft.endDate));
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Date Picker State
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    // UX SPEC: Strict validation boolean instead of reactive alerts
    const isReadyToSign = Boolean(draft.leaveAddress && draft.leavePhoneNumber && draft.emergencyContact);

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
        if (!isReadyToSign) return;

        setIsSubmitting(true);
        try {
            const payload: CreateLeaveRequestPayload = {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                leaveType: draft.leaveType,
                leaveAddress: draft.leaveAddress!,
                leavePhoneNumber: draft.leavePhoneNumber!,
                emergencyContact: draft.emergencyContact!,
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

    const cardContent = (
        <>
            {/* Header: Removed Text Shadows, Added strict typographic hierarchy */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-0">
                <View className="flex-1">
                    <Text className="text-on-surface-variant font-bold text-[10px] tracking-[2px] uppercase mb-0.5">
                        QUICK TICKET
                    </Text>
                    <Text className="text-[20px] font-bold tracking-[-0.5px] leading-tight text-on-surface">
                        Leave Request
                    </Text>
                </View>
                <Pressable
                    onPress={onClose}
                    className="w-8 h-8 rounded-full items-center justify-center bg-surface-container active:opacity-70"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <X size={16} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" />
                </Pressable>
            </View>

            {/* Main Content */}
            <View className="p-5 pt-4 gap-5">

                {/* Hero: Date Pills (Sharp Corners, Semantic Colors) */}
                <View className="items-center gap-2 mt-1">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            onPress={() => setShowStartPicker(true)}
                            className="px-5 items-center justify-center rounded-none bg-surface-container border border-outline-variant"
                            style={{ minHeight: 44 }}
                        >
                            <Text className="text-on-surface text-base font-mono font-bold tracking-tight">
                                {format(startDate, 'dd MMM')}
                            </Text>
                        </TouchableOpacity>

                        <Triangle size={10} color={isDark ? '#C4C6D0' : '#44474F'} className="text-on-surface-variant" rotation={90} />

                        <TouchableOpacity
                            onPress={() => setShowEndPicker(true)}
                            className="px-5 items-center justify-center rounded-none bg-surface-container border border-outline-variant"
                            style={{ minHeight: 44 }}
                        >
                            <Text className="text-on-surface text-base font-mono font-bold tracking-tight">
                                {format(endDate, 'dd MMM')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Chargeable days subtitle */}
                    <Text className="text-on-surface-variant text-xs font-semibold mt-1">
                        {daysCount} chargeable {daysCount === 1 ? 'day' : 'days'}
                    </Text>
                </View>

                {/* Projection Strip: Rigid layout, 0px border radius */}
                <View className={`flex-row items-center justify-between rounded-none px-3 py-3 border ${projection.isUnchargeable
                        ? 'bg-surface-container-high border-outline-variant'
                        : projection.isOverdraft
                            ? 'bg-error-container border-error'
                            : 'bg-surface-container border-outline'
                    }`}>
                    {projection.isUnchargeable ? (
                        <View className="flex-1 items-center">
                            <Text className="text-on-surface-variant text-xs font-semibold uppercase tracking-wider">
                                No charge to leave balance
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Available */}
                            <View className="flex-1 items-center">
                                <Text className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    Avail
                                </Text>
                                <Text className="text-on-surface text-xl font-mono font-bold">
                                    {formatDays(projection.availableOnDeparture)}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View className="h-6 w-[1px] bg-outline-variant" />

                            {/* Charge */}
                            <View className="flex-1 items-center">
                                <Text className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    Charge
                                </Text>
                                <Text className="text-on-surface text-xl font-mono font-bold">
                                    {daysCount}.0
                                </Text>
                            </View>

                            {/* Divider */}
                            <View className="h-6 w-[1px] bg-outline-variant" />

                            {/* Remaining */}
                            <View className="flex-1 items-center">
                                <Text className="text-on-surface-variant text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    Remain
                                </Text>
                                <Text className={`text-xl font-mono font-bold ${projection.isOverdraft ? 'text-error' : 'text-primary'}`}>
                                    {formatDays(projection.remainingOnReturn)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Secondary Information */}
                <View className="gap-4 mt-2">
                    {/* Location */}
                    <View className="flex-row items-center gap-4">
                        <View className={`w-10 h-10 rounded-full items-center justify-center border ${!draft.leaveAddress ? 'border-error bg-error-container' : 'border-primary bg-primary-container'}`}>
                            <MapPin size={18} color={!draft.leaveAddress ? (isDark ? '#FFB4AB' : '#BA1A1A') : (isDark ? '#338EF7' : '#000A23')} className={!draft.leaveAddress ? "text-error" : "text-primary"} />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-0.5">
                                <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Location</Text>
                                <Pressable onPress={onEdit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Text className="text-primary text-[11px] font-bold">CHANGE</Text>
                                </Pressable>
                            </View>
                            <Text className={`text-[15px] font-[500] leading-tight mt-0.5 ${!draft.leaveAddress ? 'text-error font-bold' : 'text-on-surface'}`} numberOfLines={1}>
                                {draft.leaveAddress || "MISSING - ACTION REQUIRED"}
                            </Text>
                        </View>
                    </View>

                    {/* Emergency Contact */}
                    <View className="flex-row items-center gap-4">
                        <View className={`w-10 h-10 rounded-full items-center justify-center border ${!draft.emergencyContact ? 'border-error bg-error-container' : 'border-outline-variant bg-surface-container'}`}>
                            <Phone size={18} color={!draft.emergencyContact ? (isDark ? '#FFB4AB' : '#BA1A1A') : (isDark ? '#C4C6D0' : '#44474F')} className={!draft.emergencyContact ? "text-error" : "text-on-surface-variant"} />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-0.5">
                                <Text className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider">Emergency</Text>
                                <Pressable onPress={onEdit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Text className="text-primary text-[11px] font-bold">EDIT</Text>
                                </Pressable>
                            </View>
                            <Text className={`text-[15px] font-[500] leading-tight mt-0.5 ${!draft.emergencyContact ? 'text-error font-bold' : 'text-on-surface'}`} numberOfLines={1}>
                                {draft.emergencyContact?.name || "MISSING - ACTION REQUIRED"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Footer Action */}
            <View className="px-5 pb-5 pt-2 relative z-10">
                <SignatureButton
                    onSign={handleSign}
                    isSubmitting={isSubmitting}
                    disabled={!isReadyToSign}
                />
            </View>
        </>
    );

    return (
        <View className="w-full">
            <View className="rounded-none border-t-4 border-t-secondary border-x border-b border-outline-variant bg-surface-container-lowest overflow-hidden">
                {cardContent}
            </View>

            {/* Glass Calendar Modals */}
            <SolidCalendarModal
                visible={showStartPicker}
                onClose={() => setShowStartPicker(false)}
                onSelect={onStartDateChange}
                selectedDate={startDate}
                minDate={new Date()}
                title="Select Start Date"
            />

            <SolidCalendarModal
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
