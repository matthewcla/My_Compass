import { Clock } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface LeaveCardProps {
    balance: number;
    pendingRequest?: {
        dates: string;
        status: string; // Not explicitly used in mockup visual but good for props
    };
    onPress?: () => void;
}

export function LeaveCard({ balance, pendingRequest, onPress }: LeaveCardProps) {
    return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.9} className="bg-white rounded-xl p-3 border border-slate-100 flex-row items-center justify-between relative overflow-hidden min-h-[60px]" style={{ shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10, elevation: 4 }}>
            {/* Decorative Corner */}
            <View className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-bl-lg z-10" />

            <View className="flex flex-col">
                <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Leave Balance</Text>
                <View className="flex-row items-baseline gap-1">
                    <Text className="text-xl font-bold text-slate-800 leading-none mt-0.5">{balance}</Text>
                    <Text className="text-[10px] text-slate-400">Days</Text>
                </View>
            </View>

            {pendingRequest && (
                <View className="bg-orange-50 rounded-lg pl-3 pr-2 py-1.5 border border-orange-100 flex-col items-end">
                    <View className="flex-row items-center gap-1 mb-0.5">
                        <Text className="text-[9px] font-bold text-orange-700 uppercase">Pending</Text>
                        <Clock size={12} color="#c2410c" />
                    </View>
                    <Text className="text-[10px] text-orange-800 font-medium">{pendingRequest.dates}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
