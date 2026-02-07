import { CareerEvent } from '@/types/career';
import { DashboardData } from '@/types/dashboard';
import { InboxMessage } from '@/types/inbox';
import {
  Application,
  Billet,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestDefaults,
} from '@/types/schema';
import { User } from '@/types/user';

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
  getPagedBillets(limit: number, offset: number): Promise<Billet[]>;

  // Applications
  saveApplication(app: Application): Promise<void>;
  saveApplications(apps: Application[]): Promise<void>;
  getApplication(id: string): Promise<Application | null>;
  getUserApplications(userId: string): Promise<Application[]>;

  // Assignment Decisions
  saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void>;
  removeAssignmentDecision(userId: string, billetId: string): Promise<void>;
  getAssignmentDecisions(userId: string): Promise<Record<string, string> | null>;

  // Leave Requests
  saveLeaveRequest(request: LeaveRequest): Promise<void>;
  getLeaveRequest(id: string): Promise<LeaveRequest | null>;
  getUserLeaveRequests(userId: string): Promise<LeaveRequest[]>;
  deleteLeaveRequest(requestId: string): Promise<void>;

  // Leave Balance
  saveLeaveBalance(balance: LeaveBalance): Promise<void>;
  getLeaveBalance(userId: string): Promise<LeaveBalance | null>;

  // Leave Defaults
  saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void>;
  getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null>;

  // Dashboard
  saveDashboardCache(userId: string, data: DashboardData): Promise<void>;
  getDashboardCache(userId: string): Promise<DashboardData | null>;

  // Inbox
  saveInboxMessages(messages: InboxMessage[]): Promise<void>;
  getInboxMessages(): Promise<InboxMessage[]>;
  updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void>;

  // Career Events
  saveCareerEvents(events: CareerEvent[]): Promise<void>;
  getCareerEvents(): Promise<CareerEvent[]>;
}
