// components/admin/AdminActionModal.tsx
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { AdminRequest, useAdminStore } from '@/store/useAdminStore';
import { CheckCircle, X, XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AdminActionModalProps {
    request: AdminRequest | null;
    onClose: () => void;
}

export function AdminActionModal({ request, onClose }: AdminActionModalProps) {
    const insets = useSafeAreaInsets();
    const { recommendRequest, approveRequest } = useAdminStore();
    const [notes, setNotes] = useState('');
    const colorScheme = useColorScheme() ?? 'light';
    const isDark = colorScheme === 'dark';
    const themeColors = Colors[colorScheme];

    if (!request) return null;

    const currentIdx = request.approvalChain.findIndex(s => s.status === 'current');
    const isFinalStep = currentIdx === request.approvalChain.length - 1;
    const actionable = request.isUserActionable;

    const handleApprove = () => {
        if (isFinalStep) {
            approveRequest(request.id, notes);
        } else {
            recommendRequest(request.id, 'approve', notes);
        }
        setNotes('');
        onClose();
    };

    const handleDisapprove = () => {
        recommendRequest(request.id, 'disapprove', notes);
        setNotes('');
        onClose();
    };

    const handleClose = () => {
        setNotes('');
        onClose();
    };

    return (
        <Modal transparent animationType="slide" visible={!!request} onRequestClose={handleClose}>
            <View className="flex-1 bg-black/50 justify-end">
                <View 
                    style={{ paddingBottom: Math.max(insets.bottom, 24) }}
                    className="bg-surface border-t border-outline-variant px-6 pt-6"
                >
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1">
                            <Text className="text-2xl font-black text-on-surface mb-1 tracking-tight">{request.label}</Text>
                            <Text className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">{request.status.replace('_', ' ')}</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} className="p-2 bg-surface-container-highest rounded-sm border border-outline-variant">
                            <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 300 }} className="mb-6" showsVerticalScrollIndicator={false}>
                        <Text className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-4">Approval Chain</Text>
                        {request.approvalChain.map((step) => {
                            const isPast = step.status === 'approved' || step.status === 'denied';
                            const isCurrent = step.status === 'current';
                            return (
                                <View key={step.id} className="flex-row items-center mb-4">
                                    <View className={`w-10 h-10 rounded-sm items-center justify-center mr-4 ${
                                        step.status === 'approved' ? 'bg-secondary-container/20 border border-secondary-container/50' :
                                        isCurrent ? 'bg-primary-container/20 border border-primary-container/50' :
                                        step.status === 'denied' ? 'bg-error-container/20 border border-error-container/50' :
                                        'bg-surface-container-highest border border-outline-variant'
                                    }`}>
                                        {step.status === 'approved' && <CheckCircle size={20} color={themeColors.status.success} />}
                                        {step.status === 'denied' && <XCircle size={20} color={themeColors.status.error} />}
                                    </View>
                                    <View>
                                        <Text className={`font-bold ${isCurrent ? 'text-primary' : isPast ? 'text-on-surface-variant' : 'text-on-surface'}`}>{step.label}</Text>
                                        <Text className="text-on-surface-variant text-xs">{step.role}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {actionable ? (
                        <View className="border-t border-outline-variant pt-6">
                            <Text className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-2">Recommendation Notes</Text>
                            <TextInput 
                                className="bg-surface-container-low border border-outline-variant rounded-sm text-on-surface p-4 mb-6 min-h-[80px]"
                                placeholder="Add comments here..."
                                placeholderTextColor={isDark ? '#475569' : '#94A3B8'}
                                multiline
                                textAlignVertical="top"
                                value={notes}
                                onChangeText={setNotes}
                            />
                            
                            <View className="flex-row gap-4">
                                <TouchableOpacity 
                                    onPress={handleDisapprove}
                                    activeOpacity={0.8}
                                    className="flex-1 bg-error-container border border-error/20 py-4 rounded-sm items-center"
                                >
                                    <Text className="text-on-error-container font-bold tracking-widest uppercase">Disapprove</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleApprove}
                                    activeOpacity={0.8}
                                    className="flex-1 bg-secondary-container border border-secondary-container py-4 rounded-sm items-center"
                                >
                                    <Text className="text-on-secondary-container font-black tracking-widest uppercase">
                                        {isFinalStep ? 'Final Approve' : 'Approve'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="border-t border-outline-variant pt-6 items-center">
                            <Text className="text-on-surface-variant text-sm">No action required from you at this time.</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
