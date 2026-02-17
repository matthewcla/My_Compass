import { DetailerContact, HistoricalPCSOrder, PCSOrder, PCSSegment, SelectionDetails } from '@/types/pcs';

const NOW = new Date();
const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_MONTH = 30 * ONE_DAY;

// Helper to format dates
const getDate = (daysFromNow: number) => new Date(NOW.getTime() + daysFromNow * ONE_DAY).toISOString();

// =============================================================================
// SELECTION PHASE — Per-Persona Mock Details
// =============================================================================

export const MOCK_SELECTION_DETAILS_A: SelectionDetails = {
  billetTitle: 'WORK CENTER SUPERVISOR',
  billetNec: '14NO',
  dutyType: 'Sea',
  pipelineStatus: 'CO_ENDORSEMENT',
  estimatedOrdersDate: getDate(28),
  detailer: {
    name: 'PS1 Angela Brooks',
    phone: '(901) 874-3483',
    email: 'angela.brooks@navy.mil',
    office: 'PERS-4013',
  },
  selectedDate: getDate(-7),
};

export const MOCK_SELECTION_DETAILS_B: SelectionDetails = {
  billetTitle: 'OPERATIONS OFFICER',
  billetNec: null,
  dutyType: 'Shore',
  pipelineStatus: 'MATCH_ANNOUNCED',
  estimatedOrdersDate: getDate(35),
  detailer: {
    name: 'LCDR Maria Santos',
    phone: '(901) 874-4112',
    email: 'maria.santos@navy.mil',
    office: 'PERS-41',
  },
  selectedDate: getDate(-3),
};

export const MOCK_SELECTION_DETAILS_C: SelectionDetails = {
  billetTitle: 'LEADING PETTY OFFICER',
  billetNec: '14RO',
  dutyType: 'Sea',
  pipelineStatus: 'ORDERS_DRAFTING',
  estimatedOrdersDate: getDate(14),
  detailer: {
    name: 'PS1 Darnell Williams',
    phone: '(901) 874-3500',
    email: 'darnell.williams@navy.mil',
    office: 'PERS-4013',
  },
  selectedDate: getDate(-21),
};

export const MOCK_SELECTION_DETAILS_D: SelectionDetails = {
  billetTitle: 'INFORMATION SYSTEMS INSTRUCTOR',
  billetNec: '2780',
  dutyType: 'Shore',
  pipelineStatus: 'MATCH_ANNOUNCED',
  estimatedOrdersDate: getDate(42),
  detailer: {
    name: 'ITC Rashida Coleman',
    phone: '(901) 874-3550',
    email: 'rashida.coleman@navy.mil',
    office: 'PERS-4013',
  },
  selectedDate: getDate(-2),
};

export const getSelectionDetailsByUserId = (userId: string): SelectionDetails => {
  switch (userId) {
    case 'demo-user-1': return MOCK_SELECTION_DETAILS_A;
    case 'demo-user-2': return MOCK_SELECTION_DETAILS_B;
    case 'demo-user-3': return MOCK_SELECTION_DETAILS_C;
    case 'demo-user-4': return MOCK_SELECTION_DETAILS_D;
    default: return MOCK_SELECTION_DETAILS_A;
  }
};

// =============================================================================
// NEGOTIATION PHASE — Per-Persona Mock Details
// =============================================================================

export interface NegotiationDetails {
  cycleId: string;                        // e.g. "26-02"
  windowCloseDate: string;                // ISO date — when negotiation window closes
  selectionAnnouncementDate: string | null; // estimated selection announcement
  detailer: DetailerContact;
}

export const MOCK_NEGOTIATION_DETAILS_A: NegotiationDetails = {
  cycleId: '26-02',
  windowCloseDate: getDate(12),
  selectionAnnouncementDate: getDate(30),
  detailer: MOCK_SELECTION_DETAILS_A.detailer,
};

export const MOCK_NEGOTIATION_DETAILS_B: NegotiationDetails = {
  cycleId: '26-02',
  windowCloseDate: getDate(12),
  selectionAnnouncementDate: getDate(30),
  detailer: MOCK_SELECTION_DETAILS_B.detailer,
};

export const MOCK_NEGOTIATION_DETAILS_C: NegotiationDetails = {
  cycleId: '26-02',
  windowCloseDate: getDate(12),
  selectionAnnouncementDate: getDate(30),
  detailer: MOCK_SELECTION_DETAILS_C.detailer,
};

export const MOCK_NEGOTIATION_DETAILS_D: NegotiationDetails = {
  cycleId: '26-02',
  windowCloseDate: getDate(12),
  selectionAnnouncementDate: getDate(30),
  detailer: MOCK_SELECTION_DETAILS_D.detailer,
};

export const getNegotiationDetailsByUserId = (userId: string): NegotiationDetails => {
  switch (userId) {
    case 'demo-user-1': return MOCK_NEGOTIATION_DETAILS_A;
    case 'demo-user-2': return MOCK_NEGOTIATION_DETAILS_B;
    case 'demo-user-3': return MOCK_NEGOTIATION_DETAILS_C;
    case 'demo-user-4': return MOCK_NEGOTIATION_DETAILS_D;
    default: return MOCK_NEGOTIATION_DETAILS_A;
  }
};

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
    homePort: 'Yokosuka, Japan',
    quarterdeckLocation: { latitude: 35.2916, longitude: 139.6683 },
  },
  sponsor: {
    name: 'ET1 Marcus Rivera',
    rank: 'E-6',
    phone: '+81-80-5555-1234',
    email: 'marcus.rivera@navy.mil',
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
    homePort: 'Coronado, CA',
    quarterdeckLocation: { latitude: 32.6811, longitude: -117.1565 },
  },
  sponsor: {
    name: 'LT Sarah Chen',
    rank: 'O-3',
    phone: '+1-619-555-8821',
    email: 'sarah.chen@navy.mil',
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
    homePort: 'Groton, CT',
    quarterdeckLocation: { latitude: 41.3831, longitude: -72.0829 },
  },
  sponsor: {
    name: 'ETC(SS) James Kowalski',
    rank: 'E-7',
    phone: '+1-860-555-4470',
    email: 'james.kowalski@navy.mil',
  },
  segments: [SEGMENT_C1, SEGMENT_C2],
  reportNLT: SEGMENT_C2.dates.nlt,
  isOconus: false,
  isSeaDuty: true,
};

// =============================================================================
// PERSONA D: "THE IT PROFESSIONAL" - E-6, Norfolk → Pensacola with Dependents
// =============================================================================

const SEGMENT_D1: PCSSegment = {
  id: 'seg-d1-origin',
  type: 'ORIGIN',
  title: 'Detach USS Gerald R. Ford',
  location: {
    name: 'USS Gerald R. Ford (CVN-78)',
    uic: '09561',
    zip: '23511',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(-365 * 2.5), // Arrived ~2.5 years ago
    projectedDeparture: getDate(30),        // Departing in 30 days
    nlt: getDate(30),
  },
  entitlements: {
    authorizedTravelDays: 3,
    proceedDays: 0,
    leaveDays: 0,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
  },
  status: 'PLANNING',
};

const SEGMENT_D2: PCSSegment = {
  id: 'seg-d2-enroute',
  type: 'INTERMEDIATE',
  title: 'En-Route Leave — Raleigh, NC',
  location: {
    name: 'Raleigh, NC (Family Visit)',
    uic: '00000',
    zip: '27601',
    type: 'TAD',
  },
  dates: {
    projectedArrival: getDate(33),
    projectedDeparture: getDate(40),
    nlt: getDate(45),
  },
  entitlements: {
    authorizedTravelDays: 0,
    proceedDays: 0,
    leaveDays: 7,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
  },
  status: 'PLANNING',
};

const SEGMENT_D3: PCSSegment = {
  id: 'seg-d3-dest',
  type: 'DESTINATION',
  title: 'Report to CETTC Corry Station',
  location: {
    name: 'Center for Information Warfare Training (CETTC)',
    uic: '62500',
    zip: '32508',
    type: 'DUTY_STATION',
  },
  dates: {
    projectedArrival: getDate(42),
    projectedDeparture: getDate(42 + 365 * 3),
    nlt: getDate(50),
  },
  entitlements: {
    authorizedTravelDays: 2,
    proceedDays: 4,
    leaveDays: 14,
  },
  userPlan: {
    mode: 'POV',
    isAccompanied: true,
  },
  status: 'LOCKED',
};

export const MOCK_PCS_ORDERS_PERSONA_D: PCSOrder = {
  orderNumber: 'ORD-2026-004',
  gainingCommand: {
    name: 'CETTC Corry Station',
    uic: '62500',
    address: 'Center for Information Warfare Training, 640 Roberts Ave, Pensacola, FL 32508',
    zip: '32508',
    quarterdeckPhone: '+1-850-452-6100',
    psdPhone: '+1-850-452-6200',
    oodPhone: '+1-850-452-6000',
    uniformOfDay: 'NWU Type III',
    homePort: 'Pensacola, FL',
    quarterdeckLocation: { latitude: 30.3958, longitude: -87.2925 },
  },
  sponsor: {
    name: 'ITC(IW) Robert Delgado',
    rank: 'E-7',
    phone: '+1-850-555-3847',
    email: 'robert.delgado@navy.mil',
  },
  segments: [SEGMENT_D1, SEGMENT_D2, SEGMENT_D3],
  reportNLT: SEGMENT_D3.dates.nlt,
  isOconus: false,
  isSeaDuty: false,
};

/**
 * Get PCS order by persona/user ID
 */
export const getPCSOrderByUserId = (userId: string): PCSOrder => {
  switch (userId) {
    case 'demo-user-1':
      return MOCK_PCS_ORDERS; // Persona A - Family Move (AT1 Trent)
    case 'demo-user-2':
      return MOCK_PCS_ORDERS_PERSONA_B; // Persona B - Single Sailor (LT Navarro)
    case 'demo-user-3':
      return MOCK_PCS_ORDERS_PERSONA_C; // Persona C - Career Sailor (ETN1 Hargrove)
    case 'demo-user-4':
      return MOCK_PCS_ORDERS_PERSONA_D; // Persona D - IT Professional (IT1 Wilson)
    default:
      return MOCK_PCS_ORDERS; // Default fallback
  }
};

// =============================================================================
// HISTORICAL PCS ORDERS ARCHIVE (2022-2024)
// =============================================================================

export const MOCK_HISTORICAL_PCS_ORDERS: HistoricalPCSOrder[] = [
  {
    id: 'hist-2024-001',
    orderNumber: 'ORD-2024-H01',
    userId: 'demo-user-1',
    originCommand: 'USS Higgins (DDG-76)',
    originLocation: 'Yokosuka, Japan',
    gainingCommand: 'USS Ronald Reagan (CVN-76)',
    gainingLocation: 'Yokosuka, Japan',
    departureDate: '2024-03-01T08:00:00Z',
    arrivalDate: '2024-03-01T14:00:00Z',
    fiscalYear: 2024,
    totalMalt: 0,
    totalPerDiem: 150,
    totalReimbursement: 450,
    status: 'ARCHIVED',
    archivedAt: '2024-06-01T12:00:00Z',
    isOconus: true,
    isSeaDuty: true,
    documents: [
      {
        id: 'doc-2024-1',
        pcsOrderId: 'hist-2024-001',
        category: 'ORDERS',
        filename: 'Official Orders - USS Higgins Transfer.pdf',
        displayName: 'Official Orders - USS Higgins Transfer',
        localUri: '',
        sizeBytes: 1024 * 450,
        uploadedAt: '2024-02-15T10:00:00Z',
      },
      {
        id: 'doc-2024-2',
        pcsOrderId: 'hist-2024-001',
        category: 'TRAVEL_VOUCHER',
        filename: 'DD 1351-2 - Liquidated 2024-03-15.pdf',
        displayName: 'DD 1351-2 - Liquidated 2024-03-15',
        localUri: '',
        sizeBytes: 1024 * 120,
        uploadedAt: '2024-03-20T14:30:00Z',
      },
      {
        id: 'doc-2024-3',
        pcsOrderId: 'hist-2024-001',
        category: 'RECEIPT',
        filename: 'Taxi Receipt - Yokosuka.pdf',
        displayName: 'Taxi Receipt - Yokosuka',
        localUri: '',
        sizeBytes: 1024 * 50,
        uploadedAt: '2024-03-02T09:00:00Z',
      },
    ],
  },
  {
    id: 'hist-2023-002',
    orderNumber: 'ORD-2023-H02',
    userId: 'demo-user-1',
    originCommand: 'NAB Coronado',
    originLocation: 'San Diego, CA',
    gainingCommand: 'NAS Pensacola',
    gainingLocation: 'Pensacola, FL',
    departureDate: '2023-05-10T08:00:00Z',
    arrivalDate: '2023-05-15T16:00:00Z',
    fiscalYear: 2023,
    totalMalt: 1200,
    totalPerDiem: 650,
    totalReimbursement: 2800,
    status: 'ARCHIVED',
    archivedAt: '2023-09-01T10:00:00Z',
    isOconus: false,
    isSeaDuty: false,
    documents: [
      {
        id: 'doc-2023-1',
        pcsOrderId: 'hist-2023-002',
        category: 'ORDERS',
        filename: 'Official Orders - NAS Pensacola.pdf',
        displayName: 'Official Orders - NAS Pensacola',
        localUri: '',
        sizeBytes: 1024 * 380,
        uploadedAt: '2023-04-01T09:00:00Z',
      },
      {
        id: 'doc-2023-2',
        pcsOrderId: 'hist-2023-002',
        category: 'W2',
        filename: 'W-2 Tax Form - FY 2023.pdf',
        displayName: 'W-2 Tax Form - FY 2023',
        localUri: '',
        sizeBytes: 1024 * 80,
        uploadedAt: '2024-01-25T11:00:00Z',
      },
      {
        id: 'doc-2023-3',
        pcsOrderId: 'hist-2023-002',
        category: 'TRAVEL_VOUCHER',
        filename: 'DD 1351-2 - Liquidated 2023-06-01.pdf',
        displayName: 'DD 1351-2 - Liquidated 2023-06-01',
        localUri: '',
        sizeBytes: 1024 * 130,
        uploadedAt: '2023-06-05T15:00:00Z',
      },
      {
        id: 'doc-2023-4',
        pcsOrderId: 'hist-2023-002',
        category: 'RECEIPT',
        filename: 'U-Haul Receipt.pdf',
        displayName: 'U-Haul Receipt',
        localUri: '',
        sizeBytes: 1024 * 200,
        uploadedAt: '2023-05-12T18:00:00Z',
      },
    ],
  },
  {
    id: 'hist-2022-003',
    orderNumber: 'ORD-2022-H03',
    userId: 'demo-user-1',
    originCommand: 'SUBASE New London',
    originLocation: 'Groton, CT',
    gainingCommand: 'USS Virginia (SSN-774)',
    gainingLocation: 'Kittery, ME',
    departureDate: '2021-11-15T08:00:00Z',
    arrivalDate: '2021-11-15T14:00:00Z',
    fiscalYear: 2022,
    totalMalt: 150,
    totalPerDiem: 100,
    totalReimbursement: 350,
    status: 'ARCHIVED',
    archivedAt: '2022-02-01T09:00:00Z',
    isOconus: false,
    isSeaDuty: true,
    documents: [
      {
        id: 'doc-2022-1',
        pcsOrderId: 'hist-2022-003',
        category: 'ORDERS',
        filename: 'Official Orders - USS Virginia.pdf',
        displayName: 'Official Orders - USS Virginia',
        localUri: '',
        sizeBytes: 1024 * 400,
        uploadedAt: '2021-10-20T13:00:00Z',
      },
      {
        id: 'doc-2022-2',
        pcsOrderId: 'hist-2022-003',
        category: 'TRAVEL_VOUCHER',
        filename: 'DD 1351-2 - Liquidated 2021-12-01.pdf',
        displayName: 'DD 1351-2 - Liquidated 2021-12-01',
        localUri: '',
        sizeBytes: 1024 * 110,
        uploadedAt: '2021-12-05T10:00:00Z',
      },
      {
        id: 'doc-2022-3',
        pcsOrderId: 'hist-2022-003',
        category: 'RECEIPT',
        filename: 'Hotel Receipt - TLE Norfolk.pdf',
        displayName: 'Hotel Receipt - TLE Norfolk',
        localUri: '',
        sizeBytes: 1024 * 60,
        uploadedAt: '2021-11-14T20:00:00Z',
      },
      {
        id: 'doc-2022-4',
        pcsOrderId: 'hist-2022-003',
        category: 'W2',
        filename: 'W-2 Tax Form - FY 2022.pdf',
        displayName: 'W-2 Tax Form - FY 2022',
        localUri: '',
        sizeBytes: 1024 * 85,
        uploadedAt: '2023-01-30T11:00:00Z',
      },
      {
        id: 'doc-2022-5',
        pcsOrderId: 'hist-2022-003',
        category: 'RECEIPT',
        filename: 'Gas Receipt - Groton.pdf',
        displayName: 'Gas Receipt - Groton',
        localUri: '',
        sizeBytes: 1024 * 20,
        uploadedAt: '2021-11-15T08:30:00Z',
      },
    ],
  },
];
