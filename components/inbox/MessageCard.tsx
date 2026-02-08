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

    let accentColor = 'bg-slate-200 dark:bg-slate-800'; // Default
    let accentBorder = 'border-l-4 border-slate-300 dark:border-slate-700';

    if (isNavAdmin) {
        accentColor = 'bg-blue-50 dark:bg-blue-950/20';
        accentBorder = 'border-l-4 border-blue-500';
    } else if (isStatusReport) {
        accentColor = 'bg-yellow-50 dark:bg-yellow-950/20';
        accentBorder = 'border-l-4 border-yellow-500';
    }

    const formattedDate = format(new Date(message.timestamp), 'dd MMM yy').toUpperCase();
    const isUnread = !message.isRead;

    return (
        <TouchableOpacity
            onPress={() => onPress?.(message.id)}
            className={`mb-3 mx-4 p-4 rounded-lg shadow-sm ${accentColor} ${accentBorder}`}
            accessibilityHint="Double tap to open message details"
        >
            <View className="flex-row justify-between items-start mb-2">
                <View className="flex-row items-center gap-2">
                    {isUnread && (
                        <View className="w-2.5 h-2.5 rounded-full bg-blue-500" accessibilityLabel="Unread" />
                    )}
                    <View className={`px-2 py-1 rounded-full ${isNavAdmin ? 'bg-blue-100 dark:bg-blue-900' : isStatusReport ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <Text className={`text-xs font-bold ${isNavAdmin ? 'text-blue-800 dark:text-blue-200' : isStatusReport ? 'text-yellow-800 dark:text-yellow-200' : 'text-slate-700 dark:text-slate-300'}`}>
                            {message.type.replace('_', ' ')}
                        </Text>
                    </View>
                </View>

                <View className="flex-row items-center gap-2">
                    <Text className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        {formattedDate}
                    </Text>
                    <TouchableOpacity
                        onPress={() => onTogglePin?.(message.id)}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel={message.isPinned ? "Unpin message" : "Pin message"}
                        accessibilityState={{ selected: message.isPinned }}
                    >
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
