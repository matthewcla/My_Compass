/**
 * Profile Timeline Types
 *
 * Type definitions for the Profile Timeline feature — a chronological
 * audit trail of all changes to a sailor's digital profile.
 */

// ─── Event Categories ────────────────────────────────────────
export type ProfileEventCategory =
    | 'ASSIGNMENT'
    | 'DEPENDENT'
    | 'CREDENTIAL'
    | 'TRAINING'
    | 'QUALIFICATION'
    | 'NEC'
    | 'PCS'
    | 'RANK'
    | 'HOUSING'
    | 'MARITAL'
    | 'CONTACT'
    | 'MILESTONE';

// ─── Profile Event ───────────────────────────────────────────
export interface ProfileEvent {
    /** Unique identifier */
    id: string;
    /** ISO 8601 date when the change occurred */
    date: string;
    /** Event classification */
    category: ProfileEventCategory;
    /** Short headline — e.g. "Dependent Added" */
    title: string;
    /** Detail line — e.g. "Ethan Wilson (child)" */
    subtitle: string;
    /** Optional extra context */
    detail?: string;
    /** Lucide icon name for rendering */
    iconName: string;
    /** Hex color for the timeline dot and accent */
    accentColor: string;
    /** True for PRD, EAOS, SEAOS — renders with dashed/muted style */
    isFuture?: boolean;
}

// ─── Category Display Config ─────────────────────────────────
export interface CategoryConfig {
    label: string;
    iconName: string;
    accentColor: string;
}

export const CATEGORY_CONFIG: Record<ProfileEventCategory, CategoryConfig> = {
    ASSIGNMENT: { label: 'Assignments', iconName: 'Anchor', accentColor: '#2563EB' },
    DEPENDENT: { label: 'Dependents', iconName: 'Baby', accentColor: '#EC4899' },
    CREDENTIAL: { label: 'Credentials', iconName: 'Award', accentColor: '#059669' },
    TRAINING: { label: 'Training', iconName: 'GraduationCap', accentColor: '#D97706' },
    QUALIFICATION: { label: 'Qualifications', iconName: 'Shield', accentColor: '#059669' },
    NEC: { label: 'NECs', iconName: 'Hash', accentColor: '#7C3AED' },
    PCS: { label: 'PCS Moves', iconName: 'Truck', accentColor: '#0891B2' },
    RANK: { label: 'Advancement', iconName: 'ChevronUp', accentColor: '#C9A227' },
    HOUSING: { label: 'Housing', iconName: 'Home', accentColor: '#92400E' },
    MARITAL: { label: 'Marital Status', iconName: 'Heart', accentColor: '#EC4899' },
    CONTACT: { label: 'Contacts', iconName: 'Phone', accentColor: '#64748B' },
    MILESTONE: { label: 'Milestones', iconName: 'Flag', accentColor: '#EF4444' },
};
