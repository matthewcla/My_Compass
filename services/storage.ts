import { IStorageService } from './storage.interface';
import { DatabaseManager } from './db/DatabaseManager';
import { userRepository } from './repositories/UserRepository';
import { billetRepository } from './repositories/BilletRepository';
import { applicationRepository } from './repositories/ApplicationRepository';
import { leaveRepository } from './repositories/LeaveRepository';
import { dashboardRepository } from './repositories/DashboardRepository';
import { inboxRepository } from './repositories/InboxRepository';
import { careerRepository } from './repositories/CareerRepository';
import { pcsRepository } from './repositories/PCSRepository';

export const storage: IStorageService = {
  init: DatabaseManager.init.bind(DatabaseManager),

  // User
  saveUser: userRepository.saveUser.bind(userRepository),
  getUser: userRepository.getUser.bind(userRepository),

  // Billets
  saveBillet: billetRepository.saveBillet.bind(billetRepository),
  getBillet: billetRepository.getBillet.bind(billetRepository),
  getAllBillets: billetRepository.getAllBillets.bind(billetRepository),
  getBilletCount: billetRepository.getBilletCount.bind(billetRepository),
  getPagedBillets: billetRepository.getPagedBillets.bind(billetRepository),

  // Applications
  saveApplication: applicationRepository.saveApplication.bind(applicationRepository),
  saveApplications: applicationRepository.saveApplications.bind(applicationRepository),
  getApplication: applicationRepository.getApplication.bind(applicationRepository),
  getUserApplications: applicationRepository.getUserApplications.bind(applicationRepository),
  deleteApplication: applicationRepository.deleteApplication.bind(applicationRepository),

  // Assignment Decisions
  saveAssignmentDecision: applicationRepository.saveAssignmentDecision.bind(applicationRepository),
  removeAssignmentDecision: applicationRepository.removeAssignmentDecision.bind(applicationRepository),
  getAssignmentDecisions: applicationRepository.getAssignmentDecisions.bind(applicationRepository),

  // Leave Requests
  saveLeaveRequest: leaveRepository.saveLeaveRequest.bind(leaveRepository),
  getLeaveRequest: leaveRepository.getLeaveRequest.bind(leaveRepository),
  getUserLeaveRequests: leaveRepository.getUserLeaveRequests.bind(leaveRepository),
  deleteLeaveRequest: leaveRepository.deleteLeaveRequest.bind(leaveRepository),

  // Leave Balance
  saveLeaveBalance: leaveRepository.saveLeaveBalance.bind(leaveRepository),
  getLeaveBalance: leaveRepository.getLeaveBalance.bind(leaveRepository),

  // Leave Defaults
  saveLeaveDefaults: leaveRepository.saveLeaveDefaults.bind(leaveRepository),
  getLeaveDefaults: leaveRepository.getLeaveDefaults.bind(leaveRepository),

  // Dashboard
  saveDashboardCache: dashboardRepository.saveDashboardCache.bind(dashboardRepository),
  getDashboardCache: dashboardRepository.getDashboardCache.bind(dashboardRepository),

  // Inbox
  saveInboxMessages: inboxRepository.saveInboxMessages.bind(inboxRepository),
  getInboxMessages: inboxRepository.getInboxMessages.bind(inboxRepository),
  updateInboxMessageReadStatus: inboxRepository.updateInboxMessageReadStatus.bind(inboxRepository),
  updateInboxMessagePinStatus: inboxRepository.updateInboxMessagePinStatus.bind(inboxRepository),

  // Career Events
  saveCareerEvents: careerRepository.saveCareerEvents.bind(careerRepository),
  getCareerEvents: careerRepository.getCareerEvents.bind(careerRepository),

  // Historical PCS Orders
  saveHistoricalPCSOrder: pcsRepository.saveHistoricalPCSOrder.bind(pcsRepository),
  getUserHistoricalPCSOrders: pcsRepository.getUserHistoricalPCSOrders.bind(pcsRepository),
  getHistoricalPCSOrder: pcsRepository.getHistoricalPCSOrder.bind(pcsRepository),
  deleteHistoricalPCSOrder: pcsRepository.deleteHistoricalPCSOrder.bind(pcsRepository),

  // PCS Documents
  savePCSDocument: pcsRepository.savePCSDocument.bind(pcsRepository),
  getPCSDocument: pcsRepository.getPCSDocument.bind(pcsRepository),
  getPCSDocuments: pcsRepository.getPCSDocuments.bind(pcsRepository),
  deletePCSDocument: pcsRepository.deletePCSDocument.bind(pcsRepository),
};
