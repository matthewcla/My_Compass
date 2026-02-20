import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { useUserStore } from '@/store/useUserStore';
import {
    CheckCircle2,
    Circle,
    Mail,
    Phone,
    Settings,
    ShieldCheck,
    Target,
    Users
} from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { useShallow } from 'zustand/react/shallow';

type ChecklistKey = 'contactVerified' | 'dependentsVerified' | 'sponsorContacted';

interface VerificationModalProps {
    visible: boolean;
    onClose: () => void;
    onVerify: () => void;
    type: 'contact' | 'dependents';
}

function VerificationModal({ visible, onClose, onVerify, type }: VerificationModalProps) {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Current user data
    const user = useUserStore(state => state.user);

    if (!user) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50 dark:bg-black/70">
                <TouchableOpacity
                    className="flex-1"
                    activeOpacity={1}
                    onPress={onClose}
                />
                <View className="bg-white dark:bg-slate-900 rounded-t-3xl pt-2 px-6 pb-10">
                    <View className="items-center mb-6">
                        <View className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
                    </View>

                    {type === 'contact' ? (
                        <>
                            <View className="flex-row items-center gap-3 mb-6">
                                <View className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
                                    <Phone size={24} color={isDark ? '#60a5fa' : '#2563eb'} />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-slate-900 dark:text-white">
                                        Verify Contact Info
                                    </Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                                        My Profile Data
                                    </Text>
                                </View>
                            </View>

                            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-800">
                                <View className="flex-row items-center justify-between mb-4">
                                    <View className="flex-row items-center gap-2">
                                        <Mail size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                                        <Text className="text-slate-500 dark:text-slate-400 font-medium">Email</Text>
                                    </View>
                                    <Text className="text-slate-900 dark:text-slate-100 font-semibold">{user.email}</Text>
                                </View>
                                <View className="h-px bg-slate-200 dark:bg-slate-700/50 w-full mb-4" />
                                <View className="flex-row items-center justify-between">
                                    <View className="flex-row items-center gap-2">
                                        <Phone size={16} color={isDark ? '#94a3b8' : '#64748b'} />
                                        <Text className="text-slate-500 dark:text-slate-400 font-medium">Phone</Text>
                                    </View>
                                    <Text className="text-slate-900 dark:text-slate-100 font-semibold">{user.phone || 'Not Provided'}</Text>
                                </View>
                            </View>
                        </>
                    ) : (
                        <>
                            <View className="flex-row items-center gap-3 mb-6">
                                <View className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
                                    <Users size={24} color={isDark ? '#c084fc' : '#9333ea'} />
                                </View>
                                <View>
                                    <Text className="text-xl font-bold text-slate-900 dark:text-white">
                                        Verify Dependents
                                    </Text>
                                    <Text className="text-slate-500 dark:text-slate-400 text-sm">
                                        EFMP & Family Status
                                    </Text>
                                </View>
                            </View>

                            <View className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-200 dark:border-slate-800">
                                <View className="flex-row items-center justify-between mb-4">
                                    <Text className="text-slate-500 dark:text-slate-400 font-medium">Dependents</Text>
                                    <Text className="text-slate-900 dark:text-slate-100 font-semibold">{user.dependents}</Text>
                                </View>
                                <View className="h-px bg-slate-200 dark:bg-slate-700/50 w-full mb-4" />
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-slate-500 dark:text-slate-400 font-medium">EFMP Enrolled</Text>
                                    <Text className="text-slate-900 dark:text-slate-100 font-semibold">
                                        {user.efmpEnrolled ? 'Yes' : 'No'}
                                    </Text>
                                </View>
                            </View>
                        </>
                    )}

                    <View className="gap-3">
                        <TouchableOpacity
                            onPress={onVerify}
                            className="bg-blue-600 dark:bg-blue-700 py-3.5 rounded-xl items-center"
                        >
                            <Text className="text-white font-bold text-base">Looks Good (Verify)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                // In a real app, this would open an inline edit form or navigate
                                // For now, close the modal to simulate canceling/editing
                                onClose();
                            }}
                            className="bg-slate-100 dark:bg-slate-800 py-3.5 rounded-xl items-center"
                        >
                            <Text className="text-slate-700 dark:text-slate-300 font-bold text-base flex-row items-center">
                                <Settings size={16} color={isDark ? '#cbd5e1' : '#334155'} /> Edit Info
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

export default function SelectionChecklistWidget() {
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    const checklist = useDemoStore(useShallow(state => state.selectionChecklist));
    const toggleChecklist = useDemoStore(state => state.toggleSelectionChecklist);

    const [modalVisible, setModalVisible] = useState(false);
    const [modalType, setModalType] = useState<'contact' | 'dependents'>('contact');

    const handleItemPress = (key: ChecklistKey) => {
        if (key === 'contactVerified') {
            if (!checklist.contactVerified) {
                setModalType('contact');
                setModalVisible(true);
            }
        } else if (key === 'dependentsVerified') {
            if (!checklist.dependentsVerified) {
                setModalType('dependents');
                setModalVisible(true);
            }
        } else {
            // Direct toggle for sponsor
            toggleChecklist(key);
        }
    };

    const handleVerifyClick = () => {
        if (modalType === 'contact') {
            toggleChecklist('contactVerified');
        } else if (modalType === 'dependents') {
            toggleChecklist('dependentsVerified');
        }
        setModalVisible(false);
    };

    const items = [
        {
            key: 'contactVerified' as ChecklistKey,
            label: 'Verify Contact Info',
            detail: 'My Profile Data',
            done: checklist.contactVerified,
            icon: <Phone size={14} color={checklist.contactVerified ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
        },
        {
            key: 'dependentsVerified' as ChecklistKey,
            label: 'Verify Dependents & EFMP',
            detail: 'Family Readiness',
            done: checklist.dependentsVerified,
            icon: <Users size={14} color={checklist.dependentsVerified ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
        },
        {
            key: 'sponsorContacted' as ChecklistKey,
            label: 'Contact Sponsor',
            detail: 'Gaining Command',
            done: checklist.sponsorContacted,
            icon: <ShieldCheck size={14} color={checklist.sponsorContacted ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#94a3b8' : '#64748b')} />,
        },
    ];

    const doneCount = items.filter((i) => i.done).length;
    const allDone = doneCount === items.length;

    return (
        <>
            <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-6">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-4">
                    <View className="flex-row items-center gap-3">
                        <View className={`p-2.5 rounded-full ${allDone ? 'bg-green-50 dark:bg-green-900/30' : 'bg-blue-50 dark:bg-blue-900/30'}`}>
                            <Target size={20} color={allDone ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#60a5fa' : '#2563eb')} />
                        </View>
                        <View>
                            <Text className="text-base font-bold text-slate-900 dark:text-white">
                                Preparation Checklist
                            </Text>
                            <Text className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                What Happens Next
                            </Text>
                        </View>
                    </View>
                    <View className={`px-2.5 py-1 rounded-full ${allDone
                        ? 'bg-green-100 dark:bg-green-900/30'
                        : 'bg-blue-100 dark:bg-blue-900/30'
                        }`}>
                        <Text className={`text-xs font-bold ${allDone
                            ? 'text-green-700 dark:text-green-400'
                            : 'text-blue-700 dark:text-blue-400'
                            }`}>
                            {doneCount} of {items.length}
                        </Text>
                    </View>
                </View>

                {/* Checklist */}
                <View className="gap-1">
                    {items.map((item) => (
                        <TouchableOpacity
                            key={item.key}
                            onPress={() => handleItemPress(item.key)}
                            disabled={item.done && item.key !== 'sponsorContacted'} // allow sponsor toggle-off, but verified data is locked until edit
                            activeOpacity={0.6}
                            className={`flex-row items-center py-2.5 px-3 rounded-xl ${!item.done ? 'bg-slate-50 dark:bg-slate-800/50' : ''
                                }`}
                        >
                            {/* Check icon */}
                            {item.done ? (
                                <CheckCircle2 size={18} color={isDark ? '#4ade80' : '#16a34a'} />
                            ) : (
                                <Circle size={18} color={isDark ? '#475569' : '#cbd5e1'} />
                            )}

                            {/* Item icon */}
                            <View className="ml-2.5 mr-2">
                                {item.icon}
                            </View>

                            {/* Label + detail */}
                            <View className="flex-1">
                                <Text className={`text-sm font-semibold ${item.done
                                    ? 'text-slate-500 dark:text-slate-400'
                                    : 'text-slate-800 dark:text-slate-200'
                                    }`}>
                                    {item.label}
                                </Text>
                            </View>

                            {/* Right side: detail text */}
                            <Text className={`text-xs font-medium mr-1 ${item.done
                                ? 'text-green-600 dark:text-green-400'
                                : 'text-slate-400 dark:text-slate-500'
                                }`}>
                                {item.done ? 'Verified' : item.detail}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* All-done celebration */}
                {allDone && (
                    <View className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-800/30 mt-3">
                        <Text className="text-xs text-green-700 dark:text-green-400 leading-relaxed text-center font-semibold">
                            ✅  You're all set! Everything is verified for your upcoming orders.
                        </Text>
                    </View>
                )}
            </View>

            <VerificationModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onVerify={handleVerifyClick}
                type={modalType}
            />
        </>
    );
}
