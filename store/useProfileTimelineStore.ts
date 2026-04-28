/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Profile Timeline Store
 *
 * Synthesizes a chronological timeline of profile changes from existing
 * DemoUser career data, user profile fields, and PCS archive records.
 * Pure in-memory computation — no persistence needed.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { DemoUser } from '@/constants/DemoData';
import type { ProfileEvent, ProfileEventCategory } from '@/types/profileTimeline';
import { create } from 'zustand';

// ─── Helpers ─────────────────────────────────────────────────

let idCounter = 0;
function nextId(): string {
    return `pte-${++idCounter}`;
}

/**
 * Parse a partial date string into ISO format.
 * Handles: "Sep 2023", "2023", "Mar 2022", "Jul 2017", ISO dates.
 */
function parsePartialDate(dateStr: string): string {
    // Already ISO?
    if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;

    // "Sep 2023" → "2023-09-01"
    const monthYear = dateStr.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (monthYear) {
        const months: Record<string, string> = {
            Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
            Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
        };
        const mm = months[monthYear[1]] || '01';
        return `${monthYear[2]}-${mm}-01T00:00:00.000Z`;
    }

    // "2023" → "2023-01-01"
    const yearOnly = dateStr.match(/^(\d{4})$/);
    if (yearOnly) return `${yearOnly[1]}-01-01T00:00:00.000Z`;

    // Fallback
    return new Date(dateStr).toISOString();
}

/**
 * Extract the start date from an assignment-style date range.
 * e.g. "Aug 2023 — Present" → "Aug 2023"
 */
function extractStartDate(dateRange: string): string {
    const parts = dateRange.split(/\s*[—–-]\s*/);
    return parts[0].trim();
}

// ─── Timeline Builder ────────────────────────────────────────

/**
 * Synthesize ProfileEvent[] from a DemoUser's career and personal data.
 * Pure function — no side effects, fully testable.
 */
export function buildTimeline(user: DemoUser): ProfileEvent[] {
    const events: ProfileEvent[] = [];

    // ── Assignment History ────────────────────────────────
    if (user.assignmentHistory) {
        for (const entry of user.assignmentHistory) {
            const startStr = extractStartDate(entry.dates);
            events.push({
                id: nextId(),
                date: parsePartialDate(startStr),
                category: 'ASSIGNMENT',
                title: entry.current ? 'Reported to Current Command' : 'Assignment Reported',
                subtitle: `${entry.title} · ${entry.subtitle}`,
                detail: entry.type,
                iconName: 'Anchor',
                accentColor: '#2563EB',
            });
        }
    }

    // ── Dependents (from DOB — birth = record addition) ──
    if (user.dependentDetails) {
        for (const dep of user.dependentDetails) {
            const relationship = dep.relationship.charAt(0).toUpperCase() + dep.relationship.slice(1);
            events.push({
                id: nextId(),
                date: parsePartialDate(dep.dob),
                category: 'DEPENDENT',
                title: dep.relationship === 'spouse' ? 'Spouse Added to Record' : 'Dependent Added',
                subtitle: `${dep.name} (${relationship})`,
                detail: dep.efmpEnrolled ? 'EFMP Enrolled' : undefined,
                iconName: dep.relationship === 'child' ? 'Baby' : 'Heart',
                accentColor: '#EC4899',
            });
        }
    }

    // ── COOL Credentials (earned only) ───────────────────
    if (user.coolCredentials) {
        for (const cred of user.coolCredentials) {
            if (cred.status === 'Earned' && cred.date) {
                events.push({
                    id: nextId(),
                    date: parsePartialDate(cred.date),
                    category: 'CREDENTIAL',
                    title: 'Credential Earned',
                    subtitle: cred.name,
                    iconName: 'Award',
                    accentColor: '#059669',
                });
            }
        }
    }

    // ── Training Record ──────────────────────────────────
    if (user.trainingRecord) {
        for (const t of user.trainingRecord) {
            events.push({
                id: nextId(),
                date: parsePartialDate(t.date),
                category: 'TRAINING',
                title: `Completed ${t.type}`,
                subtitle: t.school,
                detail: t.location,
                iconName: 'GraduationCap',
                accentColor: '#D97706',
            });
        }
    }

    // ── NECs ─────────────────────────────────────────────
    if (user.necs) {
        for (const nec of user.necs) {
            events.push({
                id: nextId(),
                date: parsePartialDate(nec.earned),
                category: 'NEC',
                title: 'NEC Awarded',
                subtitle: `${nec.code} — ${nec.name}`,
                iconName: 'Hash',
                accentColor: '#7C3AED',
            });
        }
    }

    // ── Qualifications ───────────────────────────────────
    // Qualifications don't have dates in the current data model,
    // so we skip them for now (no fabricated dates).

    // ── Rank Advancement ─────────────────────────────────
    if (user.dateOfPaygrade) {
        events.push({
            id: nextId(),
            date: parsePartialDate(user.dateOfPaygrade),
            category: 'RANK',
            title: 'Advanced in Rate',
            subtitle: `${user.title ?? user.rank} (${user.rank})`,
            iconName: 'ChevronUp',
            accentColor: '#C9A227',
        });
    }

    // ── Housing ──────────────────────────────────────────
    // No date field for housing changes; we could correlate with current
    // assignment start date but that risks inaccuracy. Skip for now.

    // ── Marital Status ───────────────────────────────────
    // Infer from spouse dependent DOB (if spouse exists, married on/before that date)
    if (user.maritalStatus === 'married' && user.dependentDetails) {
        const spouse = user.dependentDetails.find((d) => d.relationship === 'spouse');
        if (spouse) {
            // Marriage predates spouse record; we use spouse DOB as proxy
            // (In reality an API would provide the actual marriage date)
        }
    }

    // ── Future Milestones ────────────────────────────────
    const now = new Date();

    if (user.prd) {
        const prdDate = new Date(user.prd);
        events.push({
            id: nextId(),
            date: user.prd,
            category: 'MILESTONE',
            title: 'Projected Rotation Date (PRD)',
            subtitle: prdDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            iconName: 'Flag',
            accentColor: '#F59E0B',
            isFuture: prdDate > now,
        });
    }

    if (user.seaos) {
        const seaosDate = new Date(user.seaos);
        events.push({
            id: nextId(),
            date: user.seaos,
            category: 'MILESTONE',
            title: 'Soft EAOS (SEAOS)',
            subtitle: seaosDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            iconName: 'Flag',
            accentColor: '#3B82F6',
            isFuture: seaosDate > now,
        });
    }

    if (user.eaos) {
        const eaosDate = new Date(user.eaos);
        events.push({
            id: nextId(),
            date: user.eaos,
            category: 'MILESTONE',
            title: 'End of Active Obligated Service (EAOS)',
            subtitle: eaosDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            iconName: 'Flag',
            accentColor: '#EF4444',
            isFuture: eaosDate > now,
        });
    }

    // ── Enlistment Date ──────────────────────────────────
    if (user.enlistmentDate) {
        events.push({
            id: nextId(),
            date: parsePartialDate(user.enlistmentDate),
            category: 'MILESTONE',
            title: 'Entered Active Duty',
            subtitle: `Service began`,
            iconName: 'Flag',
            accentColor: '#C9A227',
        });
    }

    // ── Sort: future first (ascending), then past (descending) ──
    events.sort((a, b) => {
        // Future events first, sorted ascending (nearest future first)
        if (a.isFuture && !b.isFuture) return -1;
        if (!a.isFuture && b.isFuture) return 1;
        if (a.isFuture && b.isFuture) {
            return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        // Past events: descending (most recent first)
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return events;
}

// ─── Store ───────────────────────────────────────────────────

interface ProfileTimelineState {
    events: ProfileEvent[];
    activeFilter: ProfileEventCategory | 'ALL';
    setFilter: (filter: ProfileEventCategory | 'ALL') => void;
    loadTimeline: (user: DemoUser) => void;
}

export const useProfileTimelineStore = create<ProfileTimelineState>((set) => ({
    events: [],
    activeFilter: 'ALL',

    setFilter: (filter) => set({ activeFilter: filter }),

    loadTimeline: (user) => {
        idCounter = 0; // Reset IDs for consistent rendering
        const events = buildTimeline(user);
        set({ events, activeFilter: 'ALL' });
    },
}));

// ─── Selector Hooks ──────────────────────────────────────────

/** Returns events filtered by the active category filter. */
export const useFilteredTimelineEvents = (): ProfileEvent[] => {
    const events = useProfileTimelineStore((s) => s.events);
    const filter = useProfileTimelineStore((s) => s.activeFilter);
    if (filter === 'ALL') return events;
    return events.filter((e) => e.category === filter);
};

/** Returns category counts for filter chip badges. */
export const useTimelineCategoryCounts = (): Record<ProfileEventCategory | 'ALL', number> => {
    const events = useProfileTimelineStore((s) => s.events);
    const counts: Record<string, number> = { ALL: events.length };
    for (const e of events) {
        counts[e.category] = (counts[e.category] || 0) + 1;
    }
    return counts as Record<ProfileEventCategory | 'ALL', number>;
};
