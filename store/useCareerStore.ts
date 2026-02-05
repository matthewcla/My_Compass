import { create } from 'zustand';
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

interface CareerState {
    events: CareerEvent[];
    isLoading: boolean;
    error: string | null;
    lastFetched: number | null;
    fetchEvents: (options?: { force?: boolean }) => Promise<void>;
}

export const useCareerStore = create<CareerState>((set, get) => ({
    events: [],
    isLoading: false,
    error: null,
    lastFetched: null,

    fetchEvents: async (options) => {
        const { events, lastFetched, isLoading } = get();
        const now = Date.now();
        const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

        // Cache Check
        if (!options?.force && events.length > 0 && lastFetched && (now - lastFetched < CACHE_DURATION)) {
            // Data is fresh enough
            return;
        }

        // If already loading, and not forcing, return
        if (isLoading && !options?.force) return;

        set({ isLoading: true, error: null });
        try {
            set({ events: MOCK_EVENTS, isLoading: false, lastFetched: Date.now() });
        } catch (error) {
            set({ isLoading: false, error: 'Failed to fetch career events' });
        }
    }
}));
