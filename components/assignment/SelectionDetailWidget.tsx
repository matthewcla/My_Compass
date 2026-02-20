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
            className="rounded-2xl overflow-hidden shadow-sm"
        >
            <LinearGradient
                colors={isDark
                    ? ['rgba(251,191,36,0.06)', 'rgba(251,191,36,0.01)']
                    : ['rgba(251,191,36,0.10)', 'rgba(251,191,36,0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
            >
                {/* ── Your Billet ───────────────────────────────────────── */}
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Your Billet
                </Text>
                <View className="bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 mb-4 border border-slate-100 dark:border-slate-700/40">
                    <View className="flex-row items-center gap-2.5 mb-1">
                        <Briefcase size={14} color={isDark ? '#fbbf24' : '#d97706'} />
                        <Text className="text-slate-900 dark:text-slate-100 text-sm font-bold flex-1" numberOfLines={1}>
                            {selectionDetails.billetTitle}
                        </Text>
                    </View>
                    <Text className="text-slate-600 dark:text-slate-400 text-xs font-medium ml-[22px]">
                        {gainingCommand}
                        {selectionDetails.billetNec ? ` · NEC ${selectionDetails.billetNec}` : ''}
                        {` · ${selectionDetails.dutyType} Duty`}
                    </Text>
                </View>

                {/* ── Detailer Contact ──────────────────────────────────── */}
                <Text className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    Your Detailer
                </Text>
                <View className="bg-white/60 dark:bg-slate-800/40 rounded-xl px-4 py-3 border border-slate-100 dark:border-slate-700/40">
                    <View className="flex-row items-center gap-2.5 mb-2">
                        <User size={14} color={isDark ? '#94a3b8' : '#64748b'} />
                        <Text className="text-slate-900 dark:text-slate-100 text-sm font-bold flex-1">
                            {selectionDetails.detailer.name}
                        </Text>
                        <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase">
                            {selectionDetails.detailer.office}
                        </Text>
                    </View>
                    <View className="flex-row gap-2 ml-[22px]">
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${selectionDetails.detailer.phone}`)}
                            className="flex-row items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/40"
                        >
                            <Phone size={12} color={isDark ? '#60a5fa' : '#2563eb'} />
                            <Text className="text-blue-700 dark:text-blue-300 text-[10px] font-bold">Call</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => Linking.openURL(`mailto:${selectionDetails.detailer.email}`)}
                            className="flex-row items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg border border-blue-100 dark:border-blue-800/40"
                        >
                            <Mail size={12} color={isDark ? '#60a5fa' : '#2563eb'} />
                            <Text className="text-blue-700 dark:text-blue-300 text-[10px] font-bold">Email</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </LinearGradient>
        </GlassView>
    );
}
