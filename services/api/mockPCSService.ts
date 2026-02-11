import type { ApiResult } from '@/types/api';
import type { PCSOrder } from '@/types/pcs';
import type { IPCSService } from './interfaces/IPCSService';
import { MOCK_PCS_ORDERS } from '@/constants/MockPCSData';

export const mockPCSService: IPCSService = {
    fetchActiveOrder: async (_userId: string): Promise<ApiResult<PCSOrder>> => {
        await new Promise((resolve) => setTimeout(resolve, 400));

        return {
            success: true,
            data: MOCK_PCS_ORDERS,
            meta: {
                requestId: `req-${Date.now()}`,
                timestamp: new Date().toISOString(),
            },
        };
    },
};
