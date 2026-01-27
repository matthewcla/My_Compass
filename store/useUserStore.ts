import { storage } from '@/services/storage';
import type { SyncStatus } from '@/types/schema';
import type { User } from '@/types/user';
import { create } from 'zustand';

// Mock profile for offline-first development
import mockProfileData from '@/data/mockProfile.json';

/**
 * User store state interface
 */
interface UserState {
    /** Current authenticated user */
    user: User | null;
    /** Whether user data is being loaded */
    isHydrating: boolean;
    /** Error message if hydration failed */
    hydrationError: string | null;
}

/**
 * User store actions interface
 */
interface UserActions {
    /**
     * Hydrate user data from a JWT token.
     * In a real implementation, this would decode the JWT and/or
     * fetch user profile from the API.
     * 
     * @param token - JWT access token from Okta
     */
    hydrateUserFromToken: (token: string) => Promise<void>;

    /**
     * Clear user data on sign out
     */
    clearUser: () => void;

    /**
     * Update user data
     */
    updateUser: (updates: Partial<User>) => void;

    /**
     * Update user preferences
     */
    updatePreferences: (prefs: User['preferences']) => void;
}

type UserStore = UserState & UserActions;

/**
 * Mock user data matching UserSchema from types/user.ts
 * Loaded from data/mockProfile.json for offline-first development
 */
const MOCK_USER: User = {
    ...mockProfileData,
    rank: 'E-6',
    rating: 'IT',
    syncStatus: mockProfileData.syncStatus as SyncStatus,
};

/**
 * Validate token format (mock implementation)
 * In production, this would verify JWT signature and expiration
 */
function isValidToken(token: string): boolean {
    // Mock validation: token must be non-empty and not "invalid"
    return token.length > 0 && token !== 'invalid';
}

/**
 * User Store
 * 
 * Manages authenticated user state and provides methods for
 * hydrating user data from Okta tokens.
 * 
 * OFFLINE DEV: Initialized with MOCK_USER for offline-first development.
 * Remove this when backend is online.
 */
export const useUserStore = create<UserStore>((set, get) => ({
    // Initial state - MOCK_USER for offline development
    user: MOCK_USER,
    isHydrating: false,
    hydrationError: null,

    hydrateUserFromToken: async (token: string): Promise<void> => {
        set({ isHydrating: true, hydrationError: null });

        try {
            // Simulate network delay for token validation
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Validate token
            if (!isValidToken(token)) {
                throw new Error('Invalid or expired token');
            }

            // In production: decode JWT claims and/or fetch user profile
            // For mock: return hardcoded user data matching UserSchema
            console.log('[UserStore] Hydrating user from token...');

            // OFFLINE DEV: Always use MOCK_USER from mockProfile.json
            // This ensures fresh mock data is used, ignoring stale SQLite cache
            const finalUser: User = {
                ...MOCK_USER,
                lastSyncTimestamp: new Date().toISOString(),
            };

            // Persist to storage (overwrites any stale data)
            await storage.saveUser(finalUser);

            set({
                user: finalUser,
                isHydrating: false,
                hydrationError: null,
            });

            console.log(`[UserStore] User hydrated successfully (ID: ...${finalUser.id.slice(-4)})`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to hydrate user';
            console.error('[UserStore] Hydration failed:', errorMessage);

            set({
                user: null,
                isHydrating: false,
                hydrationError: errorMessage,
            });

            throw error;
        }
    },

    clearUser: () => {
        console.log('[UserStore] Clearing user data');
        set({
            user: null,
            isHydrating: false,
            hydrationError: null,
        });
    },

    updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) {
            console.warn('[UserStore] Cannot update user: no user authenticated');
            return;
        }

        const updatedUser = {
            ...currentUser,
            ...updates,
            lastSyncTimestamp: new Date().toISOString(),
        };

        set({ user: updatedUser });

        // Persist updates
        storage.saveUser(updatedUser).catch(err =>
            console.error('[UserStore] Failed to persist user update:', err)
        );
    },

    updatePreferences: (prefs) => {
        const currentUser = get().user;
        if (!currentUser) {
            console.warn('[UserStore] Cannot update preferences: no user authenticated');
            return;
        }

        const updatedUser = {
            ...currentUser,
            preferences: {
                ...currentUser.preferences,
                ...prefs
            },
            lastSyncTimestamp: new Date().toISOString(),
        };

        set({ user: updatedUser });

        // Persist updates
        storage.saveUser(updatedUser).catch(err =>
            console.error('[UserStore] Failed to persist preferences:', err)
        );
    }
}));

/**
 * Selector hooks for common user data access patterns
 */
export const useUser = () => useUserStore((state) => state.user);
export const useUserId = () => useUserStore((state) => state.user?.id);
export const useUserDisplayName = () => useUserStore((state) => state.user?.displayName);
export const useUserRank = () => useUserStore((state) => state.user?.rank);
export const useIsHydrating = () => useUserStore((state) => state.isHydrating);
