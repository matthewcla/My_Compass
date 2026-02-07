import { IStorageService } from '@/services/storage.interface';
import { InboxMessage } from '@/types/inbox';

console.log("MOCK STORAGE LOADED");

class MockStorage implements IStorageService {
  // ... (rest of the file)
  private inboxMessages: InboxMessage[] = [];

  async init(): Promise<void> { }

  // User
  async saveUser(): Promise<void> { }
  async getUser(): Promise<null> { return null; }

  // Billets
  async saveBillet(): Promise<void> { }
  async getBillet(): Promise<null> { return null; }
  async getAllBillets(): Promise<any[]> { return []; }
  async getBilletCount(): Promise<number> { return 0; }
  async getPagedBillets(): Promise<any[]> { return []; }

  // Applications
  async saveApplication(): Promise<void> { }
  async getApplication(): Promise<null> { return null; }
  async getUserApplications(): Promise<any[]> { return []; }

  // Assignment Decisions
  async saveAssignmentDecision(): Promise<void> { }
  async removeAssignmentDecision(): Promise<void> { }
  async getAssignmentDecisions(): Promise<null> { return null; }

  // Leave Requests
  async saveLeaveRequest(): Promise<void> { }
  async getLeaveRequest(): Promise<null> { return null; }
  async getUserLeaveRequests(): Promise<any[]> { return []; }
  async deleteLeaveRequest(): Promise<void> { }

  // Leave Balance
  async saveLeaveBalance(): Promise<void> { }
  async getLeaveBalance(): Promise<null> { return null; }

  // Leave Defaults
  async saveLeaveDefaults(): Promise<void> { }
  async getLeaveDefaults(): Promise<null> { return null; }

  // Dashboard
  async saveDashboardCache(): Promise<void> { }
  async getDashboardCache(): Promise<null> { return null; }

  // Inbox
  async saveInboxMessages(messages: InboxMessage[]): Promise<void> {
    this.inboxMessages = messages;
  }
  async getInboxMessages(): Promise<InboxMessage[]> {
    return this.inboxMessages;
  }

  // Career Events
  private careerEvents: any[] = []; // Using any[] to avoid missing import, or could import CareerEvent
  async saveCareerEvents(events: any[]): Promise<void> {
    this.careerEvents = events;
  }
  async getCareerEvents(): Promise<any[]> {
    return this.careerEvents;
  }
}

export const storage = new MockStorage();
