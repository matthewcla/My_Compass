import { PCSRoute } from '@/types/pcs';
import { User } from '@/types/user';

export enum DemoPhase {
  MVP = 'MVP',
  MY_PCS = 'MY_PCS',
  MY_PROFILE = 'MY_PROFILE',
}

// ── Career Data Types ───────────────────────────────────────
export interface AssignmentHistoryEntry {
  title: string;
  subtitle: string;
  dates: string;
  type: 'AFLOAT' | 'CONUS' | 'OCONUS';
  current?: boolean;
}

export interface NECEntry {
  code: string;
  name: string;
  earned: string;
}

export interface COOLCredential {
  name: string;
  status: 'Earned' | 'Eligible';
  date: string | null;
}

export interface SeaShoreEntry {
  period: 'Sea' | 'Shore';
  station: string;
  dates: string;
  months: number;
}

export interface TrainingEntry {
  school: string;
  location: string;
  date: string;
  type: 'A-School' | 'C-School' | 'GMT' | 'PQS';
}

// ── DemoUser ────────────────────────────────────────────────
export interface DemoUser extends User {
  pins: string[];
  leaveBalance: number;
  pcsRoute?: PCSRoute;
  assignmentHistory?: AssignmentHistoryEntry[];
  necs?: NECEntry[];
  qualifications?: string[];
  coolCredentials?: COOLCredential[];
  seaShoreRotation?: SeaShoreEntry[];
  trainingRecord?: TrainingEntry[];
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
    assignmentHistory: [
      { title: 'USS Gridley (DDG-101)', subtitle: 'AT1 — CIWS Technician', dates: 'Aug 2023 — Present', type: 'AFLOAT', current: true },
      { title: 'AIMD NAS Whidbey Island', subtitle: 'AT2 — Avionics Bench Tech', dates: 'Mar 2021 — Aug 2023', type: 'CONUS' },
      { title: 'USS Nimitz (CVN-68)', subtitle: 'AT3 — IFF/SPN-46 Tech', dates: 'Jun 2019 — Mar 2021', type: 'AFLOAT' },
      { title: 'CNATTU NAS Pensacola', subtitle: 'ATAN — Student', dates: 'Jan 2018 — Jun 2019', type: 'CONUS' },
    ],
    necs: [
      { code: '8341', name: 'Close-In Weapon System (CIWS) Technician', earned: '2023' },
      { code: '8342', name: 'Advanced CIWS Block 1B Technician', earned: '2024' },
      { code: '8301', name: 'IFF/SIF Systems Technician', earned: '2020' },
    ],
    qualifications: [
      'EAWS (Enlisted Aviation Warfare Specialist)',
      'ESWS (Enlisted Surface Warfare Specialist)',
      'QA Inspector',
      'CDQAR (Collateral Duty Quality Assurance Rep)',
    ],
    coolCredentials: [
      { name: 'FCC General Radiotelephone (GROL)', status: 'Earned', date: 'Jun 2021' },
      { name: 'CompTIA A+', status: 'Earned', date: 'Feb 2020' },
      { name: 'FAA Avionics Technician', status: 'Eligible', date: null },
    ],
    seaShoreRotation: [
      { period: 'Sea', station: 'USS Gridley', dates: 'Aug 2023 — Present', months: 30 },
      { period: 'Shore', station: 'AIMD Whidbey Island', dates: 'Mar 2021 — Aug 2023', months: 29 },
      { period: 'Sea', station: 'USS Nimitz', dates: 'Jun 2019 — Mar 2021', months: 21 },
      { period: 'Shore', station: 'CNATTU Pensacola', dates: 'Jan 2018 — Jun 2019', months: 18 },
    ],
    trainingRecord: [
      { school: 'A-School — AT "A" School', location: 'CNATTU Pensacola', date: 'Jan 2018', type: 'A-School' },
      { school: 'C-School — CIWS Mk 15 Maintenance', location: 'CNATTU Dam Neck', date: 'Jul 2022', type: 'C-School' },
      { school: 'C-School — CIWS Block 1B Upgrade', location: 'CNATTU Dam Neck', date: 'Mar 2024', type: 'C-School' },
    ],
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
    assignmentHistory: [
      { title: 'SWOS Division Officer Course', subtitle: 'LT — Student', dates: 'Jan 2025 — Present', type: 'CONUS', current: true },
      { title: 'USS Halsey (DDG-97)', subtitle: 'LTJG — AUXO/DCA', dates: 'Jun 2023 — Dec 2024', type: 'AFLOAT' },
      { title: 'USS Halsey (DDG-97)', subtitle: 'ENS — COMMO', dates: 'Aug 2021 — Jun 2023', type: 'AFLOAT' },
      { title: 'OCS — Newport, RI', subtitle: 'OC — Candidate', dates: 'Mar 2021 — Aug 2021', type: 'CONUS' },
    ],
    qualifications: [
      'SWO (Surface Warfare Officer)',
      'ESWS (Enlisted Surface Warfare Specialist)',
      'OOD Underway',
      'JOOD',
      'TAO Under Instruction',
    ],
    coolCredentials: [
      { name: 'PMP (Project Management Professional)', status: 'Eligible', date: null },
      { name: 'OSHA Maritime Safety', status: 'Eligible', date: null },
    ],
    seaShoreRotation: [
      { period: 'Shore', station: 'SWOS San Diego', dates: 'Jan 2025 — Present', months: 2 },
      { period: 'Sea', station: 'USS Halsey', dates: 'Aug 2021 — Dec 2024', months: 41 },
      { period: 'Shore', station: 'OCS Newport', dates: 'Mar 2021 — Aug 2021', months: 5 },
    ],
    trainingRecord: [
      { school: 'OCS — Officer Candidate School', location: 'Newport, RI', date: 'Mar 2021', type: 'A-School' },
      { school: 'SWOS — Basic Division Officer', location: 'San Diego, CA', date: 'Jan 2025', type: 'C-School' },
    ],
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
    assignmentHistory: [
      { title: 'USS Louisiana (SSBN-743)', subtitle: 'ETN1 — Reactor Technician', dates: 'Oct 2022 — Present', type: 'AFLOAT', current: true },
      { title: 'NPTU Charleston', subtitle: 'ETN2 — Shift Supervisor', dates: 'Aug 2020 — Sep 2022', type: 'CONUS' },
      { title: 'USS Hartford (SSN-768)', subtitle: 'ETN3 — Reactor Operator', dates: 'Dec 2017 — Jul 2020', type: 'AFLOAT' },
      { title: 'NPS/NPTU — Ballston Spa', subtitle: 'ETNSN — Student', dates: 'Jul 2016 — Dec 2017', type: 'CONUS' },
    ],
    necs: [
      { code: '3353', name: 'Nuclear Submarine Electrical Operator', earned: '2018' },
      { code: '3359', name: 'Nuclear Submarine ELT (Engineering Lab Tech)', earned: '2020' },
      { code: '3364', name: 'Nuclear Shift Supervisor', earned: '2021' },
    ],
    qualifications: [
      'SUBS (Submarine Warfare Specialist)',
      'EDMC (Engineering Duty Master Chief — Under Instruction)',
      'EWS (Engineering Watch Supervisor)',
      'Reactor Operator',
      'Shutdown Reactor Operator',
    ],
    coolCredentials: [
      { name: 'NRC Reactor Operator License', status: 'Eligible', date: null },
      { name: 'Certified Energy Manager (CEM)', status: 'Eligible', date: null },
      { name: 'OSHA 30-Hour General Industry', status: 'Earned', date: 'May 2021' },
    ],
    seaShoreRotation: [
      { period: 'Sea', station: 'USS Louisiana', dates: 'Oct 2022 — Present', months: 28 },
      { period: 'Shore', station: 'NPTU Charleston', dates: 'Aug 2020 — Sep 2022', months: 25 },
      { period: 'Sea', station: 'USS Hartford', dates: 'Dec 2017 — Jul 2020', months: 31 },
      { period: 'Shore', station: 'NPS/NPTU Ballston Spa', dates: 'Jul 2016 — Dec 2017', months: 18 },
    ],
    trainingRecord: [
      { school: 'A-School — Nuclear Field "A" School', location: 'NNPTC Goose Creek, SC', date: 'Jul 2016', type: 'A-School' },
      { school: 'C-School — Nuclear Power School', location: 'NNPTC Goose Creek, SC', date: 'Jan 2017', type: 'C-School' },
      { school: 'C-School — Nuclear Prototype (S8G)', location: 'NPTU Ballston Spa, NY', date: 'Jul 2017', type: 'C-School' },
      { school: 'C-School — ELT Qualification', location: 'NPTU Charleston, SC', date: 'Feb 2021', type: 'C-School' },
    ],
    pcsRoute: {
      losingZip: '98315', // Silverdale, WA (Submarine Base)
      gainingZip: '06340', // Groton, CT (Submarine Base)
      estimatedMileage: 2850,
    },
  },
  // Persona D: "The IT Professional" - E-6 IT aboard CVN-78, OCONUS-experienced
  {
    id: 'demo-user-4',
    displayName: 'Matthew Wilson',
    rating: 'IT',
    rank: 'E-6',
    title: 'IT1',
    pins: ['ESWS', 'EIWS'],
    dependents: 2,
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced',
    preferences: {
      regions: ['Hampton Roads', 'Pacific Northwest'],
      dutyTypes: ['Shore', 'Instructor'],
    },
    leaveBalance: 42.0,
    email: 'matthew.wilson.mil@us.navy.mil',
    phone: '757-555-0312',
    altPhone: '757-555-0198',
    uic: '09561',
    dutyStation: {
      name: 'USS Gerald R. Ford (CVN-78)',
      address: 'Naval Station Norfolk, 9079 Hampton Blvd',
      zip: '23511',
      type: 'AFLOAT',
    },
    prd: '2026-09-15T00:00:00.000Z',
    eaos: '2029-03-31T00:00:00.000Z',
    seaos: '2026-09-15T00:00:00.000Z',
    maritalStatus: 'married',
    bloodType: 'O+',
    financialProfile: {
      payGrade: 'E-6',
      basePay: 4100.50,
      hasDependents: true,
      dependentsCount: 2,
    },
    homeAddress: {
      street: '2145 Tidewater Dr',
      city: 'Norfolk',
      state: 'VA',
      zip: '23505',
    },
    mailingAddress: {
      street: '2145 Tidewater Dr',
      city: 'Norfolk',
      state: 'VA',
      zip: '23505',
    },
    emergencyContact: {
      name: 'Jessica Wilson',
      phone: '757-555-0198',
      relationship: 'Spouse',
      address: { street: '2145 Tidewater Dr', city: 'Norfolk', state: 'VA', zip: '23505' },
    },
    dependentDetails: [
      { id: 'dep-d1', name: 'Jessica Wilson', relationship: 'spouse', dob: '1993-04-12', efmpEnrolled: false, address: { street: '2145 Tidewater Dr', city: 'Norfolk', state: 'VA', zip: '23505' } },
      { id: 'dep-d2', name: 'Ethan Wilson', relationship: 'child', dob: '2020-08-23', efmpEnrolled: true, address: { street: '2145 Tidewater Dr', city: 'Norfolk', state: 'VA', zip: '23505' } },
    ],
    housing: {
      type: 'off_base',
      address: '2145 Tidewater Dr, Norfolk, VA',
      zip: '23505',
    },
    vehicles: [
      { id: 'veh-d1', make: 'Chevrolet', model: 'Tahoe', year: 2021, licensePlate: 'VA-IT1MW' },
    ],
    beneficiaries: [
      { id: 'ben-d1', name: 'Jessica Wilson', relationship: 'Spouse', percentage: 70, address: { street: '2145 Tidewater Dr', city: 'Norfolk', state: 'VA', zip: '23505' } },
      { id: 'ben-d2', name: 'Ethan Wilson', relationship: 'Child', percentage: 30, address: { street: '2145 Tidewater Dr', city: 'Norfolk', state: 'VA', zip: '23505' } },
    ],
    padd: {
      name: 'Jessica Wilson',
      relationship: 'Spouse',
      phone: '757-555-0198',
      address: { street: '2145 Tidewater Dr', city: 'Norfolk', state: 'VA', zip: '23505' },
    },
    assignmentHistory: [
      { title: 'USS Gerald R. Ford (CVN-78)', subtitle: 'IT1 — LAN/WAN Admin', dates: 'Sep 2023 — Present', type: 'AFLOAT', current: true },
      { title: 'NCTAMS LANT — Norfolk', subtitle: 'IT2 — Network Engineer', dates: 'Jun 2021 — Sep 2023', type: 'CONUS' },
      { title: 'USS Arleigh Burke (DDG-51)', subtitle: 'IT3 — Radio Supervisor', dates: 'Mar 2019 — Jun 2021', type: 'AFLOAT' },
      { title: 'NIOC Hawaii — Wahiawa', subtitle: 'ITSN — Help Desk Tech', dates: 'Jul 2017 — Mar 2019', type: 'OCONUS' },
    ],
    necs: [
      { code: '742A', name: 'Network Security Vulnerability Technician', earned: '2023' },
      { code: '741A', name: 'CANES System Administrator', earned: '2022' },
      { code: '726A', name: 'ISNS System Administrator', earned: '2020' },
      { code: '738A', name: 'Boundary Defense Technician', earned: '2021' },
    ],
    qualifications: [
      'ESWS (Enlisted Surface Warfare Specialist)',
      'EIWS (Enlisted Information Warfare Specialist)',
      'DC Petty Officer',
      '3M Coordinator',
    ],
    coolCredentials: [
      { name: 'CompTIA Security+', status: 'Earned', date: 'Mar 2022' },
      { name: 'CompTIA Network+', status: 'Earned', date: 'Nov 2020' },
      { name: 'CCNA (Cisco)', status: 'Eligible', date: null },
      { name: 'CISSP (ISC²)', status: 'Eligible', date: null },
    ],
    seaShoreRotation: [
      { period: 'Sea', station: 'USS Gerald R. Ford', dates: 'Sep 2023 — Present', months: 29 },
      { period: 'Shore', station: 'NCTAMS LANT', dates: 'Jun 2021 — Sep 2023', months: 27 },
      { period: 'Sea', station: 'USS Arleigh Burke', dates: 'Mar 2019 — Jun 2021', months: 27 },
      { period: 'Shore', station: 'NIOC Hawaii', dates: 'Jul 2017 — Mar 2019', months: 20 },
    ],
    trainingRecord: [
      { school: 'A-School — IT "A" School', location: 'Corry Station, Pensacola', date: 'Jul 2017', type: 'A-School' },
      { school: 'C-School — CANES Sys Admin', location: 'Corry Station, Pensacola', date: 'May 2019', type: 'C-School' },
      { school: 'C-School — Boundary Defense', location: 'Corry Station, Pensacola', date: 'Feb 2021', type: 'C-School' },
      { school: 'C-School — Net Sec Vuln Tech', location: 'Corry Station, Pensacola', date: 'Jan 2023', type: 'C-School' },
    ],
    pcsRoute: {
      losingZip: '23511', // Norfolk, VA (CVN-78)
      gainingZip: '32508', // Pensacola, FL (CETTC Corry Station)
      estimatedMileage: 720,
    },
  },
];
