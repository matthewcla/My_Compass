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
            <View className="flex-1 bg-slate-50 dark:bg-black items-center justify-center">
                <Text className="text-slate-500">Message not found</Text>
            </View>
        );
    }

    const formattedDate = format(new Date(message.timestamp), 'dd MMM yyyy - HH:mm');
    const actionRoute = message.metadata?.route || message.metadata?.link;

    return (
        <ScrollView className="flex-1 bg-slate-50 dark:bg-black">
            <View className="p-4">
                <View className="flex-row justify-between items-center mb-4">
                    <View className="bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full">
                        <Text className="text-xs font-bold text-slate-700 dark:text-slate-300">
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

                {actionRoute && (
                    <View className="mt-8 mb-8">
                        <TouchableOpacity
                            onPress={() => router.push(actionRoute)}
                            className="bg-blue-600 p-4 rounded-xl flex-row items-center justify-center shadow-sm active:bg-blue-700"
                        >
                            <Text className="text-white font-bold text-lg">View Details</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}
