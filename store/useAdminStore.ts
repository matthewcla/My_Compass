// store/useAdminStore.ts
// My Admin Hub — Unified Admin Request Feed
// Aggregates Leave, Reenlistment, OBLISERVE, and Special Requests into a single status view.

import { useLeaveStore } from '@/store/useLeaveStore';
import { LeaveRequest } from '@/types/schema';
import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type AdminRequestType =
    | 'LEAVE'
    | 'REENLISTMENT'
    | 'OBLISERVE'
    | 'SPECIAL_REQUEST'
    | 'ADMIN_REQUEST';

export type AdminStatus = 'action_required' | 'in_progress' | 'completed';

export type AdminSyncState = 'SAVED_LOCALLY' | 'SUBMITTED' | 'CONFIRMED';

export type SlaStatus = 'green' | 'amber' | 'red';

export interface ApprovalStep {
    id: string;
    label: string;
    role: string;
    status: 'pending' | 'approved' | 'denied' | 'current';
}

export interface AdminRequest {
    id: string;
    type: AdminRequestType;
    label: string;                   // Human-readable, e.g. "Annual Leave"
    submittedAt: string;             // ISO 8601
    currentStepLabel: string;        // Plain language, e.g. "Waiting on Chief's endorsement"
    approvalChain: ApprovalStep[];
    status: AdminStatus;
    syncState: AdminSyncState;
    slaStatus: SlaStatus;
    daysSinceLastAction: number;
    actionLabel?: string;            // One-tap action, e.g. "Upload missing document"
    actionRoute?: string;            // Route to navigate to on action tap
    lastSyncedAt: string;            // Offline cache timestamp
    completedAt?: string;            // When the request was completed
    resolutionNote?: string;         // Note from the approver/system on completed requests
    sourceId?: string;               // Original ID from the source store (e.g. leave request ID)
}

export type AdminFilterType =
    | 'ALL'
    | 'LEAVE'
    | 'REENLISTMENT'
    | 'OBLISERVE'
    | 'SPECIAL_REQUEST'
    | 'ADMIN_REQUEST'
    | 'MY_ACTION';

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface AdminStoreState {
    requests: AdminRequest[];
    activeStatusFilter: AdminStatus | null;
    activeTypeFilter: AdminFilterType;
    lastSyncedAt: string;
}

interface AdminStoreActions {
    setStatusFilter: (filter: AdminStatus | null) => void;
    setTypeFilter: (filter: AdminFilterType) => void;
    hydrateFromLeaveStore: () => void;
    getFilteredRequests: () => AdminRequest[];
    getCounts: () => { actionRequired: number; inProgress: number; completed: number };
}

type AdminStore = AdminStoreState & AdminStoreActions;

// =============================================================================
// SEED DATA
// =============================================================================

const NOW = new Date().toISOString();

function daysAgo(n: number): string {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString();
}

const STANDARD_CHAIN: ApprovalStep[] = [
    { id: 'sailor', label: 'Sailor', role: 'Requestor', status: 'approved' },
    { id: 'lpo', label: 'LPO', role: 'Leading Petty Officer', status: 'approved' },
    { id: 'chief', label: 'Chief', role: 'Chief Petty Officer', status: 'current' },
    { id: 'divo', label: 'DIVO', role: 'Division Officer', status: 'pending' },
    { id: 'approved', label: 'Approved', role: 'Final', status: 'pending' },
];

function makeChain(currentIndex: number, total: number = 5): ApprovalStep[] {
    const roles = ['Sailor', 'LPO', 'Chief', 'DIVO', 'CO'];
    const roleLabels = ['Requestor', 'Leading Petty Officer', 'Chief Petty Officer', 'Division Officer', 'Commanding Officer'];
    return roles.slice(0, total).map((label, i) => ({
        id: label.toLowerCase(),
        label,
        role: roleLabels[i],
        status: i < currentIndex ? 'approved' as const
            : i === currentIndex ? 'current' as const
                : 'pending' as const,
    }));
}

function makeCompletedChain(total: number = 5): ApprovalStep[] {
    const roles = ['Sailor', 'LPO', 'Chief', 'DIVO', 'CO'];
    const roleLabels = ['Requestor', 'Leading Petty Officer', 'Chief Petty Officer', 'Division Officer', 'Commanding Officer'];
    return roles.slice(0, total).map((label, i) => ({
        id: label.toLowerCase(),
        label,
        role: roleLabels[i],
        status: 'approved' as const,
    }));
}

const SEED_REQUESTS: AdminRequest[] = [
    // ── Action Required (2) ──────────────────────────────────────────────────
    {
        id: 'admin-req-1',
        type: 'REENLISTMENT',
        label: 'Reenlistment Extension',
        submittedAt: daysAgo(4),
        currentStepLabel: 'Upload missing Page 13',
        approvalChain: makeChain(0, 4),
        status: 'action_required',
        syncState: 'CONFIRMED',
        slaStatus: 'red',
        daysSinceLastAction: 4,
        actionLabel: 'Upload Document',
        lastSyncedAt: NOW,
    },
    {
        id: 'admin-req-2',
        type: 'LEAVE',
        label: 'Annual Leave',
        submittedAt: daysAgo(1),
        currentStepLabel: 'Returned — update emergency contact',
        approvalChain: makeChain(0, 5),
        status: 'action_required',
        syncState: 'CONFIRMED',
        slaStatus: 'amber',
        daysSinceLastAction: 1,
        actionLabel: 'Fix & Resubmit',
        actionRoute: '/leave/request',
        lastSyncedAt: NOW,
    },

    // ── In Progress (3) ─────────────────────────────────────────────────────
    {
        id: 'admin-req-3',
        type: 'LEAVE',
        label: 'Annual Leave',
        submittedAt: daysAgo(2),
        currentStepLabel: "Waiting on Chief's endorsement",
        approvalChain: makeChain(2, 5),
        status: 'in_progress',
        syncState: 'CONFIRMED',
        slaStatus: 'green',
        daysSinceLastAction: 1,
        lastSyncedAt: NOW,
    },
    {
        id: 'admin-req-4',
        type: 'OBLISERVE',
        label: 'OBLISERVE Extension',
        submittedAt: daysAgo(5),
        currentStepLabel: 'Pending DIVO review',
        approvalChain: makeChain(3, 5),
        status: 'in_progress',
        syncState: 'CONFIRMED',
        slaStatus: 'amber',
        daysSinceLastAction: 3,
        lastSyncedAt: NOW,
    },
    {
        id: 'admin-req-5',
        type: 'SPECIAL_REQUEST',
        label: 'Special Liberty',
        submittedAt: daysAgo(1),
        currentStepLabel: 'Forwarded to LPO',
        approvalChain: makeChain(1, 4),
        status: 'in_progress',
        syncState: 'SUBMITTED',
        slaStatus: 'green',
        daysSinceLastAction: 0,
        lastSyncedAt: NOW,
    },

    // ── Completed (5) ─────────────────────────────────────────────────────
    {
        id: 'admin-req-6',
        type: 'LEAVE',
        label: 'Annual Leave',
        submittedAt: daysAgo(30),
        currentStepLabel: 'Approved',
        approvalChain: makeCompletedChain(5),
        status: 'completed',
        syncState: 'CONFIRMED',
        slaStatus: 'green',
        daysSinceLastAction: 28,
        lastSyncedAt: NOW,
        completedAt: daysAgo(28),
        resolutionNote: 'Approved by CDR Johnson',
    },
    {
        id: 'admin-req-7',
        type: 'ADMIN_REQUEST',
        label: 'ID Card Renewal',
        submittedAt: daysAgo(20),
        currentStepLabel: 'Completed',
        approvalChain: makeCompletedChain(3),
        status: 'completed',
        syncState: 'CONFIRMED',
        slaStatus: 'green',
        daysSinceLastAction: 18,
        lastSyncedAt: NOW,
        completedAt: daysAgo(18),
        resolutionNote: 'New CAC issued',
    },
    {
        id: 'admin-req-8',
        type: 'LEAVE',
        label: 'Emergency Leave',
        submittedAt: daysAgo(45),
        currentStepLabel: 'Approved',
        approvalChain: makeCompletedChain(5),
        status: 'completed',
        syncState: 'CONFIRMED',
        slaStatus: 'green',
        daysSinceLastAction: 43,
        lastSyncedAt: NOW,
        completedAt: daysAgo(43),
        resolutionNote: 'Emergency leave approved — 5 days charged',
    },
    {
        id: 'admin-req-9',
        type: 'SPECIAL_REQUEST',
        label: 'Overnight Liberty',
        submittedAt: daysAgo(15),
        currentStepLabel: 'Approved',
        approvalChain: makeCompletedChain(4),
        status: 'completed',
        syncState: 'CONFIRMED',
        slaStatus: 'green',
        daysSinceLastAction: 14,
        lastSyncedAt: NOW,
        completedAt: daysAgo(14),
        resolutionNote: 'Liberty approved for 48 hours',
    },
    {
        id: 'admin-req-10',
        type: 'REENLISTMENT',
        label: 'Reenlistment',
        submittedAt: daysAgo(60),
        currentStepLabel: 'Completed',
        approvalChain: makeCompletedChain(5),
        status: 'completed',
        syncState: 'CONFIRMED',
        slaStatus: 'green',
        daysSinceLastAction: 55,
        lastSyncedAt: NOW,
        completedAt: daysAgo(55),
        resolutionNote: '4-year reenlistment processed',
    },
];

// =============================================================================
// LEAVE BRIDGE — Map LeaveRequest → AdminRequest
// =============================================================================

function bridgeLeaveRequest(req: LeaveRequest): AdminRequest {
    // Map leave status → AdminStatus
    const statusMap: Record<string, AdminStatus> = {
        draft: 'action_required',
        returned: 'action_required',
        pending: 'in_progress',
        approved: 'completed',
        denied: 'completed',
        cancelled: 'completed',
    };

    // Derive SLA from days since last update
    const lastUpdate = new Date(req.updatedAt);
    const daysSince = Math.floor((Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
    const sla: SlaStatus = daysSince > 5 ? 'red' : daysSince > 2 ? 'amber' : 'green';

    // Build approval chain from leave request data
    const chain: ApprovalStep[] = req.approvalChain.map((approver, i) => ({
        id: approver.id,
        label: approver.name.split(' ').pop() || approver.name,
        role: approver.title || 'Approver',
        status: approver.action === 'approved' ? 'approved' as const
            : approver.action === 'denied' ? 'denied' as const
                : approver.id === req.currentApproverId ? 'current' as const
                    : 'pending' as const,
    }));

    // Plain-language current step
    let currentStepLabel = 'Processing';
    if (req.status === 'draft') currentStepLabel = 'Draft — ready to submit';
    else if (req.status === 'returned') currentStepLabel = `Returned — ${req.returnReason || 'corrections needed'}`;
    else if (req.status === 'pending') {
        const currentApprover = req.approvalChain.find(a => a.id === req.currentApproverId);
        currentStepLabel = currentApprover
            ? `Waiting on ${currentApprover.title || currentApprover.name}`
            : 'Awaiting review';
    }
    else if (req.status === 'approved') currentStepLabel = 'Approved';
    else if (req.status === 'denied') currentStepLabel = `Denied — ${req.denialReason || 'see remarks'}`;
    else if (req.status === 'cancelled') currentStepLabel = 'Cancelled by member';

    // Sync state
    const syncState: AdminSyncState = req.syncStatus === 'synced'
        ? 'CONFIRMED'
        : req.syncStatus === 'pending_upload'
            ? 'SUBMITTED'
            : 'SAVED_LOCALLY';

    // Leave type label
    const typeLabels: Record<string, string> = {
        annual: 'Annual Leave',
        emergency: 'Emergency Leave',
        convalescent: 'Convalescent Leave',
        terminal: 'Terminal Leave',
        parental: 'Parental Leave',
        bereavement: 'Bereavement Leave',
        adoption: 'Adoption Leave',
        ptdy: 'Permissive TDY',
        other: 'Special Absence',
    };

    return {
        id: `leave-${req.id}`,
        type: 'LEAVE',
        label: typeLabels[req.leaveType] || 'Leave',
        submittedAt: req.submittedAt || req.createdAt,
        currentStepLabel,
        approvalChain: chain.length > 0 ? chain : [
            { id: 'sailor', label: 'You', role: 'Requestor', status: req.status === 'draft' ? 'current' : 'approved' },
        ],
        status: statusMap[req.status] || 'in_progress',
        syncState,
        slaStatus: sla,
        daysSinceLastAction: daysSince,
        actionLabel: req.status === 'draft' ? 'Continue Draft' : req.status === 'returned' ? 'Fix & Resubmit' : undefined,
        actionRoute: req.status === 'draft' ? '/leave/request' : req.status === 'returned' ? '/leave/request' : undefined,
        lastSyncedAt: req.lastSyncTimestamp,
        completedAt: ['approved', 'denied', 'cancelled'].includes(req.status) ? req.updatedAt : undefined,
        resolutionNote: req.status === 'approved' ? 'Leave approved' : req.status === 'denied' ? req.denialReason || undefined : undefined,
        sourceId: req.id,
    };
}

// =============================================================================
// URGENCY SORT — Action Required first, then by SLA severity
// =============================================================================

const STATUS_PRIORITY: Record<AdminStatus, number> = {
    action_required: 0,
    in_progress: 1,
    completed: 2,
};

const SLA_PRIORITY: Record<SlaStatus, number> = {
    red: 0,
    amber: 1,
    green: 2,
};

function sortByUrgency(a: AdminRequest, b: AdminRequest): number {
    const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status];
    if (statusDiff !== 0) return statusDiff;
    const slaDiff = SLA_PRIORITY[a.slaStatus] - SLA_PRIORITY[b.slaStatus];
    if (slaDiff !== 0) return slaDiff;
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
}

// =============================================================================
// STORE
// =============================================================================

export const useAdminStore = create<AdminStore>((set, get) => ({
    requests: SEED_REQUESTS,
    activeStatusFilter: null,
    activeTypeFilter: 'ALL',
    lastSyncedAt: NOW,

    setStatusFilter: (filter) => set({ activeStatusFilter: filter }),

    setTypeFilter: (filter) => set({ activeTypeFilter: filter }),

    hydrateFromLeaveStore: () => {
        const leaveRequests = useLeaveStore.getState().leaveRequests;
        const leaveAdminRequests = Object.values(leaveRequests).map(bridgeLeaveRequest);

        // Merge: keep seed non-LEAVE requests, replace LEAVE requests with bridged ones
        const seedNonLeave = SEED_REQUESTS.filter(r => r.type !== 'LEAVE');
        const merged = [...seedNonLeave, ...leaveAdminRequests];

        // If no leave requests were bridged, keep the seed LEAVE entries
        if (leaveAdminRequests.length === 0) {
            set({ requests: SEED_REQUESTS, lastSyncedAt: new Date().toISOString() });
        } else {
            set({ requests: merged, lastSyncedAt: new Date().toISOString() });
        }
    },

    getFilteredRequests: () => {
        const { requests, activeStatusFilter, activeTypeFilter } = get();
        let filtered = [...requests];

        // Status bucket filter
        if (activeStatusFilter) {
            filtered = filtered.filter(r => r.status === activeStatusFilter);
        }

        // Type chip filter
        if (activeTypeFilter === 'MY_ACTION') {
            filtered = filtered.filter(r => r.status === 'action_required');
        } else if (activeTypeFilter !== 'ALL') {
            filtered = filtered.filter(r => r.type === activeTypeFilter);
        }

        return filtered.sort(sortByUrgency);
    },

    getCounts: () => {
        const requests = get().requests;
        return {
            actionRequired: requests.filter(r => r.status === 'action_required').length,
            inProgress: requests.filter(r => r.status === 'in_progress').length,
            completed: requests.filter(r => r.status === 'completed').length,
        };
    },
}));
