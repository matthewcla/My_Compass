import { GlassView } from '@/components/ui/GlassView';
import { useColorScheme } from '@/components/useColorScheme';
import { useDemoStore } from '@/store/useDemoStore';
import { usePCSStore } from '@/store/usePCSStore';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Briefcase, Mail, Phone, User } from 'lucide-react-native';
import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

// ── Component ────────────────────────────────────────────────────────────────

export default function SelectionDetailWidget() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';
    const selectionDetails = useDemoStore(state => state.selectionDetails);
    const activeOrder = usePCSStore(state => state.activeOrder);

    if (!selectionDetails) return null;

    const gainingCommand = activeOrder?.gainingCommand.name || 'Gaining Command';

    return (
        <GlassView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            className="rounded-[24px] overflow-hidden shadow-sm border border-black/5 dark:border-white/10 mx-4 mb-6"
        >
            <LinearGradient
                colors={isDark ? ['rgba(251,191,36,0.15)', 'transparent'] : ['rgba(251,191,36,0.08)', 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
            />
            <View className="p-5">
                {/* Header */}
                <View className="flex-row items-center justify-between mb-5">
                    <View className="flex-row items-center gap-4 flex-1">
                        <View className="w-[52px] h-[52px] rounded-full bg-amber-500/10 dark:bg-amber-900/40 items-center justify-center border-[1.5px] border-amber-500/20 dark:border-amber-800/60 shadow-sm">
                            <Briefcase size={26} color={isDark ? '#FBBF24' : '#D97706'} />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-900 dark:text-slate-100 text-[20px] font-[800] tracking-[-0.5px] leading-tight mb-0.5" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9}>
                                {selectionDetails.billetTitle}
                            </Text>
                            <Text className="text-slate-600 dark:text-slate-400 text-[13px] font-[500] leading-tight opacity-80" numberOfLines={1}>
                                {gainingCommand}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="border-t border-slate-200/50 dark:border-slate-700/50 pt-5">
                    {/* Billet Info */}
                    <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        Billet Details
                    </Text>
                    <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-3 mb-5 border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex-row items-center gap-2">
                        <Text className="text-slate-700 dark:text-slate-300 text-[14px] font-medium" numberOfLines={1}>
                            {selectionDetails.billetNec ? `NEC ${selectionDetails.billetNec} · ` : ''}
                            {`${selectionDetails.dutyType} Duty`}
                        </Text>
                    </View>

                    {/* Detailer Info */}
                    <Text className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 ml-1">
                        Your Detailer
                    </Text>
                    <View className="bg-white/60 dark:bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                        <View className="flex-row items-center gap-3 mb-3">
                            <User size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
                            <Text className="text-slate-800 dark:text-slate-200 text-[15px] font-bold flex-1">
                                {selectionDetails.detailer.name}
                            </Text>
                            <Text className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                {selectionDetails.detailer.office}
                            </Text>
                        </View>

                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => Linking.openURL(`tel:${selectionDetails.detailer.phone}`)}
                                className="flex-1 flex-row items-center justify-center gap-2 bg-blue-500/10 py-2.5 rounded-[12px] border border-blue-500/20 shadow-sm"
                            >
                                <Phone size={14} color={isDark ? '#60A5FA' : '#2563EB'} />
                                <Text className="text-blue-700 dark:text-blue-400 text-[13px] font-bold">Call</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => Linking.openURL(`mailto:${selectionDetails.detailer.email}`)}
                                className="flex-1 flex-row items-center justify-center gap-2 bg-blue-500/10 py-2.5 rounded-[12px] border border-blue-500/20 shadow-sm"
                            >
                                <Mail size={14} color={isDark ? '#60A5FA' : '#2563EB'} />
                                <Text className="text-blue-700 dark:text-blue-400 text-[13px] font-bold">Email</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </GlassView>
    );
}
