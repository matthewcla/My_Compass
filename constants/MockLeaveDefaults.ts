import type { LeaveRequestDefaults } from '@/types/schema';

export const MOCK_LEAVE_DEFAULTS: LeaveRequestDefaults = {
    leaveAddress: '',
    leavePhoneNumber: '',
    emergencyContact: {
        name: 'Sarah Connor',
        relationship: 'Mother',
        phoneNumber: '555-867-5309',
    },
    dutySection: 'Deck Department',
    deptDiv: 'First Division',
    dutyPhone: '555-000-1111',
    rationStatus: 'not_applicable',
};

// =============================================================================
// PER-PERSONA LEAVE DEFAULTS
// =============================================================================

const LEAVE_DEFAULTS_BY_USER: Record<string, LeaveRequestDefaults> = {
    // Persona A: AT1 Marcus Trent — married, 3 dependents, USS Gridley
    'demo-user-1': {
        leaveAddress: '4318 Cascade Dr, Everett, WA 98207',
        leavePhoneNumber: '425-555-0147',
        emergencyContact: {
            name: 'Maria Trent',
            relationship: 'Spouse',
            phoneNumber: '425-555-0192',
        },
        dutySection: 'Section 2',
        deptDiv: 'Combat Systems / AT Shop',
        dutyPhone: '425-304-3000',
        rationStatus: 'commuted',
    },
    // Persona B: LT Angela Navarro — single, O-3, SWOS San Diego
    'demo-user-2': {
        leaveAddress: '1120 Harbor Island Dr Apt 4B, San Diego, CA 92101',
        leavePhoneNumber: '619-555-0233',
        emergencyContact: {
            name: 'Rosa Navarro',
            relationship: 'Mother',
            phoneNumber: '619-555-0847',
        },
        dutySection: 'N/A (Staff)',
        deptDiv: 'SWOS Student',
        dutyPhone: '619-556-8200',
        rationStatus: 'not_applicable',
    },
    // Persona C: ETN1 Devon Hargrove — married, 2 dependents, USS Louisiana (SSBN)
    'demo-user-3': {
        leaveAddress: '910 Trident Ave, Silverdale, WA 98315',
        leavePhoneNumber: '360-555-0419',
        emergencyContact: {
            name: 'Keisha Hargrove',
            relationship: 'Spouse',
            phoneNumber: '360-555-0316',
        },
        dutySection: 'Gold Crew — Section 1',
        deptDiv: 'Reactor / Electrical Division',
        dutyPhone: '360-396-6111',
        rationStatus: 'commuted',
    },
    // Persona D: IT1 Matthew Wilson — married, 2 dependents, USS Gerald R. Ford
    'demo-user-4': {
        leaveAddress: '2145 Tidewater Dr, Norfolk, VA 23505',
        leavePhoneNumber: '757-555-0312',
        emergencyContact: {
            name: 'Jessica Wilson',
            relationship: 'Spouse',
            phoneNumber: '757-555-0198',
        },
        dutySection: 'Section 3',
        deptDiv: 'Combat Systems / IT Division',
        dutyPhone: '757-443-7000',
        rationStatus: 'commuted',
    },
};

/**
 * Get leave defaults for a specific persona/user ID.
 * Falls back to the legacy shared defaults for unknown user IDs.
 */
export const getLeaveDefaults = (userId: string): LeaveRequestDefaults => {
    return LEAVE_DEFAULTS_BY_USER[userId] ?? MOCK_LEAVE_DEFAULTS;
};
