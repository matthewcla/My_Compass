import { create } from 'zustand';
import { InboxMessage } from '@/types/inbox';
import { CorrespondenceService } from '@/services/correspondence';
import { storage } from '@/services/storage';

interface InboxState {
    messages: InboxMessage[];
    isLoading: boolean;
    error: string | null;
    fetchMessages: () => Promise<void>;
    markAsRead: (id: string) => void;
    togglePin: (id: string) => void;
}

export const useInboxStore = create<InboxState>((set, get) => ({
    messages: [],
    isLoading: false,
    error: null,

    fetchMessages: async () => {
        set({ isLoading: true, error: null });
        try {
            // Load from cache first
            const cached = await storage.getInboxMessages();
            if (cached.length > 0) {
                set({ messages: cached, isLoading: false });
            }

            // Fetch fresh data
            const messages = await CorrespondenceService.fetchMessages();
            set({ messages, isLoading: false });

            // Update cache
            await storage.saveInboxMessages(messages);
        } catch (error) {
            // If we have cached messages, just warn. Otherwise set error state.
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
