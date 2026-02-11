import type { ApiResult } from '@/types/api';
import type { CareerEvent } from '@/types/career';
import type { ICareerService } from './interfaces/ICareerService';
import { MOCK_CAREER_EVENTS } from '@/constants/MockCareerEvents';

export const mockCareerService: ICareerService = {
    fetchEvents: async (): Promise<ApiResult<CareerEvent[]>> => {
        await new Promise((resolve) => setTimeout(resolve, 300));

        return {
            success: true,
            data: MOCK_CAREER_EVENTS,
            meta: {
                requestId: `req-${Date.now()}`,
                timestamp: new Date().toISOString(),
            },
        };
    },
};
