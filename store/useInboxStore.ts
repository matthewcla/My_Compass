import { create } from 'zustand';
import { InboxMessage } from '@/types/inbox';
import { CorrespondenceService } from '@/services/correspondence';

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
            const messages = await CorrespondenceService.fetchMessages();
            set({ messages, isLoading: false });
        } catch (error) {
            set({ isLoading: false, error: 'Failed to fetch messages' });
        }
    },

    markAsRead: (id: string) => {
        set(state => ({
            messages: state.messages.map(m => m.id === id ? { ...m, isRead: true } : m)
        }));
    },

    togglePin: (id: string) => {
        set(state => ({
            messages: state.messages.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m)
        }));
    }
}));
