import type { ApiResult, PaginatedApiResult } from '@/types/api';
import type { Application, Billet } from '@/types/schema';
import type { IAssignmentService } from './interfaces/IAssignmentService';
import { MOCK_BILLETS } from '@/constants/MockBillets';
import { useDemoStore } from '@/store/useDemoStore';

const meta = () => ({
    requestId: `req-${Date.now()}`,
    timestamp: new Date().toISOString(),
});

/**
 * Returns billets filtered by the active persona's rating.
 * Falls back to full list if no demo user or rating is set.
 */
const getBilletsForActivePersona = (): Billet[] => {
    const demo = useDemoStore.getState();
    if (demo.isDemoMode && demo.selectedUser?.rating) {
        const rating = demo.selectedUser.rating;
        const filtered = MOCK_BILLETS.filter((b) => b.targetRating === rating);
        return filtered.length > 0 ? filtered : MOCK_BILLETS;
    }
    return MOCK_BILLETS;
};

export const mockAssignmentService: IAssignmentService = {
    fetchBillets: async (limit: number, offset: number): Promise<PaginatedApiResult<Billet>> => {
        await new Promise((resolve) => setTimeout(resolve, 400));

        const billets = getBilletsForActivePersona();
        const page = billets.slice(offset, offset + limit);
        const totalItems = billets.length;
        const totalPages = Math.ceil(totalItems / limit);
        const currentPage = Math.floor(offset / limit) + 1;

        return {
            success: true,
            data: page,
            pagination: {
                currentPage,
                totalPages,
                pageSize: limit,
                totalItems,
                hasNextPage: offset + limit < totalItems,
                hasPreviousPage: offset > 0,
            },
            meta: meta(),
        };
    },

    createApplication: async (billetId: string, userId: string): Promise<ApiResult<Application>> => {
        await new Promise((resolve) => setTimeout(resolve, 600));

        const now = new Date().toISOString();
        const app: Application = {
            id: `app-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            billetId,
            userId,
            status: 'draft',
            statusHistory: [{ status: 'draft', timestamp: now }],
            preferenceRank: 1,
            createdAt: now,
            updatedAt: now,
            lastSyncTimestamp: now,
            syncStatus: 'synced',
        };

        return { success: true, data: app, meta: meta() };
    },

    withdrawApplication: async (appId: string): Promise<ApiResult<{ withdrawnAt: string }>> => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return {
            success: true,
            data: { withdrawnAt: new Date().toISOString() },
            meta: meta(),
        };
    },

    submitSlate: async (appIds: string[]): Promise<ApiResult<{ submittedAt: string }>> => {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return {
            success: true,
            data: { submittedAt: new Date().toISOString() },
            meta: meta(),
        };
    },
};
