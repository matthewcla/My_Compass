import type { ApiResult } from '@/types/api';
import type { PCSOrder } from '@/types/pcs';
import type { IPCSService } from './interfaces/IPCSService';
import { getPCSOrderByUserId } from '@/constants/MockPCSData';

export const mockPCSService: IPCSService = {
    fetchActiveOrder: async (userId: string): Promise<ApiResult<PCSOrder>> => {
        await new Promise((resolve) => setTimeout(resolve, 400));

        // Get persona-specific PCS order based on user ID
        const pcsOrder = getPCSOrderByUserId(userId);

        return {
            success: true,
            data: pcsOrder,
            meta: {
                requestId: `req-${Date.now()}`,
                timestamp: new Date().toISOString(),
            },
        };
    },
};
