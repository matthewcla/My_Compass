import { MessageCard } from '@/components/inbox/MessageCard';
import { useScreenHeader } from '@/hooks/useScreenHeader';
import { useInboxStore } from '@/store/useInboxStore';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { SectionList, Text, TouchableOpacity, View } from 'react-native';

type FilterType = 'All' | 'Official' | 'My Status' | 'Pinned';

export default function InboxScreen() {
    useScreenHeader("Inbox", "Notifications");
    const { messages, fetchMessages, isLoading, togglePin } = useInboxStore();
    const router = useRouter();
    const [activeFilter, setActiveFilter] = useState<FilterType>('All');

    useEffect(() => {
        fetchMessages();
    }, []);

    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            switch (activeFilter) {
                case 'Official':
                    return msg.type === 'NAVADMIN' || msg.type === 'ALNAV';
                case 'My Status':
                    return msg.type === 'STATUS_REPORT' || msg.type === 'GENERAL_ADMIN';
                case 'Pinned':
                    return msg.isPinned;
                default:
                    return true;
            }
        });
    }, [messages, activeFilter]);

    const sections = useMemo(() => {
        // Sort logic: Pinned (Quick Reference) -> Unread -> Read (by date desc)

        const pinned = filteredMessages.filter(m => m.isPinned);
        const unread = filteredMessages.filter(m => !m.isPinned && !m.isRead).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        const read = filteredMessages.filter(m => !m.isPinned && m.isRead).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

        const result = [];

        if (pinned.length > 0) {
            result.push({ title: 'Quick Reference', data: pinned });
        }

        // Combine unread and read for the main list, or separate if desired. 
        // Requirement said: Pinned -> Unread -> Rest.
        // Let's make "Inbox" the title for the rest to keep it simple, or separate sections?
        // "Unread" and "All Others" sections might be nice.

        if (unread.length > 0) {
            result.push({ title: 'Unread', data: unread });
        }

        if (read.length > 0) {
            result.push({ title: 'Read', data: read });
        }

        return result;
    }, [filteredMessages]);

    const renderHeader = () => (
        <View className="px-4 py-3 bg-slate-50 dark:bg-black border-b border-slate-200 dark:border-slate-800">
            <View className="flex-row justify-between bg-slate-200 dark:bg-slate-800 p-1 rounded-lg">
                {(['All', 'Official', 'My Status', 'Pinned'] as FilterType[]).map((filter) => (
                    <TouchableOpacity
                        key={filter}
                        onPress={() => setActiveFilter(filter)}
                        className={`flex-1 items-center py-1.5 rounded-md ${activeFilter === filter ? 'bg-white dark:bg-slate-600 shadow-sm' : ''}`}
                    >
                        <Text className={`text-xs font-semibold ${activeFilter === filter ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                            {filter}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50 dark:bg-black">
            <SectionList
                sections={sections}
                renderItem={({ item }) => (
                    <MessageCard
                        message={item}
                        onPress={() => router.push(`/inbox/${item.id}`)}
                        onTogglePin={togglePin}
                    />
                )}
                renderSectionHeader={({ section: { title } }) => (
                    <View className="px-4 py-2 bg-slate-100 dark:bg-slate-900/50">
                        <Text className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase">{title}</Text>
                    </View>
                )}
                keyExtractor={item => item.id}
                ListHeaderComponent={renderHeader}
                stickySectionHeadersEnabled={false} // Sticky headers with sticky list header can be tricky, verifying without first
                contentContainerStyle={{ paddingBottom: 24 }}
                refreshing={isLoading}
                onRefresh={fetchMessages}
                ListEmptyComponent={
                    <View className="p-8 items-center">
                        <Text className="text-slate-400 dark:text-slate-500 text-center">No messages found.</Text>
                    </View>
                }
            />
        </View>
    );
}
