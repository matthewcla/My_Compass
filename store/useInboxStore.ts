import { create } from 'zustand';
import { InboxMessage } from '@/types/inbox';
import { CorrespondenceService } from '@/services/correspondence';
import { storage } from '@/services/storage';

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
                    set({ messages: cached, isLoading: false });
                }
            }

            // Fetch fresh data
            const newMessages = await CorrespondenceService.fetchMessages();
            set({ messages: newMessages, isLoading: false, lastFetched: Date.now() });

            // Update cache
            await storage.saveInboxMessages(newMessages);
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
        const newMessages = get().messages.map(m => m.id === id ? { ...m, isRead: true } : m);
        set({ messages: newMessages });
        storage.saveInboxMessages(newMessages).catch(e => console.error('Failed to save read status', e));
    },

    togglePin: (id: string) => {
        const newMessages = get().messages.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m);
        set({ messages: newMessages });
        storage.saveInboxMessages(newMessages).catch(e => console.error('Failed to save pin status', e));
    }
}));
