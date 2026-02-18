import type { ApiResult, CreateLeaveRequestPayload, SubmitLeaveRequestResponse } from '@/types/api';
import type { LeaveBalance } from '@/types/schema';

export interface ILeaveService {
    fetchBalance(userId: string): Promise<ApiResult<LeaveBalance>>;
    submitRequest(payload: CreateLeaveRequestPayload): Promise<ApiResult<SubmitLeaveRequestResponse['data']>>;
    cancelRequest(requestId: string): Promise<ApiResult<{ canceledAt: string }>>;
}
