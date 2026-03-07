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
            className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mx-4 mb-6"
        >
            <LinearGradient
                colors={isDark ? ['rgba(59,130,246,0.15)', 'transparent'] : ['rgba(59,130,246,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-5">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-[52px] h-[52px] rounded-full bg-blue-500/10 dark:bg-blue-900/40 items-center justify-center border-[1.5px] border-blue-500/20 dark:border-blue-800/60 shadow-sm">
                            <User size={26} color={isDark ? '#60A5FA' : '#2563EB'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={2}>
                                {name}
                            </Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={2}>
                                Your Detailer · {office}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                    {/* Contact Details */}
                    <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200/60 dark:border-slate-700/60 shadow-sm mb-5">
                        {phone && (
                            <View className="flex-row items-center gap-3 mb-2">
                                <Phone size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text className="text-[14px] font-medium text-slate-700 dark:text-slate-300">
                                    {phone}
                                </Text>
                            </View>
                        )}
                        {email && (
                            <View className="flex-row items-center gap-3">
                                <Mail size={14} color={isDark ? '#9CA3AF' : '#6B7280'} />
                                <Text className="text-[14px] font-medium text-slate-700 dark:text-slate-300" numberOfLines={1}>
                                    {email}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View className="flex-row gap-3">
                        {phone && (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${phone.replace(/[^\d+]/g, '')}`)}
                                className="flex-1 bg-blue-500/10 dark:bg-blue-500/20 py-3 rounded-[16px] border border-blue-500/20 flex-row items-center justify-center gap-2 shadow-sm"
                            >
                                <Phone size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                                <Text className="text-blue-700 dark:text-blue-300 font-bold text-[15px]">
                                    Call
                                </Text>
                            </TouchableOpacity>
                        )}
                        {email && (
                            <TouchableOpacity
                                onPress={() => Linking.openURL(`mailto:${email}`)}
                                className="flex-1 bg-blue-500/10 dark:bg-blue-500/20 py-3 rounded-[16px] border border-blue-500/20 flex-row items-center justify-center gap-2 shadow-sm"
                            >
                                <Mail size={16} color={isDark ? '#60A5FA' : '#2563EB'} />
                                <Text className="text-blue-700 dark:text-blue-300 font-bold text-[15px]">
                                    Email
                                </Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        </GlassView>
    );
}
