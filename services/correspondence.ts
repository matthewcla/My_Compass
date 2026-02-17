import { InboxMessage } from '@/types/inbox';
import { useDemoStore } from '@/store/useDemoStore';
import { useUserStore } from '@/store/useUserStore';

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

/**
 * Returns the active user for correspondence personalization.
 */
const getActiveUser = (): { id: string; title: string; displayName: string; rating: string } => {
    const demo = useDemoStore.getState();
    if (demo.isDemoMode && demo.selectedUser) {
        const u = demo.selectedUser;
        return {
            id: u.id,
            title: u.title ?? u.rank ?? '',
            displayName: u.displayName,
            rating: u.rating ?? '',
        };
    }
    const u = useUserStore.getState().user;
    return {
        id: u?.id ?? 'unknown',
        title: u?.title ?? u?.rank ?? '',
        displayName: u?.displayName ?? 'Sailor',
        rating: u?.rating ?? '',
    };
};

// =============================================================================
// SHARED MESSAGES (Navy-wide NAVADMINs/ALNAVs everyone sees)
// =============================================================================

const generateSharedMessages = (daysAgo: (d: number) => string): InboxMessage[] => [
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
];

// =============================================================================
// PER-PERSONA MESSAGES
// =============================================================================

type PersonaMessageFn = (user: { title: string; displayName: string }, daysAgo: (d: number) => string) => InboxMessage[];

const PERSONA_MESSAGES_AT: PersonaMessageFn = (user, daysAgo) => [
    {
        id: INBOX_MESSAGE_IDS[1],
        type: 'GENERAL_ADMIN',
        subject: `Orders Released: ${user.title} ${user.displayName}`,
        body: 'You have new orders released. Report to your detailer or check MyNavy Assignment for details regarding your upcoming PCS transfer.',
        timestamp: daysAgo(1),
        isRead: false,
        isPinned: false,
        metadata: { link: '/orders/view' }
    },
    {
        id: INBOX_MESSAGE_IDS[3],
        type: 'STATUS_REPORT',
        subject: 'CIWS Block 1B Certification — Passed',
        body: `${user.title} ${user.displayName}: Your CIWS Block 1B live-fire certification has been recorded as PASSED. NEC 8342 is now active in your record.`,
        timestamp: daysAgo(3),
        isRead: false,
        isPinned: false,
        metadata: { nec: '8342' }
    },
    {
        id: INBOX_MESSAGE_IDS[6],
        type: 'GENERAL_ADMIN',
        subject: 'Aviation Safety Stand-Down — Mandatory Attendance',
        body: 'All aviation-rated personnel aboard USS Gridley are required to attend the Aviation Safety Stand-Down on 15 APR. Report to Hangar Bay 2 at 0700.',
        timestamp: daysAgo(6),
        isRead: true,
        isPinned: false,
        metadata: { eventId: 'AVN-SAFETY-2026' }
    },
    {
        id: INBOX_MESSAGE_IDS[9],
        type: 'STATUS_REPORT',
        subject: 'NWAE Cycle 264 — Exam Results Pending',
        body: 'Your September NWAE (ATC) exam has been received at NPC. Results will be posted to MyNavy Portal within 90 days.',
        timestamp: daysAgo(9),
        isRead: false,
        isPinned: false,
        metadata: { examCycle: '264' }
    },
];

const PERSONA_MESSAGES_SWO: PersonaMessageFn = (user, daysAgo) => [
    {
        id: INBOX_MESSAGE_IDS[1],
        type: 'GENERAL_ADMIN',
        subject: `FITREP Submission Due: ${user.title} ${user.displayName}`,
        body: 'Your detaching FITREP from SWOS is due NLT 01 APR 2026. Ensure your brag sheet is submitted to your reporting senior.',
        timestamp: daysAgo(1),
        isRead: false,
        isPinned: false,
        metadata: { link: '/fitrep/submit' }
    },
    {
        id: INBOX_MESSAGE_IDS[3],
        type: 'STATUS_REPORT',
        subject: 'FY-27 O-4 Selection Board — Convening',
        body: 'The FY-27 LCDR (1110) Selection Board convenes 14 JUL 2026 at NPC Millington. Ensure your record is complete on OMPF.',
        timestamp: daysAgo(3),
        isRead: false,
        isPinned: true,
        metadata: { boardId: 'FY27-O4-1110' }
    },
    {
        id: INBOX_MESSAGE_IDS[6],
        type: 'GENERAL_ADMIN',
        subject: 'DH Screening Board — Package Due',
        body: 'Your Department Head screening board package is due NLT 15 JUL 2026. Contact your detailer at PERS-41 for package requirements.',
        timestamp: daysAgo(6),
        isRead: true,
        isPinned: false,
        metadata: { link: '/career/dh-screening' }
    },
    {
        id: INBOX_MESSAGE_IDS[9],
        type: 'STATUS_REPORT',
        subject: 'SWOS Division Officer Course — Complete',
        body: `${user.title} ${user.displayName}: You have successfully completed the SWOS Basic Division Officer Course. Certificate has been filed in your training record.`,
        timestamp: daysAgo(9),
        isRead: false,
        isPinned: false,
        metadata: { courseId: 'SWOS-BDO-2026' }
    },
];

const PERSONA_MESSAGES_ETN: PersonaMessageFn = (user, daysAgo) => [
    {
        id: INBOX_MESSAGE_IDS[1],
        type: 'GENERAL_ADMIN',
        subject: `Orders Released: ${user.title} ${user.displayName}`,
        body: 'You have new orders released. Report to your detailer or check MyNavy Assignment for details regarding your upcoming PCS transfer to SUBASE New London.',
        timestamp: daysAgo(1),
        isRead: false,
        isPinned: false,
        metadata: { link: '/orders/view' }
    },
    {
        id: INBOX_MESSAGE_IDS[3],
        type: 'STATUS_REPORT',
        subject: 'Reactor Safeguards Exam — Results',
        body: `${user.title} ${user.displayName}: Your Reactor Safeguards Exam (RSE) for Q2 2026 has been graded. Results: SATISFACTORY. No retake required.`,
        timestamp: daysAgo(3),
        isRead: false,
        isPinned: false,
        metadata: { examId: 'RSE-2026Q2' }
    },
    {
        id: INBOX_MESSAGE_IDS[6],
        type: 'GENERAL_ADMIN',
        subject: 'ORSE Preparation — Drill Schedule Published',
        body: 'The ORSE preparation drill schedule for USS Louisiana has been published. First drill set begins 15 MAY underway. All watchstanders report to maneuvering at 0400.',
        timestamp: daysAgo(6),
        isRead: true,
        isPinned: false,
        metadata: { eventId: 'ORSE-PREP-2026' }
    },
    {
        id: INBOX_MESSAGE_IDS[9],
        type: 'STATUS_REPORT',
        subject: 'NWAE Cycle 264 — Exam Results Pending',
        body: 'Your September NWAE (ETCS) exam has been received at NPC. Results will be posted to MyNavy Portal within 90 days.',
        timestamp: daysAgo(9),
        isRead: false,
        isPinned: false,
        metadata: { examCycle: '264' }
    },
];

const PERSONA_MESSAGES_IT: PersonaMessageFn = (user, daysAgo) => [
    {
        id: INBOX_MESSAGE_IDS[1],
        type: 'GENERAL_ADMIN',
        subject: `Orders Released: ${user.title} ${user.displayName}`,
        body: 'You have new orders released to CETTC Corry Station, Pensacola, FL. Report to your detailer or check MyNavy Assignment for details.',
        timestamp: daysAgo(1),
        isRead: false,
        isPinned: false,
        metadata: { link: '/orders/view' }
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
        id: INBOX_MESSAGE_IDS[6],
        type: 'STATUS_REPORT',
        subject: 'CANES Migration — Phase 3 Complete',
        body: 'The CANES Phase 3 migration aboard USS Gerald R. Ford has been completed. All 47 workstations have been transitioned. ISSM sign-off received.',
        timestamp: daysAgo(6),
        isRead: true,
        isPinned: false,
        metadata: { jobId: 'CANES-P3-CVN78' }
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
    },
];

const PERSONA_MESSAGE_MAP: Record<string, PersonaMessageFn> = {
    'demo-user-1': PERSONA_MESSAGES_AT,
    'demo-user-2': PERSONA_MESSAGES_SWO,
    'demo-user-3': PERSONA_MESSAGES_ETN,
    'demo-user-4': PERSONA_MESSAGES_IT,
};

// =============================================================================
// MESSAGE GENERATION
// =============================================================================

const generateDummyMessages = (): InboxMessage[] => {
    const now = new Date();
    const daysAgo = (days: number) => {
        const date = new Date(now);
        date.setDate(date.getDate() - days);
        return date.toISOString();
    };

    const user = getActiveUser();
    const shared = generateSharedMessages(daysAgo);

    const personaFn = PERSONA_MESSAGE_MAP[user.id];
    if (personaFn) {
        const persona = personaFn(user, daysAgo);
        // Merge: persona-specific + shared, sorted by timestamp descending
        return [...persona, ...shared].sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    // Fallback for non-demo users: shared messages only
    return shared.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
};

export const CorrespondenceService = {
    /**
     * Simulates fetching inbox messages from a remote server.
     * Returns persona-specific correspondence when in demo mode.
     */
    fetchMessages: async (): Promise<InboxMessage[]> => {
        return generateDummyMessages();
    },

    /**
     * Helper to generate dummy messages (exposed for testing or other uses)
     */
    generateDummyMessages
};
