import { getAllCommandEvents, getCareerEventsByUserId } from '@/constants/MockCareerEvents';
import type { ApiResult } from '@/types/api';
import type { CareerEvent } from '@/types/career';
import type { ICareerService } from './interfaces/ICareerService';
export const mockCareerService: ICareerService = {
    fetchEvents: async (scope: 'personal' | 'command' = 'personal'): Promise<ApiResult<CareerEvent[]>> => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        const { useDemoStore } = require('@/store/useDemoStore');
        const { useUserStore } = require('@/store/useUserStore');
        const demo = useDemoStore.getState();
        const userId = (demo.isDemoMode && demo.selectedUser)
            ? demo.selectedUser.id
            : (useUserStore.getState().user?.id ?? 'unknown');

        const events = scope === 'command' ? getAllCommandEvents() : getCareerEventsByUserId(userId);

        return {
            success: true,
            data: events,
            meta: {
                requestId: `req-${Date.now()}`,
                timestamp: new Date().toISOString(),
            },
        };
    },
};
