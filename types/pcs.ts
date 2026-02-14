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
