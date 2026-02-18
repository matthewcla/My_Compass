import { useDemoStore } from '@/store/useDemoStore';
import { Mail, Phone, User } from 'lucide-react-native';
import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

export default function DetailerContactWidget() {
    const negotiationDetails = useDemoStore(state => state.negotiationDetails);

    if (!negotiationDetails?.detailer) return null;

    const { name, phone, email, office } = negotiationDetails.detailer;

    return (
        <View className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <View className="flex-row items-center gap-3 mb-3">
                <View className="bg-blue-50 dark:bg-blue-900/30 p-2.5 rounded-full">
                    <User size={20} color="#2563eb" />
                </View>
                <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900 dark:text-white">
                        {name}
                    </Text>
                    <Text className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Your Detailer · {office}
                    </Text>
                </View>
            </View>

            {/* Contact Details */}
            <View className="gap-1.5 mb-4 ml-12">
                {phone && (
                    <Text className="text-xs text-slate-500 dark:text-slate-400">
                        {phone}
                    </Text>
                )}
                {email && (
                    <Text className="text-xs text-slate-500 dark:text-slate-400" numberOfLines={1}>
                        {email}
                    </Text>
                )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
                {phone && (
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)}
                        className="flex-1 bg-blue-50 dark:bg-blue-900/20 py-3 rounded-xl border border-blue-200 dark:border-blue-800 flex-row items-center justify-center gap-2"
                        style={{ minHeight: 44 }}
                    >
                        <Phone size={16} color="#2563eb" />
                        <Text className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                            Call
                        </Text>
                    </TouchableOpacity>
                )}
                {email && (
                    <TouchableOpacity
                        onPress={() => Linking.openURL(`mailto:${email}`)}
                        className="flex-1 bg-blue-50 dark:bg-blue-900/20 py-3 rounded-xl border border-blue-200 dark:border-blue-800 flex-row items-center justify-center gap-2"
                        style={{ minHeight: 44 }}
                    >
                        <Mail size={16} color="#2563eb" />
                        <Text className="text-blue-700 dark:text-blue-400 font-bold text-sm">
                            Email
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}
