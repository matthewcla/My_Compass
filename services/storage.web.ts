// Web-specific storage implementation
// SQLite is not available on web, so we use a stub/localStorage implementation

import { DashboardData } from '@/types/dashboard';
import {
  Application,
  Billet,
  LeaveBalance,
  LeaveRequest,
  LeaveRequestDefaults
} from '@/types/schema';
import { User } from '@/types/user';
import { decryptData, encryptData } from '../lib/encryption';
import { IStorageService } from './storage.interface';

// =============================================================================
// WEB IMPLEMENTATION
// =============================================================================

class WebStorage implements IStorageService {
  private USER_KEY = 'my_compass_user_';
  private BILLETS_KEY = 'my_compass_billets';
  private APPLICATIONS_KEY = 'my_compass_applications';
  private LEAVE_REQUESTS_KEY = 'my_compass_leave_requests';
  private LEAVE_BALANCE_KEY = 'my_compass_leave_balance_';
  private DASHBOARD_CACHE_KEY = 'my_compass_dashboard_';

  async init(): Promise<void> {
    console.log('Using web storage (localStorage). SQLite not available on web.');
  }

  // ---------------------------------------------------------------------------
  // User
  // ---------------------------------------------------------------------------

  async saveUser(user: User): Promise<void> {
    localStorage.setItem(this.USER_KEY + user.id, encryptData(JSON.stringify(user)));
  }

  async getUser(id: string): Promise<User | null> {
    const data = localStorage.getItem(this.USER_KEY + id);
    if (!data) return null;
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse User data (healing)', e);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Billets
  // ---------------------------------------------------------------------------

  async saveBillet(billet: Billet): Promise<void> {
    const billets = await this.getAllBillets();
    const index = billets.findIndex((b) => b.id === billet.id);
    if (index >= 0) {
      billets[index] = billet;
    } else {
      billets.push(billet);
    }
    localStorage.setItem(this.BILLETS_KEY, encryptData(JSON.stringify(billets)));
  }

  async getBillet(id: string): Promise<Billet | null> {
    const billets = await this.getAllBillets();
    return billets.find((b) => b.id === id) || null;
  }

  async getAllBillets(): Promise<Billet[]> {
    const data = localStorage.getItem(this.BILLETS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse Billets data (healing)', e);
      return [];
    }
  }

  async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
    const all = await this.getAllBillets();
    return all.slice(offset, offset + limit);
  }

  // ---------------------------------------------------------------------------
  // Applications
  // ---------------------------------------------------------------------------

  async saveApplication(app: Application): Promise<void> {
    const apps = await this.getUserApplications(app.userId); // This gets apps for user, but we need ALL apps to save correctly in this simple store?
    // The previous implementation was: getALL, update, saveALL.
    // Let's reuse that logic.
    const allApps = await this._getAllApplications();
    const index = allApps.findIndex((a) => a.id === app.id);
    if (index >= 0) {
      allApps[index] = app;
    } else {
      allApps.push(app);
    }
    localStorage.setItem(this.APPLICATIONS_KEY, encryptData(JSON.stringify(allApps)));
  }

  async getApplication(id: string): Promise<Application | null> {
    const apps = await this._getAllApplications();
    return apps.find((a) => a.id === id) || null;
  }

  async getUserApplications(userId: string): Promise<Application[]> {
    const apps = await this._getAllApplications();
    return apps.filter((a) => a.userId === userId);
  }

  private async _getAllApplications(): Promise<Application[]> {
    const data = localStorage.getItem(this.APPLICATIONS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse Applications data (healing)', e);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Assignment Decisions
  // ---------------------------------------------------------------------------

  async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
    const decisions = (await this.getAssignmentDecisions(userId)) || {};
    decisions[billetId] = decision;
    localStorage.setItem('my_compass_decisions_' + userId, encryptData(JSON.stringify(decisions)));
  }

  async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
    const decisions = (await this.getAssignmentDecisions(userId)) || {};
    delete decisions[billetId];
    localStorage.setItem('my_compass_decisions_' + userId, encryptData(JSON.stringify(decisions)));
  }

  async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
    const data = localStorage.getItem('my_compass_decisions_' + userId);
    if (!data) return null;
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse AssignmentDecisions data (healing)', e);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Leave Requests
  // ---------------------------------------------------------------------------

  async saveLeaveRequest(request: LeaveRequest): Promise<void> {
    const allRequests = await this._getAllLeaveRequests();
    const index = allRequests.findIndex((r) => r.id === request.id);
    if (index >= 0) {
      allRequests[index] = request;
    } else {
      allRequests.push(request);
    }
    localStorage.setItem(this.LEAVE_REQUESTS_KEY, encryptData(JSON.stringify(allRequests)));
  }

  async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
    const requests = await this._getAllLeaveRequests();
    return requests.find((r) => r.id === id) || null;
  }

  async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
    const requests = await this._getAllLeaveRequests();
    return requests.filter((r) => r.userId === userId);
  }

  async deleteLeaveRequest(requestId: string): Promise<void> {
    const allRequests = await this._getAllLeaveRequests();
    const newRequests = allRequests.filter(r => r.id !== requestId);
    localStorage.setItem(this.LEAVE_REQUESTS_KEY, encryptData(JSON.stringify(newRequests)));
  }

  private async _getAllLeaveRequests(): Promise<LeaveRequest[]> {
    const data = localStorage.getItem(this.LEAVE_REQUESTS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse LeaveRequests data (healing)', e);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // Leave Balance
  // ---------------------------------------------------------------------------

  async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
    localStorage.setItem(this.LEAVE_BALANCE_KEY + balance.userId, encryptData(JSON.stringify(balance)));
  }

  async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
    const data = localStorage.getItem(this.LEAVE_BALANCE_KEY + userId);
    if (!data) return null;
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse LeaveBalance data (healing)', e);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Leave Defaults
  // ---------------------------------------------------------------------------

  async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
    localStorage.setItem('my_compass_leave_defaults_' + userId, encryptData(JSON.stringify(defaults)));
  }

  async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
    const data = localStorage.getItem('my_compass_leave_defaults_' + userId);
    if (!data) return null;
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse LeaveDefaults data (healing)', e);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
    localStorage.setItem(this.DASHBOARD_CACHE_KEY + userId, encryptData(JSON.stringify(data)));
  }

  async getDashboardCache(userId: string): Promise<DashboardData | null> {
    const data = localStorage.getItem(this.DASHBOARD_CACHE_KEY + userId);
    if (!data) return null;
    try {
      return JSON.parse(decryptData(data));
    } catch (e) {
      console.warn('Failed to parse DashboardCache data (healing)', e);
      return null;
    }
  }
}

export const storage: IStorageService = new WebStorage();
