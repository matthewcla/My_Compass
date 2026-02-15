import { UCTPhaseConfig } from '@/types/pcs';

export const UCT_PHASES: UCTPhaseConfig[] = [
  {
    phase: 1,
    title: 'Member Screening',
    description: 'Verify orders, confirm OBLISERV, complete screenings.',
  },
  {
    phase: 2,
    title: 'Logistics & Finances',
    description: 'Complete these items before you detach from your current command.',
  },
  {
    phase: 3,
    title: 'Transit & Leave',
    description: 'You are en route. Track receipts and manage travel documents.',
  },
  {
    phase: 4,
    title: 'Check-in & Travel Claim',
    description: 'Report to your new command and file your travel claim.',
  },
];
