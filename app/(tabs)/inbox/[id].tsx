import { ScreenGradient } from '@/components/ScreenGradient';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useInboxStore } from '@/store/useInboxStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { ScrollView, Text, Pressable, View } from 'react-native';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const formatDTG = (dateString: string) => {
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';

        const dd = date.getUTCDate().toString().padStart(2, '0');
        const hh = date.getUTCHours().toString().padStart(2, '0');
        const mm = date.getUTCMinutes().toString().padStart(2, '0');
        const mon = MONTHS[date.getUTCMonth()];
        const yy = date.getUTCFullYear().toString().slice(-2);
        return `${dd}${hh}${mm}Z ${mon} ${yy}`;
    } catch (e) {
        return '';
    }
};

export default function MessageDetailsScreen() {
    const router = useRouter();
    
    useScreenHeader(
        "Message", 
        "Details", 
        undefined, 
        null, 
        useMemo(() => ({
            icon: ChevronLeft,
            onPress: () => router.back()
        }), [router])
    );
    
    const { id } = useLocalSearchParams<{ id: string }>();
    const { messages, markAsRead } = useInboxStore();

    const message = messages.find(m => m.id === id);

    useEffect(() => {
        if (id && message && !message.isRead) {
            markAsRead(id);
        }
    }, [id, message, markAsRead]);

    if (!message) {
        return (
            <ScreenGradient style={{ justifyContent: 'center', alignItems: 'center' }}>
                <Text className="text-slate-500">Message not found</Text>
            </ScreenGradient>
        );
    }

    const actionRoute = message.metadata?.route || message.metadata?.link;

    return (
        <ScreenGradient>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="px-5 py-6">
                    {/* Header Section */}
                    <View className="flex-row justify-between items-center mb-6">
                        <View className="px-3 py-1 rounded-sm bg-slate-800 border border-slate-700/50">
                            <Text className={`text-[10px] tracking-wider font-bold uppercase ${message.type === 'NAVADMIN' ? 'text-blue-500' : message.type === 'STATUS_REPORT' ? 'text-amber-500' : 'text-slate-400'}`}>
                                {message.type.replace('_', ' ')}
                            </Text>
                        </View>
                        <Text className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                            {formatDTG(message.timestamp)}
                        </Text>
                    </View>

                    <Text className="text-2xl font-bold text-white mb-6 leading-8">
                        {message.subject}
                    </Text>

                    {/* Content Section */}
                    <View className="p-5 rounded-sm bg-slate-900/90 border border-slate-800 border-t-slate-700/50 mb-8">
                        <Text className="text-base text-slate-300 leading-relaxed">
                            {message.body}
                        </Text>
                    </View>

                    {/* Action Section */}
                    {!!actionRoute && (
                        <View className="mb-8">
                            <Pressable
                                onPress={() => router.push(actionRoute as any)}
                                className="bg-slate-800 border border-slate-700 py-4 rounded-sm flex-row items-center justify-center"
                                style={({ pressed }) => ({
                                    opacity: pressed ? 0.8 : 1,
                                    transform: [{ scale: pressed ? 0.98 : 1 }]
                                })}
                            >
                                <Text className="text-white font-bold text-[15px] tracking-wide mr-2">Open Linked Item</Text>
                                <ArrowRight size={18} color="#fff" />
                            </Pressable>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenGradient>
    );
}
