import { IStorageService } from '@/services/storage.interface';
import { InboxMessage } from '@/types/inbox';

console.log("BENCHMARK STORAGE LOADED");

class BenchmarkStorage implements IStorageService {
  messages: InboxMessage[] = [];

  // Metrics
  writeOperations = 0;
  itemsWritten = 0;

  resetMetrics() {
    this.writeOperations = 0;
    this.itemsWritten = 0;
  }

  async init(): Promise<void> { }

  // User
  async saveUser(): Promise<void> { }
  async getUser(): Promise<null> { return null; }

  // Billets
  async saveBillet(): Promise<void> { }
  async getBillet(): Promise<null> { return null; }
  async getAllBillets(): Promise<any[]> { return []; }
  async getPagedBillets(): Promise<any[]> { return []; }
  async getBilletCount(): Promise<number> { return 0; }

  // Applications
  async saveApplication(): Promise<void> { }
  async saveApplications(): Promise<void> { }
  async getApplication(): Promise<null> { return null; }
  async getUserApplications(): Promise<any[]> { return []; }
  async deleteApplication(): Promise<void> { }

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
    this.writeOperations++;
    this.itemsWritten += messages.length; // Simulate O(N) cost
    this.messages = messages;
  }
  async getInboxMessages(): Promise<InboxMessage[]> {
    return this.messages;
  }

  async updateInboxMessageReadStatus(id: string, isRead: boolean): Promise<void> {
    this.writeOperations++;
    this.itemsWritten += 1; // Simulate O(1) cost

    this.messages = this.messages.map(m => m.id === id ? { ...m, isRead } : m);
  }

  async updateInboxMessagePinStatus(id: string, isPinned: boolean): Promise<void> {
    this.writeOperations++;
    this.itemsWritten += 1;

    this.messages = this.messages.map(m => m.id === id ? { ...m, isPinned } : m);
  }

  // Career Events
  async saveCareerEvents(events: any[]): Promise<void> { }
  async getCareerEvents(): Promise<any[]> { return []; }

  // Historical PCS Orders
  async saveHistoricalPCSOrder(_order: any): Promise<void> { }
  async getUserHistoricalPCSOrders(_userId: string): Promise<any[]> { return []; }
  async getHistoricalPCSOrder(_id: string): Promise<null> { return null; }
  async deleteHistoricalPCSOrder(_id: string): Promise<void> { }

  // PCS Documents
  async savePCSDocument(_doc: any): Promise<void> { }
  async getPCSDocument(_docId: string): Promise<null> { return null; }
  async getPCSDocuments(_pcsOrderId: string): Promise<any[]> { return []; }
  async deletePCSDocument(_docId: string): Promise<void> { }
}

export const storage = new BenchmarkStorage();
