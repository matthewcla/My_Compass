import type { ApiResult } from '@/types/api';
import type { PCSOrder } from '@/types/pcs';

export interface IPCSService {
    fetchActiveOrder(userId: string): Promise<ApiResult<PCSOrder>>;
}
