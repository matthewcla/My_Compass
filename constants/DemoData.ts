import { PCSRoute } from '@/types/pcs';
import { User } from '@/types/user';

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
    email: 'marcus.trent.mil@us.navy.mil',
    phone: '425-555-0147',
    altPhone: '425-555-0192',
    uic: '30129',
    dutyStation: {
      name: 'USS Gridley (DDG-101)',
      address: 'Naval Station Everett, 2000 W Marine View Dr',
      zip: '98207',
      type: 'AFLOAT',
    },
    prd: '2026-07-15T00:00:00.000Z',
    eaos: '2026-09-30T00:00:00.000Z',
    seaos: '2026-07-15T00:00:00.000Z',
    maritalStatus: 'married',
    financialProfile: {
      payGrade: 'E-6',
      basePay: 4100.50,
      hasDependents: true,
      dependentsCount: 3,
    },
    homeAddress: {
      street: '4318 Cascade Dr',
      city: 'Everett',
      state: 'WA',
      zip: '98207',
    },
    mailingAddress: {
      street: '4318 Cascade Dr',
      city: 'Everett',
      state: 'WA',
      zip: '98207',
    },

    emergencyContact: {
      name: 'Maria Trent',
      phone: '425-555-0192',
      relationship: 'Spouse',
      address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' },
    },
    dependentDetails: [
      { id: 'dep-a1', name: 'Maria Trent', relationship: 'spouse', dob: '1990-11-03', efmpEnrolled: false, address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' } },
      { id: 'dep-a2', name: 'Elijah Trent', relationship: 'child', dob: '2018-06-14', efmpEnrolled: false, address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' } },
      { id: 'dep-a3', name: 'Sofia Trent', relationship: 'child', dob: '2021-02-28', efmpEnrolled: true, address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' } },
    ],
    housing: {
      type: 'not_yet_secured',
      address: '',
      zip: '',
    },
    vehicles: [
      { id: 'veh-a1', make: 'Honda', model: 'Pilot', year: 2022, licensePlate: 'WA-NAVY1' },
      { id: 'veh-a2', make: 'Toyota', model: 'Corolla', year: 2019, licensePlate: 'WA-NAVY2' },
    ],
    beneficiaries: [
      { id: 'ben-a1', name: 'Maria Trent', relationship: 'Spouse', percentage: 55, address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' } },
      { id: 'ben-a2', name: 'Elijah Trent', relationship: 'Child', percentage: 25, address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' } },
      { id: 'ben-a3', name: 'Sofia Trent', relationship: 'Child', percentage: 20, address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' } },
    ],
    padd: {
      name: 'Maria Trent',
      relationship: 'Spouse',
      phone: '425-555-0192',
      address: { street: '4318 Cascade Dr', city: 'Everett', state: 'WA', zip: '98207' },
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
    email: 'angela.navarro.mil@us.navy.mil',
    phone: '619-555-0233',
    uic: '55012',
    dutyStation: {
      name: 'SWOS Division Officer Course',
      address: 'Naval Base San Diego, 3455 Senn Rd',
      zip: '92136',
      type: 'CONUS',
    },
    prd: '2026-05-01T00:00:00.000Z',
    eaos: '2030-01-01T00:00:00.000Z',
    seaos: '2026-05-01T00:00:00.000Z',
    maritalStatus: 'single',
    financialProfile: {
      payGrade: 'O-3',
      basePay: 6462.60,
      hasDependents: false,
      dependentsCount: 0,
    },
    homeAddress: {
      street: '1120 Harbor Island Dr Apt 4B',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
    },
    mailingAddress: {
      street: '1120 Harbor Island Dr Apt 4B',
      city: 'San Diego',
      state: 'CA',
      zip: '92101',
    },

    emergencyContact: {
      name: 'Rosa Navarro',
      phone: '619-555-0847',
      relationship: 'Mother',
      address: { street: '782 Elm Ave', city: 'Chula Vista', state: 'CA', zip: '91910' },
    },
    housing: {
      type: 'off_base',
      address: '1120 Harbor Island Dr Apt 4B, San Diego, CA',
      zip: '92101',
    },
    vehicles: [
      { id: 'veh-b1', make: 'Mazda', model: 'CX-5', year: 2023, licensePlate: 'CA-7NVY' },
    ],
    beneficiaries: [
      { id: 'ben-b1', name: 'Rosa Navarro', relationship: 'Mother', percentage: 100, address: { street: '782 Elm Ave', city: 'Chula Vista', state: 'CA', zip: '91910' } },
    ],
    padd: {
      name: 'Rosa Navarro',
      relationship: 'Mother',
      phone: '619-555-0847',
      address: { street: '782 Elm Ave', city: 'Chula Vista', state: 'CA', zip: '91910' },
    },
    pcsRoute: {
      losingZip: '92136', // San Diego, CA (C-School)
      gainingZip: '92155', // San Diego, CA (nearby command)
      estimatedMileage: 450,
    },
  },
  // Persona C: "The Career Sailor" - E-6 submariner, coast-to-coast PCS
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
    email: 'devon.hargrove.mil@us.navy.mil',
    phone: '360-555-0419',
    altPhone: '360-555-0316',
    uic: '21680',
    dutyStation: {
      name: 'USS Louisiana (SSBN-743)',
      address: 'Naval Base Kitsap-Bangor, 2575 Ohio St',
      zip: '98315',
      type: 'AFLOAT',
    },
    prd: '2026-08-01T00:00:00.000Z',
    eaos: '2029-09-30T00:00:00.000Z',
    seaos: '2026-08-01T00:00:00.000Z',
    maritalStatus: 'married',
    financialProfile: {
      payGrade: 'E-6',
      basePay: 4100.50,
      hasDependents: true,
      dependentsCount: 2,
    },
    homeAddress: {
      street: '910 Trident Ave',
      city: 'Silverdale',
      state: 'WA',
      zip: '98315',
    },
    mailingAddress: {
      street: '910 Trident Ave',
      city: 'Silverdale',
      state: 'WA',
      zip: '98315',
    },

    emergencyContact: {
      name: 'Keisha Hargrove',
      phone: '360-555-0316',
      relationship: 'Spouse',
      address: { street: '910 Trident Ave', city: 'Silverdale', state: 'WA', zip: '98315' },
    },
    dependentDetails: [
      { id: 'dep-c1', name: 'Keisha Hargrove', relationship: 'spouse', dob: '1991-08-19', efmpEnrolled: false, address: { street: '910 Trident Ave', city: 'Silverdale', state: 'WA', zip: '98315' } },
      { id: 'dep-c2', name: 'Jaylen Hargrove', relationship: 'child', dob: '2017-12-05', efmpEnrolled: false, address: { street: '910 Trident Ave', city: 'Silverdale', state: 'WA', zip: '98315' } },
    ],
    housing: {
      type: 'on_base',
      address: '910 Trident Ave, NBK-Bangor, WA',
      zip: '98315',
    },
    vehicles: [
      { id: 'veh-c1', make: 'Ford', model: 'F-150', year: 2020, licensePlate: 'WA-SUB6' },
    ],
    beneficiaries: [
      { id: 'ben-c1', name: 'Keisha Hargrove', relationship: 'Spouse', percentage: 75, address: { street: '910 Trident Ave', city: 'Silverdale', state: 'WA', zip: '98315' } },
      { id: 'ben-c2', name: 'Jaylen Hargrove', relationship: 'Child', percentage: 25, address: { street: '910 Trident Ave', city: 'Silverdale', state: 'WA', zip: '98315' } },
    ],
    padd: {
      name: 'Keisha Hargrove',
      relationship: 'Spouse',
      phone: '360-555-0316',
      address: { street: '910 Trident Ave', city: 'Silverdale', state: 'WA', zip: '98315' },
    },
    pcsRoute: {
      losingZip: '98315', // Silverdale, WA (Submarine Base)
      gainingZip: '06340', // Groton, CT (Submarine Base)
      estimatedMileage: 2850,
    },
  },
];
