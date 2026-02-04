import { useState, useEffect, useCallback } from 'react';
import { CareerEvent } from '@/types/career';

// Mock Data Service
const MOCK_EVENTS: CareerEvent[] = [
    {
        eventId: 'evt_001',
        eventType: 'ADVANCEMENT_EXAM',
        title: 'March NWAE Cycle 263',
        date: '2024-03-14T07:30:00Z',
        location: 'Base Theater',
        attendanceStatus: 'PENDING',
        priority: 'CRITICAL',
    },
    {
        eventId: 'evt_002',
        eventType: 'STATUTORY_BOARD',
        title: 'FY-26 Chief Selection Board',
        date: '2024-05-20T08:00:00Z',
        location: 'NPC Millington',
        attendanceStatus: 'EXCUSED',
        priority: 'HIGH',
    },
    {
        eventId: 'evt_003',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'Command Quarters',
        date: '2024-03-01T07:00:00Z',
        location: 'Main Deck',
        attendanceStatus: 'PRESENT',
        priority: 'CRITICAL',
        qr_token: 'valid_token_123',
    },
    {
        eventId: 'evt_004',
        eventType: 'ADMIN_BOARD',
        title: 'JSOQ Board',
        date: '2024-04-15T09:00:00Z',
        location: 'Conference Room B',
        attendanceStatus: 'PENDING',
        priority: 'STANDARD',
    },
    {
        eventId: 'evt_005',
        eventType: 'ATTENDANCE_MUSTER',
        title: 'PRT Cycle 2024-1',
        date: '2024-05-10T06:00:00Z',
        location: 'Base Gym',
        attendanceStatus: 'PENDING',
        priority: 'HIGH',
    },
];

export interface Section<T> {
    title: string;
    data: T[];
}

export function groupEventsByMonth(events: CareerEvent[]): Section<CareerEvent>[] {
    const groups: Record<string, CareerEvent[]> = {};

    // Sort by date first
    const sortedEvents = [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
    const [events, setEvents] = useState<CareerEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        setEvents(MOCK_EVENTS);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const groupedEvents = groupEventsByMonth(events);

    return {
        events,
        groupedEvents,
        loading,
        refresh: fetchEvents,
    };
}
