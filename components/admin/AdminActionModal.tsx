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
            <View className="flex-1 bg-slate-900/40 dark:bg-black/80 justify-end">
                <View 
                    style={{ paddingBottom: Math.max(insets.bottom + 24, 24) }}
                    className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 pt-6"
                >
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 pr-4">
                            <Text className="text-2xl font-black text-slate-900 dark:text-white mb-1 tracking-tight">{request.label}</Text>
                            <Text className="text-sm font-bold text-slate-500 uppercase tracking-widest">{request.status.replace('_', ' ')}</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} className="p-2 bg-slate-100 dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800">
                            <X size={20} color={isDark ? '#94a3b8' : '#64748b'} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: 300 }} className="mb-6" showsVerticalScrollIndicator={false}>
                        <Text className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Approval Chain</Text>
                        {request.approvalChain.map((step, idx) => {
                            const isPast = step.status === 'approved' || step.status === 'denied';
                            const isCurrent = step.status === 'current';
                            return (
                                <View key={step.id} className="flex-row items-center mb-4">
                                    <View className={`w-10 h-10 rounded-sm items-center justify-center mr-4 ${
                                        step.status === 'approved' ? 'bg-green-100 dark:bg-green-500/20 border border-green-200 dark:border-green-500/50' :
                                        step.status === 'current' ? 'bg-secondary/10 border border-secondary/30' :
                                        step.status === 'denied' ? 'bg-error/10 border border-error/30' :
                                        'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800'
                                    }`}>
                                        {step.status === 'approved' && <CheckCircle size={20} color={themeColors.status.success} />}
                                        {step.status === 'denied' && <XCircle size={20} color={themeColors.status.error} />}
                                    </View>
                                    <View>
                                        <Text className={`font-bold ${isCurrent ? 'text-secondary' : isPast ? 'text-slate-500 dark:text-slate-300' : 'text-slate-900 dark:text-slate-600'}`}>{step.label}</Text>
                                        <Text className="text-slate-500 text-xs">{step.role}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {request.isUserActionable ? (
                        <View className="border-t border-slate-200 dark:border-slate-800 pt-6">
                            <Text className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Recommendation Notes</Text>
                            <TextInput 
                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm text-slate-900 dark:text-white p-4 mb-6 min-h-[80px]"
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
                        <View className="border-t border-slate-200 dark:border-slate-800 pt-6 items-center">
                            <Text className="text-slate-500 text-sm">No action required from you at this time.</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
