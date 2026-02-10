import { User } from '@/types/user';

export enum DemoPhase {
  MVP = 'MVP',
  MY_PCS = 'MY_PCS',
  MY_PROFILE = 'MY_PROFILE',
}

export interface DemoUser extends User {
  pins: string[];
  leaveBalance: number;
}

export const DEMO_USERS: DemoUser[] = [
  {
    id: 'demo-user-1',
    displayName: 'Marcus Trent',
    rating: 'AT',
    rank: 'E-4',
    title: 'AT3',
    pins: ['EAWS'],
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {},
    leaveBalance: 30.0,
  },
  {
    id: 'demo-user-2',
    displayName: 'Angela Navarro',
    rating: 'FCA',
    rank: 'E-5',
    title: 'FCA2',
    pins: ['ESWS'],
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {},
    leaveBalance: 15.5,
  },
  {
    id: 'demo-user-3',
    displayName: 'Devon Hargrove',
    rating: 'ETN',
    rank: 'E-6',
    title: 'ETN1',
    pins: ['SUBS'],
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {},
    leaveBalance: 60.0,
  },
];
