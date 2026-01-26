import * as storage from '@/services/storage';
import type { SyncStatus } from '@/types/schema';
import type { User } from '@/types/user';
import { create } from 'zustand';

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
 * Used when token validation succeeds
 */
const MOCK_USER: User = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    dodId: '1234567890',
    displayName: 'LCDR Matthew Clark',
    email: 'matthew.clark@navy.mil',
    rank: 'O-4',
    title: 'Operations Department Head',
    uic: 'N00124',
    preferences: {
        regions: ['Mid-Atlantic', 'Southeast'],
        dutyTypes: ['Sea', 'Shore']
    },
    lastSyncTimestamp: new Date().toISOString(),
    syncStatus: 'synced' as SyncStatus,
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
 */
export const useUserStore = create<UserStore>((set, get) => ({
    // Initial state
    user: null,
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

            // Try to load from local storage first to preserve preferences
            // In a real app, we'd sync with server, but for now local changes (prefs) rule over static mock
            // We use MOCK_USER.id as the stable ID for this session
            const storedUser = await storage.getUser(MOCK_USER.id);

            let finalUser: User;

            if (storedUser) {
                console.log('[UserStore] Found locally persisted user data');
                finalUser = {
                    ...storedUser,
                    lastSyncTimestamp: new Date().toISOString(),
                };
            } else {
                console.log('[UserStore] No local data, using default MOCK_USER');
                finalUser = {
                    ...MOCK_USER,
                    lastSyncTimestamp: new Date().toISOString(),
                };
                // Persist the default immediately
                await storage.saveUser(finalUser);
            }

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
