export interface CycleData {
  cycleId: string;
  phase: string;
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  daysRemaining: number;
  matchingBillets?: number;
}

export interface UserStats {
  applicationsCount: number;
  averageMatchScore: number;
  lastLogin: string; // ISO date string
  liked?: number;
  superLiked?: number;
  passed?: number;
}

export interface LeaveData {
  currentBalance: number;
  pendingRequestsCount: number;
  useOrLose: number;
}

export interface DashboardData {
  cycle: CycleData;
  stats: UserStats;
  leave: LeaveData;
}
