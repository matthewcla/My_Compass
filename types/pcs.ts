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

export interface ChecklistItem {
  id: string;
  label: string;
  segmentId?: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE';
  category: 'PRE_TRAVEL' | 'FINANCE' | 'SCREENING';
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
