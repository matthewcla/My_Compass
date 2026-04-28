import { useMemo } from 'react';
import { useLeaveStore } from '@/store/useLeaveStore';
import { useTravelClaimStore } from '@/store/useTravelClaimStore';
import { useInboxStore } from '@/store/useInboxStore';
import { usePCSPhase } from '@/store/usePCSStore';
import { useAdminStore } from '@/store/useAdminStore';
import { MaterialIcons } from '@expo/vector-icons';

export type PriorityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface HubAction {
    id: string;
    title: string;
    description: string;
    priority: PriorityLevel;
    score: number;
    icon: keyof typeof MaterialIcons.glyphMap;
    route: string;
    actionText: string;
    dueText?: string;
}

export function useHubPriority() {
    const leaveRequests = useLeaveStore((state) => state.leaveRequests);
    const travelClaims = useTravelClaimStore((state) => state.travelClaims);
    const inboxMessages = useInboxStore((state) => state.messages);
    const pcsPhase = usePCSPhase();
    const adminRequests = useAdminStore((state) => state.requests);

    return useMemo(() => {
        const actions: HubAction[] = [];

        // 1. Admin Pending Requests = CRITICAL (Score 100)
        const actionRequiredAdmin = (adminRequests || []).filter(r => r.status === 'action_required');
        actionRequiredAdmin.forEach(req => {
            actions.push({
                id: `admin-${req.id}`,
                title: req.label,
                description: req.currentStepLabel || 'Action required on your admin request.',
                priority: 'CRITICAL',
                score: 100,
                icon: 'assignment-late',
                route: req.actionRoute || '/(tabs)/(admin)',
                actionText: req.actionLabel || 'View Request',
                dueText: 'Immediate Action Required',
            });
        });

        // 2. Travel Claim Returned = CRITICAL (Score 90)
        const returnedTravel = Object.values(travelClaims || {}).filter(c => c.status === 'returned');
        returnedTravel.forEach(claim => {
            actions.push({
                id: `travel-${claim.id}`,
                title: 'Travel Claim Returned',
                description: 'Your travel claim was returned for corrections.',
                priority: 'CRITICAL',
                score: 90,
                icon: 'flight-takeoff',
                route: `/travel-claim/${claim.id}`,
                actionText: 'Review Claim',
                dueText: 'Action Required',
            });
        });

        // 3. Active PCS Move = HIGH (Score 80)
        if (pcsPhase && pcsPhase !== 'DORMANT') {
            actions.push({
                id: 'active-pcs',
                title: 'Active PCS Move',
                description: `You are currently in the ${pcsPhase.replace('_', ' ')} phase of your PCS.`,
                priority: 'HIGH',
                score: 80,
                icon: 'local-shipping',
                route: '/(tabs)/(pcs)',
                actionText: 'Go to PCS Hub',
            });
        }

        // 4. Leave Returned or Draft = MEDIUM (Score 60/70)
        const returnedLeave = Object.values(leaveRequests || {}).filter(r => r.status === 'returned');
        returnedLeave.forEach(req => {
            actions.push({
                id: `leave-returned-${req.id}`,
                title: 'Leave Request Returned',
                description: 'Your leave request needs corrections.',
                priority: 'HIGH',
                score: 75,
                icon: 'event-busy',
                route: `/leave/request?draftId=${req.id}`,
                actionText: 'Fix & Resubmit',
            });
        });

        const draftLeave = Object.values(leaveRequests || {}).filter(r => r.status === 'draft');
        draftLeave.forEach(req => {
            actions.push({
                id: `leave-draft-${req.id}`,
                title: 'Draft Leave Request',
                description: 'You have an unsubmitted leave request.',
                priority: 'MEDIUM',
                score: 60,
                icon: 'event-note',
                route: `/leave/request?draftId=${req.id}`,
                actionText: 'Continue Draft',
            });
        });

        // 5. Unread Inbox Messages = MEDIUM (Score 50)
        const unreadMessages = (inboxMessages || []).filter(m => !m.isRead);
        if (unreadMessages.length > 0) {
            actions.push({
                id: 'unread-inbox',
                title: 'Unread Messages',
                description: `You have ${unreadMessages.length} unread message${unreadMessages.length > 1 ? 's' : ''}.`,
                priority: 'MEDIUM',
                score: 50,
                icon: 'mail',
                route: '/(tabs)/(hub)/inbox',
                actionText: 'Go to Inbox',
            });
        }

        return actions.sort((a, b) => b.score - a.score);
    }, [leaveRequests, travelClaims, inboxMessages, pcsPhase, adminRequests]);
}
