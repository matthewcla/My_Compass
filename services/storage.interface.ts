import {
  Application,
  Billet,
  LeaveBalance,
  LeaveRequest,
} from '@/types/schema';
import { User } from '@/types/user';
import { DashboardData } from '@/types/dashboard';

export class DataIntegrityError extends Error {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'DataIntegrityError';
  }
}

export interface IStorageService {
  init(): Promise<void>;

  // User
  saveUser(user: User): Promise<void>;
  getUser(id: string): Promise<User | null>;

  // Billets
  saveBillet(billet: Billet): Promise<void>;
  getBillet(id: string): Promise<Billet | null>;
  getAllBillets(): Promise<Billet[]>;

  // Applications
  saveApplication(app: Application): Promise<void>;
  getApplication(id: string): Promise<Application | null>;
  getUserApplications(userId: string): Promise<Application[]>;

  // Leave Requests
  saveLeaveRequest(request: LeaveRequest): Promise<void>;
  getLeaveRequest(id: string): Promise<LeaveRequest | null>;
  getUserLeaveRequests(userId: string): Promise<LeaveRequest[]>;

  // Leave Balance
  saveLeaveBalance(balance: LeaveBalance): Promise<void>;
  getLeaveBalance(userId: string): Promise<LeaveBalance | null>;

  // Dashboard
  saveDashboardCache(userId: string, data: DashboardData): Promise<void>;
  getDashboardCache(userId: string): Promise<DashboardData | null>;
}
