import { PCSOrder, PCSSegment } from '@/types/pcs';

const NOW = new Date();
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;

// Helper to format dates
const getDate = (daysFromNow: number) => new Date(NOW.getTime() + daysFromNow * ONE_DAY).toISOString();

// =============================================================================
// PERSONA A: "THE FAMILY MOVE" - E-6, Cross-Country with Dependents
// =============================================================================

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
    address: 'Fleet Activities Yokosuka, Pier 11, Yokosuka, Japan 96349',
    zip: '96349',
    quarterdeckPhone: '+81-46-816-1234',
    psdPhone: '+81-46-816-5678',
    oodPhone: '+81-46-816-0000',
    uniformOfDay: 'NWU Type III',
    quarterdeckLocation: { latitude: 35.2916, longitude: 139.6683 },
  },
  segments: [SEGMENT_1, SEGMENT_2, SEGMENT_3],
  reportNLT: SEGMENT_3.dates.nlt,
  isOconus: true,
  isSeaDuty: true,
};

// =============================================================================
// PERSONA B: "THE SINGLE SAILOR" - O-3, Regional Move (San Diego Area)
// =============================================================================

const SEGMENT_B1: PCSSegment = {
  id: 'seg-b1-origin',
  type: 'ORIGIN',
  title: 'Detach C-School IWTC',
  location: {
    name: 'C-School (IWTC)',
    uic: '34567',
    zip: '92136',
    type: 'SCHOOL',
  },
  dates: {
    projectedArrival: getDate(-180), // Arrived 6 months ago
    projectedDeparture: getDate(-10), // Left 10 days ago
    nlt: getDate(-10),
  },
  entitlements: {
    authorizedTravelDays: 1,
    proceedDays: 0,
    leaveDays: 0,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: false,
  },
  status: 'COMPLETE',
};

const SEGMENT_B2: PCSSegment = {
  id: 'seg-b2-dest',
  type: 'DESTINATION',
  title: 'Report to NAB Coronado',
  location: {
    name: 'Naval Amphibious Base Coronado',
    uic: '56789',
    zip: '92155',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(-5),
    projectedDeparture: getDate(-5 + 365 * 2), // 2 year tour
    nlt: getDate(0), // Report today
  },
  entitlements: {
    authorizedTravelDays: 1,
    proceedDays: 2,
    leaveDays: 10,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: false,
  },
  status: 'PLANNING',
};

export const MOCK_PCS_ORDERS_PERSONA_B: PCSOrder = {
  orderNumber: 'ORD-2024-002',
  gainingCommand: {
    name: 'NAB Coronado',
    uic: '56789',
    address: 'Naval Amphibious Base, 3000 Tulagi Rd, Coronado, CA 92155',
    zip: '92155',
    quarterdeckPhone: '+1-619-437-2011',
    psdPhone: '+1-619-437-3456',
    oodPhone: '+1-619-437-0000',
    uniformOfDay: 'NWU Type III',
    quarterdeckLocation: { latitude: 32.6811, longitude: -117.1565 },
  },
  segments: [SEGMENT_B1, SEGMENT_B2],
  reportNLT: SEGMENT_B2.dates.nlt,
  isOconus: false,
  isSeaDuty: false,
};

// =============================================================================
// PERSONA C: "THE CAREER SAILOR" - E-6, Cross-Country Submarine Transfer
// =============================================================================

const SEGMENT_C1: PCSSegment = {
  id: 'seg-c1-origin',
  type: 'ORIGIN',
  title: 'Detach USS Michigan',
  location: {
    name: 'USS Michigan (SSGN-727)',
    uic: '11111',
    zip: '98315',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(-365 * 3), // 3 years ago
    projectedDeparture: getDate(-45),
    nlt: getDate(-45),
  },
  entitlements: {
    authorizedTravelDays: 5,
    proceedDays: 0,
    leaveDays: 0,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
  },
  status: 'COMPLETE',
};

const SEGMENT_C2: PCSSegment = {
  id: 'seg-c2-dest',
  type: 'DESTINATION',
  title: 'Report to Submarine Base New London',
  location: {
    name: 'SUBASE New London',
    uic: '22222',
    zip: '06340',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(-30),
    projectedDeparture: getDate(-30 + 365 * 3), // 3 year tour
    nlt: getDate(-25),
  },
  entitlements: {
    authorizedTravelDays: 6,
    proceedDays: 4,
    leaveDays: 30,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
    stops: [
      {
        id: 'stop-1',
        location: 'Salt Lake City, UT',
        arrivalDate: getDate(-38),
        departureDate: getDate(-36),
        reason: 'LEISURE',
      },
    ],
  },
  status: 'COMPLETE',
};

export const MOCK_PCS_ORDERS_PERSONA_C: PCSOrder = {
  orderNumber: 'ORD-2024-003',
  gainingCommand: {
    name: 'SUBASE New London',
    uic: '22222',
    address: 'Naval Submarine Base New London, 1 Wahoo Ave, Groton, CT 06340',
    zip: '06340',
    quarterdeckPhone: '+1-860-694-3011',
    psdPhone: '+1-860-694-3456',
    oodPhone: '+1-860-694-0000',
    uniformOfDay: 'NWU Type I',
    quarterdeckLocation: { latitude: 41.3831, longitude: -72.0829 },
  },
  segments: [SEGMENT_C1, SEGMENT_C2],
  reportNLT: SEGMENT_C2.dates.nlt,
  isOconus: false,
  isSeaDuty: true,
};

/**
 * Get PCS order by persona/user ID
 */
export const getPCSOrderByUserId = (userId: string): PCSOrder => {
  switch (userId) {
    case 'demo-user-1':
      return MOCK_PCS_ORDERS; // Persona A - Family Move
    case 'demo-user-2':
      return MOCK_PCS_ORDERS_PERSONA_B; // Persona B - Single Sailor
    case 'demo-user-3':
      return MOCK_PCS_ORDERS_PERSONA_C; // Persona C - Career Sailor
    default:
      return MOCK_PCS_ORDERS; // Default fallback
  }
};
