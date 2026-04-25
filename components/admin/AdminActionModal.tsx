// components/admin/AdminActionModal.tsx
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
            <View className="flex-1 bg-black/80 justify-end">
                <View 
                    style={{ paddingBottom: Math.max(insets.bottom + 24, 24) }}
                    className="bg-slate-950 border-t border-slate-800 px-6 pt-6"
                >
                    <View className="flex-row justify-between items-start mb-6">
                        <View className="flex-1 pr-4">
                            <Text className="text-2xl font-black text-white mb-1 tracking-tight">{request.label}</Text>
                            <Text className="text-sm font-bold text-slate-500 uppercase tracking-widest">{request.status.replace('_', ' ')}</Text>
                        </View>
                        <TouchableOpacity onPress={handleClose} className="p-2 bg-slate-900 rounded-sm border border-slate-800">
                            <X size={20} color="#94a3b8" />
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
                                        step.status === 'approved' ? 'bg-green-500/20 border border-green-500/50' :
                                        step.status === 'current' ? 'bg-amber-400/20 border border-amber-400/50' :
                                        step.status === 'denied' ? 'bg-red-500/20 border border-red-500/50' :
                                        'bg-slate-900 border border-slate-800'
                                    }`}>
                                        {step.status === 'approved' && <CheckCircle size={20} color="#4ade80" />}
                                        {step.status === 'denied' && <XCircle size={20} color="#ef4444" />}
                                    </View>
                                    <View>
                                        <Text className={`font-bold ${isCurrent ? 'text-amber-400' : isPast ? 'text-slate-300' : 'text-slate-600'}`}>{step.label}</Text>
                                        <Text className="text-slate-500 text-xs">{step.role}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    {request.isUserActionable ? (
                        <View className="border-t border-slate-800 pt-6">
                            <Text className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-2">Recommendation Notes</Text>
                            <TextInput 
                                className="bg-slate-900 border border-slate-800 rounded-sm text-white p-4 mb-6 min-h-[80px]"
                                placeholder="Add comments here..."
                                placeholderTextColor="#475569"
                                multiline
                                textAlignVertical="top"
                                value={notes}
                                onChangeText={setNotes}
                            />
                            
                            <View className="flex-row gap-4">
                                <TouchableOpacity 
                                    onPress={handleDisapprove}
                                    activeOpacity={0.8}
                                    className="flex-1 bg-red-950 border border-red-900 py-4 rounded-sm items-center"
                                >
                                    <Text className="text-red-500 font-bold tracking-widest uppercase">Disapprove</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                    onPress={handleApprove}
                                    activeOpacity={0.8}
                                    className="flex-1 bg-[#fbbf24] py-4 rounded-sm items-center"
                                >
                                    <Text className="text-black font-black tracking-widest uppercase">
                                        {isFinalStep ? 'Final Approve' : 'Approve'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ) : (
                        <View className="border-t border-slate-800 pt-6 items-center">
                            <Text className="text-slate-500 text-sm">No action required from you at this time.</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
}
