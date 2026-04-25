import { useAdminStore } from '@/store/useAdminStore';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SubmitAdminRequest() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { submitRequest } = useAdminStore();

    const [type, setType] = useState<string>('Special Request');
    const [label, setLabel] = useState('');

    const TYPES = ['Special Request', 'Leave Request', 'Pay Inquiry', 'Training Request'];

    const handleSubmit = () => {
        if (!label) return;
        submitRequest({
            type: 'ADMIN_REQUEST',
            label: `${type}: ${label}`,
            status: 'action_required',
            approvalChain: [
                { id: `step-${Date.now()}-1`, role: 'LPO', label: 'E6 LPO', status: 'current' },
                { id: `step-${Date.now()}-2`, role: 'Chief', label: 'CPO', status: 'pending' },
                { id: `step-${Date.now()}-3`, role: 'DIVO', label: 'Division Officer', status: 'pending' }
            ]
        });
        router.back();
    };

    return (
        <View className="flex-1 bg-black">
            <View style={{ paddingTop: Math.max(insets.top, 20) }} className="flex-row items-center px-4 pb-4 border-b border-slate-800 bg-slate-950">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-slate-900 rounded-sm border border-slate-800">
                    <ChevronLeft size={24} color="#94A3B8" />
                </TouchableOpacity>
                <Text className="text-xl font-black text-white ml-4 tracking-tight uppercase">Submit Request</Text>
            </View>

            <ScrollView className="flex-1 px-4 py-6">
                <Text className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Request Type</Text>
                <View className="flex-row flex-wrap gap-3 mb-8">
                    {TYPES.map(t => (
                        <TouchableOpacity 
                            key={t}
                            onPress={() => setType(t)}
                            className={`px-4 py-3 rounded-sm border ${type === t ? 'bg-amber-400/10 border-amber-400/50' : 'bg-slate-900 border-slate-800'}`}
                        >
                            <Text className={`font-bold ${type === t ? 'text-amber-400' : 'text-slate-400'}`}>{t}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4">Description</Text>
                <TextInput
                    className="bg-slate-900 border border-slate-800 rounded-sm text-white p-4 mb-8 min-h-[100px]"
                    placeholder="Brief description of your request..."
                    placeholderTextColor="#475569"
                    value={label}
                    onChangeText={setLabel}
                    multiline
                    textAlignVertical="top"
                />

                <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={!label}
                    className={`py-4 rounded-sm items-center border ${label ? 'bg-fbbf24 border-amber-500' : 'bg-slate-900 border-slate-800'}`}
                >
                    <Text className={`font-black tracking-widest uppercase ${label ? 'text-black' : 'text-slate-600'}`}>
                        Submit Request
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
