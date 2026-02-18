export type SpotlightScope = 'all' | 'navigation' | 'actions' | 'settings' | 'calendar' | 'inbox';
export type SpotlightOpenSource = 'primary' | 'shortcut';

export type SpotlightKind =
    | 'navigation'
    | 'action'
    | 'setting'
    | 'calendar_event'
    | 'inbox_message';

export type SpotlightSection = 'Navigation' | 'Actions' | 'Settings' | 'Calendar' | 'Inbox';

export interface SpotlightItem {
    id: string;
    kind: SpotlightKind;
    section: SpotlightSection;
    title: string;
    subtitle?: string;
    keywords?: string[];
    updatedAt?: number;
    run: () => void | Promise<void>;
}

export interface RankedSpotlightItem extends SpotlightItem {
    score: number;
}
