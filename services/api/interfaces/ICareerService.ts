import type { ApiResult } from '@/types/api';
import type { CareerEvent } from '@/types/career';

export interface ICareerService {
    fetchEvents(): Promise<ApiResult<CareerEvent[]>>;
}
