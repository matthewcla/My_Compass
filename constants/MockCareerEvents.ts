import type { CareerEvent } from '@/types/career';

// =============================================================================
// SHARED / LEGACY — Original array kept for backward compatibility
// =============================================================================

export const MOCK_CAREER_EVENTS: CareerEvent[] = [
    {
        eventId: 'evt_001',
        eventType: 'ADVANCEMENT_EXAM',
        title: 'March NWAE Cycle 263',
        date: '2024-03-14T07:30:00Z',
        location: 'Base Theater',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_002',
        eventType: 'STATUTORY_BOARD',
        title: 'FY-26 Chief Selection Board',
        date: '2024-05-20T08:00:00Z',
        location: 'NPC Millington',
        attendanceStatus: 'EXCUSED',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_003',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'Command Quarters',
        date: '2024-03-01T07:00:00Z',
        location: 'Main Deck',
        attendanceStatus: 'PRESENT',
        priority: 'CRITICAL',
        qr_token: 'valid_token_123',
    },
    {
        eventId: 'evt_004',
        eventType: 'ADMIN_BOARD',
        title: 'JSOQ Board',
        date: '2024-04-15T09:00:00Z',
        location: 'Conference Room B',
        attendanceStatus: 'PENDING',
        priority: 'STANDARD',
    },
    {
        eventId: 'evt_005',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'PRT Cycle 2024-1',
        date: '2024-05-10T06:00:00Z',
        location: 'Base Gym',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
];

// =============================================================================
// PERSONA A: AT1 Marcus Trent — Avionics Technician (demo-user-1)
// =============================================================================

const CAREER_EVENTS_AT: CareerEvent[] = [
    {
        eventId: 'evt_at_001',
        eventType: 'ADVANCEMENT_EXAM',
        title: 'September NWAE Cycle 264 (ATC)',
        date: '2026-09-11T07:30:00Z',
        location: 'Ship Library, USS Gridley',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_at_002',
        eventType: 'STATUTORY_BOARD',
        title: 'FY-27 Chief Selection Board',
        date: '2026-06-02T08:00:00Z',
        location: 'NPC Millington',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_at_003',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'Aviation Safety Stand-Down',
        date: '2026-04-15T07:00:00Z',
        location: 'Hangar Bay 2, USS Gridley',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
        qr_token: 'at_safety_standdown_2026',
    },
    {
        eventId: 'evt_at_004',
        eventType: 'ADMIN_BOARD',
        title: 'EAWS Qualification Board',
        date: '2026-03-20T09:00:00Z',
        location: 'Wardroom, USS Gridley',
        attendanceStatus: 'PRESENT',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_at_005',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'CIWS Live-Fire Certification',
        date: '2026-05-08T05:30:00Z',
        location: 'Weapons Range, Pacific Missile Facility',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_at_006',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'PRT Cycle 2026-1',
        date: '2026-04-01T06:00:00Z',
        location: 'Base Gym, NS Everett',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
];

// =============================================================================
// PERSONA B: LT Angela Navarro — Surface Warfare Officer (demo-user-2)
// =============================================================================

const CAREER_EVENTS_SWO: CareerEvent[] = [
    {
        eventId: 'evt_swo_001',
        eventType: 'STATUTORY_BOARD',
        title: 'FY-27 O-4 (LCDR) Selection Board',
        date: '2026-07-14T08:00:00Z',
        location: 'NPC Millington',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_swo_002',
        eventType: 'ADMIN_BOARD',
        title: 'FITREP Submission — Detaching OER',
        date: '2026-04-01T09:00:00Z',
        location: 'SWOS San Diego',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_swo_003',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'OCS Alumni Leadership Symposium',
        date: '2026-05-22T08:00:00Z',
        location: 'Newport, RI (Virtual)',
        attendanceStatus: 'PENDING',
        priority: 'STANDARD',
    },
    {
        eventId: 'evt_swo_004',
        eventType: 'ADMIN_BOARD',
        title: 'DH Screening Board',
        date: '2026-08-04T08:00:00Z',
        location: 'PERS-41, NPC Millington',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_swo_005',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'PRT Cycle 2026-1',
        date: '2026-03-18T06:00:00Z',
        location: 'NBSD Fitness Center',
        attendanceStatus: 'PRESENT',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_swo_006',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'SWO Board Prep — Mock Board',
        date: '2026-03-05T13:00:00Z',
        location: 'SWOS Classroom 204',
        attendanceStatus: 'PRESENT',
        priority: 'STANDARD',
    },
];

// =============================================================================
// PERSONA C: ETN1 Devon Hargrove — Submarine Nuclear Electrician (demo-user-3)
// =============================================================================

const CAREER_EVENTS_ETN: CareerEvent[] = [
    {
        eventId: 'evt_etn_001',
        eventType: 'ADMIN_BOARD',
        title: 'Submarine Qualification Board (SUBS)',
        date: '2026-03-10T08:00:00Z',
        location: 'Wardroom, USS Louisiana',
        attendanceStatus: 'PRESENT',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_etn_002',
        eventType: 'ADVANCEMENT_EXAM',
        title: 'September NWAE Cycle 264 (ETCS)',
        date: '2026-09-11T07:30:00Z',
        location: 'Sub Base Chapel, NBK-Bangor',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_etn_003',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'Reactor Safeguards Exam (RSE)',
        date: '2026-04-22T06:00:00Z',
        location: 'Reactor Compartment, USS Louisiana',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
        qr_token: 'etn_rse_2026q2',
    },
    {
        eventId: 'evt_etn_004',
        eventType: 'STATUTORY_BOARD',
        title: 'FY-27 Chief Selection Board',
        date: '2026-06-02T08:00:00Z',
        location: 'NPC Millington',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_etn_005',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'ORSE Prep — Engineering Drill Set',
        date: '2026-05-15T04:00:00Z',
        location: 'USS Louisiana (underway)',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_etn_006',
        eventType: 'ADMIN_BOARD',
        title: 'EWS Re-Qualification Board',
        date: '2026-06-20T09:00:00Z',
        location: 'Submarine Training Facility, NBK-Bangor',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
];

// =============================================================================
// PERSONA D: IT1 Matthew Wilson — IT Professional (demo-user-4)
// =============================================================================

const CAREER_EVENTS_IT: CareerEvent[] = [
    {
        eventId: 'evt_it_001',
        eventType: 'ADVANCEMENT_EXAM',
        title: 'March NWAE Cycle 265 (ITC)',
        date: '2026-03-14T07:30:00Z',
        location: 'Base Theater, NS Norfolk',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_it_002',
        eventType: 'STATUTORY_BOARD',
        title: 'FY-27 Chief Selection Board',
        date: '2026-06-02T08:00:00Z',
        location: 'NPC Millington',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_it_003',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'Command Quarters',
        date: '2026-03-01T07:00:00Z',
        location: 'Hangar Bay 1, USS Gerald R. Ford',
        attendanceStatus: 'PRESENT',
        priority: 'CRITICAL',
        qr_token: 'it_quarters_2026mar',
    },
    {
        eventId: 'evt_it_004',
        eventType: 'ADMIN_BOARD',
        title: 'JSOQ Board',
        date: '2026-04-15T09:00:00Z',
        location: 'Conference Room B, USS Gerald R. Ford',
        attendanceStatus: 'PENDING',
        priority: 'STANDARD',
    },
    {
        eventId: 'evt_it_005',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'PRT Cycle 2026-1',
        date: '2026-05-10T06:00:00Z',
        location: 'Base Gym, NS Norfolk',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
];

// =============================================================================
// PER-PERSONA LOOKUP
// =============================================================================

const CAREER_EVENTS_BY_USER: Record<string, CareerEvent[]> = {
    'demo-user-1': CAREER_EVENTS_AT,
    'demo-user-2': CAREER_EVENTS_SWO,
    'demo-user-3': CAREER_EVENTS_ETN,
    'demo-user-4': CAREER_EVENTS_IT,
};

/**
 * Get career events for a specific persona/user ID.
 * Falls back to the legacy shared array for unknown user IDs.
 */
export const getCareerEventsByUserId = (userId: string): CareerEvent[] => {
    return CAREER_EVENTS_BY_USER[userId] ?? MOCK_CAREER_EVENTS;
};
