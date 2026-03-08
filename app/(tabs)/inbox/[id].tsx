import { ScreenGradient } from '@/components/ScreenGradient';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useInboxStore } from '@/store/useInboxStore';
import { format } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';

export default function MessageDetailsScreen() {
    useScreenHeader("Message", "Details");
    const { id } = useLocalSearchParams<{ id: string }>();
    const { messages, markAsRead } = useInboxStore();
    const router = useRouter();

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

    const formattedDate = format(new Date(message.timestamp), 'dd MMM yyyy - HH:mm');
    const actionRoute = message.metadata?.route || message.metadata?.link;

    return (
        <ScreenGradient>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                <View className="p-4">
                    <View className="flex-row justify-between items-center mb-4">
                        <View className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                            <Text className={`text-[11px] tracking-[1.5px] font-bold uppercase ${message.type === 'NAVADMIN' ? 'text-blue-600 dark:text-blue-400' : message.type === 'STATUS_REPORT' ? 'text-amber-600 dark:text-amber-500' : 'text-slate-600 dark:text-slate-400'}`}>
                                {message.type.replace('_', ' ')}
                            </Text>
                        </View>
                        <Text className="text-xs text-slate-500 dark:text-slate-400">
                            {formattedDate}
                        </Text>
                    </View>

                    <Text className="text-xl font-bold text-slate-900 dark:text-white mb-2 leading-7">
                        {message.subject}
                    </Text>

                    {message.metadata && Object.keys(message.metadata).length > 0 && (
                        <View className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg mb-4">
                            <Text className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                METADATA: {JSON.stringify(message.metadata, null, 2)}
                            </Text>
                        </View>
                    )}

                    <View className="h-px bg-slate-200 dark:bg-slate-800 my-4" />

                    <Text className="text-base text-slate-800 dark:text-slate-200 leading-6">
                        {message.body}
                    </Text>
                    <Text className="text-base text-slate-800 dark:text-slate-200 leading-6 mt-4">
                        {/* Mock longer content for demo purposes if body is short */}
                        {message.body.length < 100 && "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."}
                    </Text>

                    {!!actionRoute && (
                        <View className="mt-8 mb-8">
                            <TouchableOpacity
                                onPress={() => router.push(actionRoute as any)}
                                activeOpacity={0.8}
                                className="bg-blue-600 dark:bg-blue-500 py-4 rounded-xl flex-row items-center justify-center shadow-sm border border-blue-500/20 active:scale-[0.98] active:opacity-90"
                            >
                                <Text className="text-white font-bold text-[17px] tracking-tight">View Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </ScrollView>
        </ScreenGradient>
    );
}
