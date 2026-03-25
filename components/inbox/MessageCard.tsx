import { InboxMessage } from '@/types/inbox';
import { format } from 'date-fns';
import { Pin } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface MessageCardProps {
    message: InboxMessage;
    onPress?: (id: string) => void;
    onTogglePin?: (id: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = React.memo(({ message, onPress, onTogglePin }) => {
    const isNavAdmin = message.type === 'NAVADMIN';
    const isStatusReport = message.type === 'STATUS_REPORT';

    let badgeText = 'text-slate-600 dark:text-slate-400';

    if (isNavAdmin) {
        badgeText = 'text-blue-600 dark:text-blue-400';
    } else if (isStatusReport) {
        badgeText = 'text-amber-600 dark:text-amber-500';
    }

    const formattedDate = format(new Date(message.timestamp), 'dd MMM yy').toUpperCase();
    const isUnread = !message.isRead;

    return (
        <TouchableOpacity
            onPress={() => onPress?.(message.id)}
            activeOpacity={0.8}
            className="mb-3 mx-4 p-4 rounded-2xl shadow-sm bg-white/95 dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 active:scale-[0.98]"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2">
                    {isUnread && (
                        <View className="w-2.5 h-2.5 rounded-full bg-[#C9A227] shadow-[0_0_8px_rgba(201,162,39,0.5)]" />
                    )}
                    <View className="px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50">
                        <Text className={`text-[10px] tracking-[1.5px] font-bold uppercase ${badgeText}`}>
                            {message.type.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formattedDate}
                    </Text>
                    <TouchableOpacity onPress={() => onTogglePin?.(message.id)} hitSlop={10}>
                        <Pin
                            size={16}
                            color={message.isPinned ? '#0f172a' : '#94a3b8'}
                            fill={message.isPinned ? '#0f172a' : 'transparent'}
                        />
                    </TouchableOpacity>
                </View>
            </View>

            <View className="flex-row justify-between items-center mb-1">
                <Text className={`text-base text-slate-900 dark:text-slate-100 flex-1 mr-2 ${isUnread ? 'font-extrabold' : 'font-semibold'}`} numberOfLines={1}>
                    {message.subject}
                </Text>
            </View>

            <Text className="text-sm text-slate-600 dark:text-slate-400 leading-5" numberOfLines={2}>
                {message.body}
            </Text>
        </TouchableOpacity>
    );
});
