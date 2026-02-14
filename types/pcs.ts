export type PCSSegmentType = 'ORIGIN' | 'INTERMEDIATE' | 'DESTINATION';
export type PCSSegmentMode = 'POV' | 'AIR' | 'MIXED' | 'GOV_VEHICLE';
export type PCSSegmentStatus = 'LOCKED' | 'PLANNING' | 'COMPLETE';
export type PCSPhase = 'DORMANT' | 'ORDERS_NEGOTIATION' | 'TRANSIT_LEAVE' | 'CHECK_IN';
export type TRANSITSubPhase = 'PLANNING' | 'ACTIVE_TRAVEL';

/**
 * PCS Route information for travel distance calculations.
 * Used for MALT, per diem, and advance pay calculations.
 */
export interface PCSRoute {
  losingZip: string;
  gainingZip: string;
  estimatedMileage: number;
}

export interface PCSStop {
  id: string;
  location: string;
  arrivalDate: string;
  departureDate: string;
  reason: 'LEISURE' | 'OFFICIAL';
}

export interface HHGItem {
  id: string;
  category: 'FURNITURE' | 'APPLIANCES' | 'BOXES' | 'VEHICLE' | 'OTHER';
  description: string;
  estimatedWeight: number;
}

export interface PCSSegment {
  id: string;
  type: PCSSegmentType;
  title: string;
  location: {
    name: string;
    uic: string;
    zip: string;
    type: 'DUTY_STATION' | 'SCHOOL' | 'TAD';
  };
  dates: {
    projectedArrival: string;
    projectedDeparture: string;
    nlt: string;
  };
  entitlements: {
    authorizedTravelDays: number;
    proceedDays: number;
    leaveDays: number;
  };
  userPlan: {
    mode: PCSSegmentMode | null;
    isAccompanied: boolean;
    stops?: PCSStop[];
  };
  status: PCSSegmentStatus;
}

export interface PCSOrder {
  orderNumber: string;
  gainingCommand: {
    name: string;
    uic: string;
    address?: string;
    zip?: string;
    quarterdeckPhone?: string;
    psdPhone?: string;
    oodPhone?: string;
    uniformOfDay?: string;
    quarterdeckLocation?: { latitude: number; longitude: number };
  };
  segments: PCSSegment[];
  reportNLT: string;
  isOconus: boolean;
  isSeaDuty: boolean;
}

export type UCTPhase = 1 | 2 | 3 | 4;

export type UCTNodeStatus = 'COMPLETED' | 'ACTIVE' | 'LOCKED';

export interface UCTPhaseConfig {
  phase: UCTPhase;
  title: string;
  description: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  segmentId?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  category: 'PRE_TRAVEL' | 'FINANCE' | 'SCREENING';
  uctPhase: UCTPhase;
  completedAt?: string;
  actionRoute?: string;
}

/**
 * Liquidation tracking for PCS travel claims.
 * Tracks the payment status from submission through NPPSC processing.
 */
export type LiquidationStatus = 'NOT_STARTED' | 'SUBMITTED' | 'CPPA_REVIEW' | 'NPPSC_AUDIT' | 'PAID';

export interface LiquidationStep {
  status: LiquidationStatus;
  label: string;
  estimatedDate?: string;
  completedDate?: string;
}

export interface LiquidationTracking {
  claimId: string | null;
  currentStatus: LiquidationStatus;
  steps: LiquidationStep[];
  estimatedPaymentDate: string | null;
  actualPaymentAmount: number | null;
  submittedAt: string | null;
}

// =============================================================================
// PCS DOCUMENT ARCHIVE — "The Digital Sea Bag"
// =============================================================================

/**
 * Document categories for archived PCS documents.
 * Maps to the standard Navy PCS paperwork lifecycle.
 */
export type DocumentCategory =
  | 'ORDERS'          // Stamped official orders PDF
  | 'TRAVEL_VOUCHER'  // DD 1351-2 (liquidated claim)
  | 'W2'              // Annual W-2 tax form
  | 'RECEIPT'          // Individual expense receipts
  | 'OTHER';           // Miscellaneous documents

/**
 * A single document associated with a historical PCS move.
 * Stored locally with encrypted metadata in SQLite.
 */
export interface PCSDocument {
  id: string;
  pcsOrderId: string;
  category: DocumentCategory;
  filename: string;
  displayName: string;
  localUri: string;
  originalUrl?: string;
  sizeBytes: number;
  uploadedAt: string;
  metadata?: Record<string, string>;
}

/**
 * A completed PCS move, archived for long-term reference.
 * Created when an active PCS order transitions to DORMANT
 * (all segments COMPLETE + 90-day post-arrival window).
 *
 * This is what sailors see in the "Digital Sea Bag" — a searchable
 * record of past moves with all associated documents.
 */
export interface HistoricalPCSOrder {
  id: string;
  orderNumber: string;
  userId: string;

  originCommand: string;
  originLocation: string;
  gainingCommand: string;
  gainingLocation: string;

  departureDate: string;
  arrivalDate: string;
  fiscalYear: number;

  totalMalt: number;
  totalPerDiem: number;
  totalReimbursement: number;

  documents: PCSDocument[];

  status: 'ACTIVE' | 'ARCHIVED';
  archivedAt?: string;

  isOconus: boolean;
  isSeaDuty: boolean;
}
