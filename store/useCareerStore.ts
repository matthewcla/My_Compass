import { services } from '@/services/api/serviceRegistry';
import { storage } from '@/services/storage';
import { CareerEvent } from '@/types/career';
import { create } from 'zustand';

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
            // Load from storage first if we don't have events in memory
            if (get().events.length === 0) {
                const cached = await storage.getCareerEvents();
                if (cached.length > 0) {
                    set({ events: cached, isLoading: false });
                }
            }

            // Fetch fresh data via service
            const result = await services.career.fetchEvents();

            if (result.success) {
                const newEvents = result.data;
                set({ events: newEvents, isLoading: false, lastFetched: Date.now() });

                // Persist to storage
                await storage.saveCareerEvents(newEvents);
            } else {
                throw new Error(result.error.message);
            }
        } catch (error) {
            if (get().events.length === 0) {
                set({ isLoading: false, error: 'Failed to fetch career events' });
            } else {
                console.warn('Failed to fetch fresh career events', error);
                set({ isLoading: false });
            }
        }
    }
}));
