import { PCSOrder, PCSSegment } from '@/types/pcs';

const NOW = new Date();
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;

// Helper to format dates
const getDate = (daysFromNow: number) => new Date(NOW.getTime() + daysFromNow * ONE_DAY).toISOString();

const SEGMENT_1: PCSSegment = {
  id: 'seg-1-origin',
  type: 'ORIGIN',
  title: 'Detach USS Gridley',
  location: {
    name: 'USS Gridley',
    uic: '23456',
    zip: '98207',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(-365 * 2), // Arrived 2 years ago
    projectedDeparture: getDate(-30),    // Departed 30 days ago
    nlt: getDate(-30),
  },
  entitlements: {
    authorizedTravelDays: 4,
    proceedDays: 0,
    leaveDays: 0,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
  },
  status: 'COMPLETE',
};

const SEGMENT_2: PCSSegment = {
  id: 'seg-2-school',
  type: 'INTERMEDIATE',
  title: 'Report to C-School',
  location: {
    name: 'C-School (IWTC)',
    uic: '34567',
    zip: '92136',
    type: 'SCHOOL',
  },
  dates: {
    projectedArrival: getDate(-20),      // Arrived 20 days ago
    projectedDeparture: getDate(100),    // Departing in 100 days (~4 months total)
    nlt: getDate(-15),
  },
  entitlements: {
    authorizedTravelDays: 1,
    proceedDays: 0,
    leaveDays: 0,
  },
  userPlan: {
    mode: null, // Planning
    isAccompanied: false,
  },
  status: 'PLANNING',
};

const SEGMENT_3: PCSSegment = {
  id: 'seg-3-dest',
  type: 'DESTINATION',
  title: 'Report to USS Higgins',
  location: {
    name: 'USS Higgins',
    uic: '45678',
    zip: '96349', // APO/FPO
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(110),     // Arrive after school
    projectedDeparture: getDate(110 + 365 * 3),
    nlt: getDate(120),
  },
  entitlements: {
    authorizedTravelDays: 1,
    proceedDays: 4,
    leaveDays: 30,
  },
  userPlan: {
    mode: 'AIR',
    isAccompanied: false,
  },
  status: 'LOCKED', // Can't edit destination details easily
};

export const MOCK_PCS_ORDERS: PCSOrder = {
  orderNumber: 'ORD-2024-001',
  gainingCommand: {
    name: 'USS Higgins (DDG-76)',
    uic: '45678',
  },
  segments: [SEGMENT_1, SEGMENT_2, SEGMENT_3],
  isOconus: true,
  isSeaDuty: true,
};
