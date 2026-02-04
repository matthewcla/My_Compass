import { InboxMessage, InboxMessageType } from '@/types/inbox';

// Simple UUID generator
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

const generateDummyMessages = (): InboxMessage[] => {
    const now = new Date();

    // Helper to get ISO string for days ago
    const daysAgo = (days: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    return [
        {
            id: generateUUID(),
            type: 'NAVADMIN',
            subject: 'NAVADMIN 105/26: FY-26 Navy Community Health Assessment',
            body: 'This NAVADMIN announces the release of the Fiscal Year 2026 Navy Community Health Assessment. All commands are directed to review...',
            timestamp: daysAgo(0),
            isRead: false,
            isPinned: true,
            metadata: { reference: 'NAVADMIN 105/26' }
        },
        {
            id: generateUUID(),
            type: 'GENERAL_ADMIN',
            subject: 'Orders Released: LT Maverick',
            body: 'You have new orders released. Please report to your detailer or check MyNavy Assignment for details regarding your transfer to NAS North Island.',
            timestamp: daysAgo(1),
            isRead: false,
            isPinned: false,
            metadata: { link: '/orders/view' }
        },
        {
            id: generateUUID(),
            type: 'ALNAV',
            subject: 'ALNAV 012/26: New Uniform Policy Update',
            body: 'The Secretary of the Navy has approved updates to the uniform regulations regarding optional physical training gear...',
            timestamp: daysAgo(2),
            isRead: true,
            isPinned: false,
            metadata: { reference: 'ALNAV 012/26' }
        },
        {
            id: generateUUID(),
            type: 'STATUS_REPORT',
            subject: 'Weekly Readiness Report - Week 12',
            body: 'Your unit readiness stats have been updated. Overall readiness is at 92%. Medical readiness is 98%.',
            timestamp: daysAgo(3),
            isRead: false,
            isPinned: false,
            metadata: { reportId: 'WRR-2026-12' }
        },
        {
            id: generateUUID(),
            type: 'NAVADMIN',
            subject: 'NAVADMIN 106/26: Physical Readiness Program Update',
            body: 'Updates to the PRT standards for the upcoming cycle. Plank scoring tables have been adjusted.',
            timestamp: daysAgo(4),
            isRead: true,
            isPinned: false,
            metadata: { reference: 'NAVADMIN 106/26' }
        },
        {
            id: generateUUID(),
            type: 'ALNAV',
            subject: 'ALNAV 013/26: Tuition Assistance Policy Change',
            body: 'Effective immediately, the cap on Tuition Assistance has been raised for eligible sailors pursuing STEM degrees.',
            timestamp: daysAgo(5),
            isRead: false,
            isPinned: false,
            metadata: { reference: 'ALNAV 013/26' }
        },
        {
            id: generateUUID(),
            type: 'STATUS_REPORT',
            subject: 'Maintenance Cycle Completion',
            body: 'The scheduled maintenance for System X has been completed successfully. All systems go.',
            timestamp: daysAgo(6),
            isRead: true,
            isPinned: false,
            metadata: { jobId: 'MAINT-X-2026' }
        },
        {
            id: generateUUID(),
            type: 'GENERAL_ADMIN',
            subject: 'Cyber Awareness Challenge Due',
            body: 'Reminder: Your annual Cyber Awareness Challenge training is due in 15 days. Please complete it on TWMS.',
            timestamp: daysAgo(7),
            isRead: false,
            isPinned: true,
            metadata: { priority: 'high', dueInDays: 15 }
        },
        {
            id: generateUUID(),
            type: 'NAVADMIN',
            subject: 'NAVADMIN 107/26: Advancement Exam Bibliographies',
            body: 'Bibliographies for the upcoming NWAE cycle have been posted to MyNavy Portal.',
            timestamp: daysAgo(8),
            isRead: true,
            isPinned: false,
            metadata: { reference: 'NAVADMIN 107/26' }
        },
        {
            id: generateUUID(),
            type: 'GENERAL_ADMIN',
            subject: 'Command Picnic Announcement',
            body: 'The annual command picnic will be held next Saturday at the base park. RSVP by Wednesday.',
            timestamp: daysAgo(9),
            isRead: false,
            isPinned: false,
            metadata: { eventId: 'PICNIC-2026' }
        }
    ];
};

export const CorrespondenceService = {
    /**
     * Simulates fetching inbox messages from a remote server.
     */
    fetchMessages: async (): Promise<InboxMessage[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        return generateDummyMessages();
    },

    /**
     * Helper to generate dummy messages (exposed for testing or other uses)
     */
    generateDummyMessages
};
