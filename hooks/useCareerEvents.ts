import { useCareerStore } from '@/store/useCareerStore';
import { CareerEvent } from '@/types/career';
import { useCallback, useEffect, useMemo } from 'react';

export interface Section<T> {
    title: string;
    data: T[];
}

export function groupEventsByMonth(events: CareerEvent[]): Section<CareerEvent>[] {
    const groups: Record<string, CareerEvent[]> = {};

    // Sort by date first (ISO string comparison is sufficient and much faster than new Date())
    const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

    sortedEvents.forEach(event => {
        const date = new Date(event.date);
        const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

        if (!groups[monthYear]) {
            groups[monthYear] = [];
        }
        groups[monthYear].push(event);
    });

    return Object.keys(groups).map(title => ({
        title,
        data: groups[title],
    }));
}

export function useCareerEvents() {
    const { events, isLoading, fetchEvents } = useCareerStore();

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const refresh = useCallback(async () => {
        await fetchEvents({ force: true });
    }, [fetchEvents]);

    const groupedEvents = useMemo(() => groupEventsByMonth(events), [events]);

    return {
        events,
        groupedEvents,
        loading: isLoading,
        refresh,
    };
}
