import { create } from 'zustand';
import { InboxMessage } from '@/types/inbox';
import { services } from '@/services/api/serviceRegistry';
import { storage } from '@/services/storage';

const MAX_INBOX_MESSAGES = 500;

const sortByNewest = (a: InboxMessage, b: InboxMessage) =>
    a.timestamp < b.timestamp ? 1 : a.timestamp > b.timestamp ? -1 : 0;

const clipMessages = (messages: InboxMessage[]) =>
    [...messages].sort(sortByNewest).slice(0, MAX_INBOX_MESSAGES);

interface InboxState {
    messages: InboxMessage[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
    fetchMessages: (options?: { force?: boolean }) => Promise<void>;
    markAsRead: (id: string) => void;
    togglePin: (id: string) => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchMessages: async (options) => {
        const { messages, lastFetched, isLoading } = get();
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        // Skip if data is fresh and not forced
        if (!options?.force && messages.length > 0 && lastFetched && (now - lastFetched < CACHE_DURATION)) {
            return;
        }

        // Prevent duplicate requests if already loading and not forced
        if (isLoading && !options?.force) return;

        set({ isLoading: true, error: null });
        try {
            // Load from cache only if we don't have messages in memory (Hydration)
            if (messages.length === 0) {
                const cached = await storage.getInboxMessages();
                if (cached.length > 0) {
                    set({ messages: clipMessages(cached), isLoading: false });
                }
            }

            // Fetch fresh data via service
            const inboxResult = await services.inbox.fetchMessages();
            if (!inboxResult.success) throw new Error(inboxResult.error.message);
            const newMessages = inboxResult.data;

            const existingById = new Map(get().messages.map((m) => [m.id, m]));
            const mergedMessages = clipMessages(
                newMessages.map((msg) => {
                    const existing = existingById.get(msg.id);
                    return existing
                        ? { ...msg, isRead: existing.isRead, isPinned: existing.isPinned }
                        : msg;
                })
            );

            set({ messages: mergedMessages, isLoading: false, lastFetched: Date.now() });

            // Update cache
            await storage.saveInboxMessages(mergedMessages);
        } catch (error) {
            // If we have cached messages (in memory), just warn. Otherwise set error state.
            if (get().messages.length === 0) {
                set({ isLoading: false, error: 'Failed to fetch messages' });
            } else {
                console.warn('Failed to fetch fresh messages', error);
                set({ isLoading: false });
            }
        }
    },

    markAsRead: (id: string) => {
        const messages = get().messages;
        const newMessages = messages.map(m => m.id === id ? { ...m, isRead: true } : m);
        set({ messages: newMessages });
        storage.updateInboxMessageReadStatus(id, true).catch(e => console.error('Failed to save read status', e));
    },

    togglePin: (id: string) => {
        const messages = get().messages;
        const message = messages.find(m => m.id === id);
        if (!message) return;

        const newMessages = messages.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m);
        set({ messages: newMessages });
        storage.updateInboxMessagePinStatus(id, !message.isPinned).catch(e => console.error('Failed to save pin status', e));
    }
}));
