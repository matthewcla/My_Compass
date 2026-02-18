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
