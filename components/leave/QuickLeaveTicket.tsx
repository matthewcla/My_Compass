import { SolidCalendarModal } from '@/components/ui/SolidCalendarModal';
import { SolidView } from '@/components/ui/SolidView';
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
import { Alert, Pressable, Text, TouchableOpacity, View } from 'react-native';

interface QuickLeaveTicketProps {
    draft: LeaveRequest;
    onSubmit: () => void;
    onEdit: () => void;
    onClose: () => void;
}

export function QuickLeaveTicket({ draft, onSubmit, onEdit, onClose }: QuickLeaveTicketProps) {
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

    const cardContent = (
        <>
            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pt-5 pb-0">
                <View className="flex-1">
                    <Text className="text-slate-400 font-bold text-[10px] tracking-[2px] uppercase mb-0.5" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 2 }}>
                        QUICK TICKET
                    </Text>
                    <Text className="text-[20px] font-[800] tracking-[-0.5px] leading-tight text-white" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 }}>
                        Leave Request
                    </Text>
                </View>
                <Pressable
                    onPress={onClose}
                    className="w-8 h-8 rounded-full items-center justify-center bg-white/10 active:opacity-70"
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                    <X size={16} color="#9ca3af" />
                </Pressable>
            </View>

            {/* Main Content */}
            <View className="p-5 pt-4 gap-5">

                {/* Hero: Date Pills (centered) */}
                <View className="items-center gap-2 mt-1">
                    <View className="flex-row items-center gap-3">
                        <TouchableOpacity
                            onPress={() => setShowStartPicker(true)}
                            className="px-5 items-center justify-center rounded-lg bg-slate-700/50 border border-slate-600/40"
                            style={{ minHeight: 44 }}
                        >
                            <Text className="text-white text-base font-mono font-bold tracking-tight">
                                {format(startDate, 'dd MMM')}
                            </Text>
                        </TouchableOpacity>

                        <Triangle size={10} color="#94a3b8" rotation={90} fill="#94a3b8" />

                        <TouchableOpacity
                            onPress={() => setShowEndPicker(true)}
                            className="px-5 items-center justify-center rounded-lg bg-slate-700/50 border border-slate-600/40"
                            style={{ minHeight: 44 }}
                        >
                            <Text className="text-white text-base font-mono font-bold tracking-tight">
                                {format(endDate, 'dd MMM')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Chargeable days subtitle */}
                    <Text className="text-slate-400 text-xs font-semibold mt-1">
                        {daysCount} chargeable {daysCount === 1 ? 'day' : 'days'}
                    </Text>
                </View>

                {/* Projection Strip: Avail | Charge | Remain */}
                <View className={`flex-row items-center justify-between rounded-xl px-3 py-3 border ${projection.isUnchargeable
                        ? 'bg-slate-800/40 border-slate-700/50'
                        : projection.isOverdraft
                            ? 'bg-error-container/20 border-error/50'
                            : 'bg-emerald-950/20 border-emerald-900/50'
                    }`}>
                    {projection.isUnchargeable ? (
                        <View className="flex-1 items-center">
                            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                                No charge to leave balance
                            </Text>
                        </View>
                    ) : (
                        <>
                            {/* Available */}
                            <View className="flex-1 items-center">
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    Avail
                                </Text>
                                <Text className="text-white text-xl font-mono font-bold">
                                    {formatDays(projection.availableOnDeparture)}
                                </Text>
                            </View>

                            {/* Divider */}
                            <View className="h-6 w-[1px] bg-slate-600" />

                            {/* Charge */}
                            <View className="flex-1 items-center">
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    Charge
                                </Text>
                                <Text className="text-white text-xl font-mono font-bold">
                                    {daysCount}.0
                                </Text>
                            </View>

                            {/* Divider */}
                            <View className="h-6 w-[1px] bg-slate-600" />

                            {/* Remaining */}
                            <View className="flex-1 items-center">
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                                    Remain
                                </Text>
                                <Text className={`text-xl font-mono font-bold ${projection.isOverdraft ? 'text-error' : 'text-emerald-400'}`}>
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
                        <View className="w-10 h-10 rounded-full items-center justify-center border border-blue-900/60 bg-blue-900/40">
                            <MapPin size={18} color={!draft.leaveAddress ? '#fb7185' : '#60a5fa'} />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-0.5">
                                <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Location</Text>
                                <Pressable onPress={onEdit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Text className="text-slate-300 text-[11px] font-bold">CHANGE</Text>
                                </Pressable>
                            </View>
                            <Text className={`text-[15px] font-[500] leading-tight mt-0.5 ${!draft.leaveAddress ? 'text-error italic' : 'text-slate-200'}`} numberOfLines={1}>
                                {displayAddress}
                            </Text>
                        </View>
                    </View>

                    {/* Emergency Contact */}
                    <View className="flex-row items-center gap-4">
                        <View className="w-10 h-10 rounded-full items-center justify-center border border-slate-700 bg-slate-800/60">
                            <Phone size={18} color="#94a3b8" />
                        </View>
                        <View className="flex-1">
                            <View className="flex-row justify-between items-center mb-0.5">
                                <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Emergency</Text>
                                <Pressable onPress={onEdit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                                    <Text className="text-slate-300 text-[11px] font-bold">EDIT</Text>
                                </Pressable>
                            </View>
                            <Text className="text-slate-200 text-[15px] font-[500] leading-tight mt-0.5">
                                {draft.emergencyContact?.name || "None Set"}
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
                />
            </View>
        </>
    );

    return (
        <View className="w-full">
            <SolidView
                intensity={80}
                tint="dark"
                className="rounded-[24px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.4)] bg-slate-900/60 border border-white/10"
            >
                <SolidView intensity={20} tint="dark" className="absolute inset-0" />
                {cardContent}
            </SolidView>

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
