import { InboxMessage } from '@/types/inbox';

export const CorrespondenceService = {
    fetchMessages: async (): Promise<InboxMessage[]> => {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return [
            {
                id: '1',
                type: 'NAVADMIN',
                subject: 'Test Subject',
                body: 'Test Body',
                timestamp: new Date().toISOString(),
                isRead: false,
                isPinned: false
            }
        ];
    },
    generateDummyMessages: () => []
};
