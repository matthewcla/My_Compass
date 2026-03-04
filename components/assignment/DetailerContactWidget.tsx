import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Phone, User } from 'lucide-react-native';
import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

export default function DetailerContactWidget() {
    const negotiationDetails = useDemoStore(state => state.negotiationDetails);
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    if (!negotiationDetails?.detailer) return null;

    const { name, phone, email, office } = negotiationDetails.detailer;

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-2xl overflow-hidden shadow-sm border border-black/5 dark:border-white/10"
        >
            <LinearGradient
                colors={isDark
                    ? ['rgba(59,130,246,0.06)', 'rgba(59,130,246,0.01)']
                    : ['rgba(59,130,246,0.10)', 'rgba(59,130,246,0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
            >
                {/* Header */}
                <View className="flex-row items-center gap-3 mb-3">
                    <View className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-full">
                        <User size={20} color={isDark ? '#60a5fa' : '#2563eb'} />
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
                            className="flex-1 bg-white/60 dark:bg-slate-800/40 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex-row items-center justify-center gap-2"
                            style={{ minHeight: 44 }}
                        >
                            <Phone size={16} color={isDark ? '#60a5fa' : '#2563eb'} />
                            <Text className="text-slate-900 dark:text-white font-bold text-sm">
                                Call
                            </Text>
                        </TouchableOpacity>
                    )}
                    {email && (
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`mailto:${email}`)}
                            className="flex-1 bg-white/60 dark:bg-slate-800/40 py-3 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex-row items-center justify-center gap-2"
                            style={{ minHeight: 44 }}
                        >
                            <Mail size={16} color={isDark ? '#60a5fa' : '#2563eb'} />
                            <Text className="text-slate-900 dark:text-white font-bold text-sm">
                                Email
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </LinearGradient>
        </GlassView>
    );
}
