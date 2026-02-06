import { InboxMessage, InboxMessageType } from '@/types/inbox';

const INBOX_MESSAGE_IDS = [
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555',
    '66666666-6666-4666-8666-666666666666',
    '77777777-7777-4777-8777-777777777777',
    '88888888-8888-4888-8888-888888888888',
    '99999999-9999-4999-8999-999999999999',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
] as const;

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
            id: INBOX_MESSAGE_IDS[0],
            type: 'NAVADMIN',
            subject: 'NAVADMIN 105/26: FY-26 Navy Community Health Assessment',
            body: 'This NAVADMIN announces the release of the Fiscal Year 2026 Navy Community Health Assessment. All commands are directed to review...',
            timestamp: daysAgo(0),
            isRead: false,
            isPinned: true,
            metadata: { reference: 'NAVADMIN 105/26' }
        },
        {
            id: INBOX_MESSAGE_IDS[1],
            type: 'GENERAL_ADMIN',
            subject: 'Orders Released: LT Maverick',
            body: 'You have new orders released. Please report to your detailer or check MyNavy Assignment for details regarding your transfer to NAS North Island.',
            timestamp: daysAgo(1),
            isRead: false,
            isPinned: false,
            metadata: { link: '/orders/view' }
        },
        {
            id: INBOX_MESSAGE_IDS[2],
            type: 'ALNAV',
            subject: 'ALNAV 012/26: New Uniform Policy Update',
            body: 'The Secretary of the Navy has approved updates to the uniform regulations regarding optional physical training gear...',
            timestamp: daysAgo(2),
            isRead: true,
            isPinned: false,
            metadata: { reference: 'ALNAV 012/26' }
        },
        {
            id: INBOX_MESSAGE_IDS[3],
            type: 'STATUS_REPORT',
            subject: 'Weekly Readiness Report - Week 12',
            body: 'Your unit readiness stats have been updated. Overall readiness is at 92%. Medical readiness is 98%.',
            timestamp: daysAgo(3),
            isRead: false,
            isPinned: false,
            metadata: { reportId: 'WRR-2026-12' }
        },
        {
            id: INBOX_MESSAGE_IDS[4],
            type: 'NAVADMIN',
            subject: 'NAVADMIN 106/26: Physical Readiness Program Update',
            body: 'Updates to the PRT standards for the upcoming cycle. Plank scoring tables have been adjusted.',
            timestamp: daysAgo(4),
            isRead: true,
            isPinned: false,
            metadata: { reference: 'NAVADMIN 106/26' }
        },
        {
            id: INBOX_MESSAGE_IDS[5],
            type: 'ALNAV',
            subject: 'ALNAV 013/26: Tuition Assistance Policy Change',
            body: 'Effective immediately, the cap on Tuition Assistance has been raised for eligible sailors pursuing STEM degrees.',
            timestamp: daysAgo(5),
            isRead: false,
            isPinned: false,
            metadata: { reference: 'ALNAV 013/26' }
        },
        {
            id: INBOX_MESSAGE_IDS[6],
            type: 'STATUS_REPORT',
            subject: 'Maintenance Cycle Completion',
            body: 'The scheduled maintenance for System X has been completed successfully. All systems go.',
            timestamp: daysAgo(6),
            isRead: true,
            isPinned: false,
            metadata: { jobId: 'MAINT-X-2026' }
        },
        {
            id: INBOX_MESSAGE_IDS[7],
            type: 'GENERAL_ADMIN',
            subject: 'Cyber Awareness Challenge Due',
            body: 'Reminder: Your annual Cyber Awareness Challenge training is due in 15 days. Please complete it on TWMS.',
            timestamp: daysAgo(7),
            isRead: false,
            isPinned: true,
            metadata: { priority: 'high', dueInDays: 15 }
        },
        {
            id: INBOX_MESSAGE_IDS[8],
            type: 'NAVADMIN',
            subject: 'NAVADMIN 107/26: Advancement Exam Bibliographies',
            body: 'Bibliographies for the upcoming NWAE cycle have been posted to MyNavy Portal.',
            timestamp: daysAgo(8),
            isRead: true,
            isPinned: false,
            metadata: { reference: 'NAVADMIN 107/26' }
        },
        {
            id: INBOX_MESSAGE_IDS[9],
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
        return generateDummyMessages();
    },

    /**
     * Helper to generate dummy messages (exposed for testing or other uses)
     */
    generateDummyMessages
};
