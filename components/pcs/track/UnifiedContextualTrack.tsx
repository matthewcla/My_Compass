import { TrackChecklistItem } from '@/components/pcs/track/TrackChecklistItem';
import { TrackNode } from '@/components/pcs/track/TrackNode';
import { UCT_PHASES } from '@/constants/UCTPhases';
import { useActiveOrder, usePCSStore, useUCTPhaseStatus } from '@/store/usePCSStore';
import { ChecklistItem, UCTNodeStatus, UCTPhase } from '@/types/pcs';
import React, { useCallback, useMemo } from 'react';
import { View } from 'react-native';

// ─── Widget Sets Per Phase ─────────────────────────────────────
// Widgets render inside their respective task flows or on the Home Hub,
// not inline in the UCT track. Only Phase 4 retains inline widgets.

function Phase1Widgets() {
    return null;
}

function Phase2Widgets() {
    // Phase 2 widgets now live inside the Financial Review and
    // HHG Move Planner flows — not inline in the track.
    return null;
}

function Phase3Widgets() {
    // Phase 3 widgets live on the Home Hub (ReceiptScannerWidget) and
    // inside the PCS Travel Plan wizard (leave impact + travel day counter).
    return null;
}

function Phase4Widgets() {
    // Phase 4 widgets live on the Home Hub (ArrivalBriefing, GainingCommandCard,
    // TravelClaimHUD, LiquidationTracker) and inside the Check-In flow (BaseWelcomeKit).
    return null;
}

const PHASE_WIDGETS: Record<UCTPhase, React.ComponentType> = {
    1: Phase1Widgets,
    2: Phase2Widgets,
    3: Phase3Widgets,
    4: Phase4Widgets,
};

// ─── Date Range Helpers ────────────────────────────────────────

function computeDateRange(
    phase: UCTPhase,
    reportNLT: string | undefined
): string | undefined {
    if (!reportNLT) return undefined;

    const report = new Date(reportNLT);
    if (Number.isNaN(report.getTime())) return undefined;

    const fmt = (d: Date) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    // Phase date windows are rough estimates relative to report NLT.
    // Phase 1: orders received → 90 days before report
    // Phase 2: 90 days → 30 days before report
    // Phase 3: 30 days before → report date
    // Phase 4: report date onward
    switch (phase) {
        case 2: {
            const start = new Date(report);
            start.setDate(start.getDate() - 90);
            const end = new Date(report);
            end.setDate(end.getDate() - 30);
            return `${fmt(start)} – ${fmt(end)}`;
        }
        case 3: {
            const start = new Date(report);
            start.setDate(start.getDate() - 30);
            return `${fmt(start)} – ${fmt(report)}`;
        }
        default:
            return undefined;
    }
}

function computeDaysIndicator(
    phase: UCTPhase,
    status: UCTNodeStatus,
    reportNLT: string | undefined
): string | undefined {
    if (!reportNLT || status === 'COMPLETED') return undefined;

    const report = new Date(reportNLT);
    if (Number.isNaN(report.getTime())) return undefined;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    report.setHours(0, 0, 0, 0);

    // Phase window start dates (same logic as computeDateRange)
    const phaseStart = new Date(report);
    const phaseEnd = new Date(report);

    switch (phase) {
        case 1:
            // Phase 1 has no fixed window — skip
            return undefined;
        case 2:
            phaseStart.setDate(phaseStart.getDate() - 90);
            phaseEnd.setDate(phaseEnd.getDate() - 30);
            break;
        case 3:
            phaseStart.setDate(phaseStart.getDate() - 30);
            // phaseEnd = reportNLT
            break;
        case 4:
            // Phase 4 starts at report date
            phaseStart.setTime(report.getTime());
            phaseEnd.setDate(phaseEnd.getDate() + 30);
            break;
    }

    const daysToStart = Math.ceil((phaseStart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const daysToEnd = Math.ceil((phaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (status === 'LOCKED') {
        if (daysToStart > 0) {
            return `Starts in ${daysToStart} day${daysToStart === 1 ? '' : 's'}`;
        }
        return undefined;
    }

    // ACTIVE
    if (daysToEnd > 0) {
        return `${daysToEnd} day${daysToEnd === 1 ? '' : 's'} remaining`;
    }
    if (daysToEnd === 0) {
        return 'Due today';
    }
    return `${Math.abs(daysToEnd)} day${Math.abs(daysToEnd) === 1 ? '' : 's'} overdue`;
}

// ─── Orchestrator ──────────────────────────────────────────────

/**
 * UnifiedContextualTrack — Orchestrator
 *
 * Dynamically renders 4 TrackNodes with:
 *  - Checklist items grouped by uctPhase from the store
 *  - Phase-specific widgets injected inside the ACTIVE node
 *  - Date ranges derived from activeOrder.reportNLT
 *
 * Replaces the previous hardcoded PCSActiveState content,
 * completing Phase 3 of the TIMELINE.md UCT spec.
 */
export function UnifiedContextualTrack() {
    const checklist = usePCSStore((s) => s.checklist);
    const setStatus = usePCSStore((s) => s.setChecklistItemStatus);
    const activeOrder = useActiveOrder();
    const uctStatus = useUCTPhaseStatus();

    // Group checklist items by uctPhase, sorted by status priority
    const groupedItems = useMemo(() => {
        const groups: Record<UCTPhase, ChecklistItem[]> = { 1: [], 2: [], 3: [], 4: [] };

        for (const item of checklist) {
            if (item.uctPhase >= 1 && item.uctPhase <= 4) {
                groups[item.uctPhase as UCTPhase].push(item);
            }
        }

        // Sort: NOT_STARTED (with actionRoute first) → IN_PROGRESS → COMPLETE
        const statusOrder: Record<ChecklistItem['status'], number> = {
            NOT_STARTED: 0,
            IN_PROGRESS: 1,
            COMPLETE: 2,
        };

        for (const phase of [1, 2, 3, 4] as UCTPhase[]) {
            groups[phase].sort((a, b) => {
                const sDiff = statusOrder[a.status] - statusOrder[b.status];
                if (sDiff !== 0) return sDiff;
                // Within same status, items with actionRoute come first
                if (a.actionRoute && !b.actionRoute) return -1;
                if (!a.actionRoute && b.actionRoute) return 1;
                return 0;
            });
        }

        return groups;
    }, [checklist]);

    const handleToggle = useCallback(
        (id: string) => {
            const item = checklist.find((c) => c.id === id);
            if (!item) return;

            const nextStatus: ChecklistItem['status'] =
                item.status === 'NOT_STARTED'
                    ? 'IN_PROGRESS'
                    : item.status === 'IN_PROGRESS'
                        ? 'COMPLETE'
                        : 'COMPLETE';

            setStatus(id, nextStatus);
        },
        [checklist, setStatus]
    );

    return (
        <View>
            {UCT_PHASES.map((config, index) => {
                const phase = config.phase;
                const status = uctStatus[phase];
                const items = groupedItems[phase];
                const isLast = index === UCT_PHASES.length - 1;
                const dateRange = computeDateRange(phase, activeOrder?.reportNLT);
                const daysIndicator = computeDaysIndicator(phase, status, activeOrder?.reportNLT);
                const WidgetSet = PHASE_WIDGETS[phase];

                return (
                    <TrackNode
                        key={phase}
                        phase={phase}
                        title={config.title}
                        dateRange={dateRange}
                        daysIndicator={daysIndicator}
                        status={status}
                        isLast={isLast}
                    >
                        {/* Checklist Items */}
                        {items.length > 0 && (
                            <View>
                                {items.map((item) => (
                                    <TrackChecklistItem
                                        key={item.id}
                                        item={item}
                                        onToggle={handleToggle}
                                    />
                                ))}
                            </View>
                        )}

                        {/* Phase Widgets — only rendered for ACTIVE nodes */}
                        {status === 'ACTIVE' && <WidgetSet />}
                    </TrackNode>
                );
            })}
        </View>
    );
}
