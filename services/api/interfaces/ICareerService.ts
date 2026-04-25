import type { ApiResult } from '@/types/api';
import type { CareerEvent } from '@/types/career';

export interface ICareerService {
    fetchEvents(scope?: 'personal' | 'command'): Promise<ApiResult<CareerEvent[]>>;
}
