import { getCareerEventsByUserId } from '@/constants/MockCareerEvents';
import type { ApiResult } from '@/types/api';
import type { CareerEvent } from '@/types/career';
import type { ICareerService } from './interfaces/ICareerService';
export const mockCareerService: ICareerService = {
    fetchEvents: async (): Promise<ApiResult<CareerEvent[]>> => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { useDemoStore } = require('@/store/useDemoStore');
        const { useUserStore } = require('@/store/useUserStore');
        const demo = useDemoStore.getState();
        const userId = (demo.isDemoMode && demo.selectedUser)
            ? demo.selectedUser.id
            : (useUserStore.getState().user?.id ?? 'unknown');

        return {
            success: true,
            data: getCareerEventsByUserId(userId),
            meta: {
                requestId: `req-${Date.now()}`,
                timestamp: new Date().toISOString(),
            },
        };
    },
};
