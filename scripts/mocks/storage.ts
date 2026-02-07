import { IStorageService } from '@/services/storage.interface';
import { InboxMessage } from '@/types/inbox';
import { Application, Billet, LeaveRequest, LeaveBalance, LeaveRequestDefaults } from '@/types/schema';
import { User } from '@/types/user';
import { DashboardData } from '@/types/dashboard';
import { CareerEvent } from '@/types/career';

console.log("MOCK STORAGE LOADED");

class MockStorage implements IStorageService {
    // In-memory data structures
    private users = new Map<string, User>();
    private billets = new Map<string, Billet>();
    private applications = new Map<string, Application>();
    private leaveRequests = new Map<string, LeaveRequest>();
    private leaveBalances = new Map<string, LeaveBalance>();
    private leaveDefaults = new Map<string, LeaveRequestDefaults>();
    private dashboardCache = new Map<string, DashboardData>();
    private decisions = new Map<string, Record<string, string>>();
    private inboxMessages: InboxMessage[] = [];
    private careerEvents: CareerEvent[] = [];

    async init(): Promise<void> { }

    // User
    async saveUser(user: User): Promise<void> {
        this.users.set(user.id, user);
    }
    async getUser(id: string): Promise<User | null> {
        return this.users.get(id) || null;
    }

    // Billets
    async saveBillet(billet: Billet): Promise<void> {
        this.billets.set(billet.id, billet);
    }
    async getBillet(id: string): Promise<Billet | null> {
        return this.billets.get(id) || null;
    }
    async getAllBillets(): Promise<Billet[]> {
        return Array.from(this.billets.values());
    }
    async getPagedBillets(limit: number, offset: number): Promise<Billet[]> {
        const all = Array.from(this.billets.values());
        return all.slice(offset, offset + limit);
    }

    // Applications
    async saveApplication(app: Application): Promise<void> {
        this.applications.set(app.id, app);
    }
    async saveApplications(apps: Application[]): Promise<void> {
        apps.forEach(app => this.applications.set(app.id, app));
    }
    async getApplication(id: string): Promise<Application | null> {
        return this.applications.get(id) || null;
    }
    async getUserApplications(userId: string): Promise<Application[]> {
        return Array.from(this.applications.values()).filter(a => a.userId === userId);
    }
    async deleteApplication(appId: string): Promise<void> {
        this.applications.delete(appId);
    }

    // Assignment Decisions
    async saveAssignmentDecision(userId: string, billetId: string, decision: string): Promise<void> {
        const current = this.decisions.get(userId) || {};
        current[billetId] = decision;
        this.decisions.set(userId, current);
    }
    async removeAssignmentDecision(userId: string, billetId: string): Promise<void> {
        const current = this.decisions.get(userId) || {};
        delete current[billetId];
        this.decisions.set(userId, current);
    }
    async getAssignmentDecisions(userId: string): Promise<Record<string, string> | null> {
        return this.decisions.get(userId) || null;
    }

    // Leave Requests
    async saveLeaveRequest(request: LeaveRequest): Promise<void> {
        this.leaveRequests.set(request.id, request);
    }
    async getLeaveRequest(id: string): Promise<LeaveRequest | null> {
        return this.leaveRequests.get(id) || null;
    }
    async getUserLeaveRequests(userId: string): Promise<LeaveRequest[]> {
        return Array.from(this.leaveRequests.values()).filter(r => r.userId === userId);
    }
    async deleteLeaveRequest(requestId: string): Promise<void> {
        this.leaveRequests.delete(requestId);
    }

    // Leave Balance
    async saveLeaveBalance(balance: LeaveBalance): Promise<void> {
        this.leaveBalances.set(balance.userId, balance);
    }
    async getLeaveBalance(userId: string): Promise<LeaveBalance | null> {
        return this.leaveBalances.get(userId) || null;
    }

    // Leave Defaults
    async saveLeaveDefaults(userId: string, defaults: LeaveRequestDefaults): Promise<void> {
        this.leaveDefaults.set(userId, defaults);
    }
    async getLeaveDefaults(userId: string): Promise<LeaveRequestDefaults | null> {
        return this.leaveDefaults.get(userId) || null;
    }

    // Dashboard
    async saveDashboardCache(userId: string, data: DashboardData): Promise<void> {
        this.dashboardCache.set(userId, data);
    }
    async getDashboardCache(userId: string): Promise<DashboardData | null> {
        return this.dashboardCache.get(userId) || null;
    }

    // Inbox
    async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
        this.inboxMessages = messages;
    }
    async getInboxMessages(): Promise<InboxMessage[]> {
        return this.inboxMessages;
    }

    async updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void> {
        this.inboxMessages = this.inboxMessages.map(m => m.id === id ? { ...m, isRead } : m);
    }

    // Career Events
    async saveCareerEvents(events: CareerEvent[]): Promise<void> {
        this.careerEvents = events;
    }
    async getCareerEvents(): Promise<CareerEvent[]> {
        return this.careerEvents;
    }
}

export const storage = new MockStorage();
