import type { ApiResult } from '@/types/api';
import type { User } from '@/types/user';
import type { SyncStatus } from '@/types/schema';
import type { IUserService } from './interfaces/IUserService';
import mockProfileData from '@/data/mockProfile.json';

const MOCK_USER: User = {
    ...mockProfileData,
    rank: 'E-6',
    rating: 'IT',
    syncStatus: mockProfileData.syncStatus as SyncStatus,
};

const meta = () => ({
    requestId: `req-${Date.now()}`,
    timestamp: new Date().toISOString(),
});

export const mockUserService: IUserService = {
    getCurrentUser: async (token: string): Promise<ApiResult<User>> => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        if (!token || token === 'invalid') {
            return {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'Invalid or expired token',
                    retryable: false,
                },
                meta: meta(),
            };
        }

        return {
            success: true,
            data: {
                ...MOCK_USER,
                lastSyncTimestamp: new Date().toISOString(),
            },
            meta: meta(),
        };
    },

    updateUser: async (userId: string, updates: Partial<User>): Promise<ApiResult<User>> => {
        await new Promise((resolve) => setTimeout(resolve, 400));

        return {
            success: true,
            data: {
                ...MOCK_USER,
                ...updates,
                lastSyncTimestamp: new Date().toISOString(),
            },
            meta: meta(),
        };
    },
};
