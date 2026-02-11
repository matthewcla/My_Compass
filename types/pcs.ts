export type PCSSegmentType = 'ORIGIN' | 'INTERMEDIATE' | 'DESTINATION';
export type PCSSegmentMode = 'POV' | 'AIR' | 'MIXED' | 'GOV_VEHICLE';
export type PCSSegmentStatus = 'LOCKED' | 'PLANNING' | 'COMPLETE';

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
