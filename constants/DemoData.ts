import { User } from '@/types/user';
import { PCSRoute } from '@/types/pcs';

export enum DemoPhase {
  MVP = 'MVP',
  MY_PCS = 'MY_PCS',
  MY_PROFILE = 'MY_PROFILE',
}

export interface DemoUser extends User {
  pins: string[];
  leaveBalance: number;
  pcsRoute?: PCSRoute;
}

export const DEMO_USERS: DemoUser[] = [
  // Persona A: "The Family Move" - E-6 with dependents, cross-country PCS
  {
    id: 'demo-user-1',
    displayName: 'Marcus Trent',
    rating: 'AT',
    rank: 'E-6',
    title: 'AT1',
    pins: ['EAWS'],
    dependents: 3,
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {},
    leaveBalance: 30.0,
    financialProfile: {
      payGrade: 'E-6',
      basePay: 4100.50,
      hasDependents: true,
      dependentsCount: 3,
    },
    pcsRoute: {
      losingZip: '98207', // Everett, WA (USS Gridley)
      gainingZip: '96349', // Pearl Harbor, HI (USS Higgins)
      estimatedMileage: 2100,
    },
  },
  // Persona B: "The Single Sailor" - O-3 without dependents, regional move
  {
    id: 'demo-user-2',
    displayName: 'Angela Navarro',
    rating: 'SWO',
    rank: 'O-3',
    title: 'LTJG',
    pins: ['ESWS'],
    dependents: 0,
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {},
    leaveBalance: 15.5,
    financialProfile: {
      payGrade: 'O-3',
      basePay: 6462.60,
      hasDependents: false,
      dependentsCount: 0,
    },
    pcsRoute: {
      losingZip: '92136', // San Diego, CA (C-School)
      gainingZip: '92155', // San Diego, CA (nearby command)
      estimatedMileage: 450,
    },
  },
  // Persona C: "The Career Sailor" - E-6 (unchanged for backward compatibility)
  {
    id: 'demo-user-3',
    displayName: 'Devon Hargrove',
    rating: 'ETN',
    rank: 'E-6',
    title: 'ETN1',
    pins: ['SUBS'],
    dependents: 2,
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {},
    leaveBalance: 60.0,
    financialProfile: {
      payGrade: 'E-6',
      basePay: 4100.50,
      hasDependents: true,
      dependentsCount: 2,
    },
    pcsRoute: {
      losingZip: '98315', // Silverdale, WA (Submarine Base)
      gainingZip: '06340', // Groton, CT (Submarine Base)
      estimatedMileage: 2850,
    },
  },
];
