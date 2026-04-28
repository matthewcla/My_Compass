import type { ApiResult, PaginatedApiResult } from '@/types/api';
import type { Application, Billet } from '@/types/schema';

export interface IAssignmentService {
    fetchBillets(limit: number, offset: number): Promise<PaginatedApiResult<Billet>>;
    createApplication(billetId: string, userId: string): Promise<ApiResult<Application>>;
    withdrawApplication(appId: string): Promise<ApiResult<{ withdrawnAt: string }>>;
    submitSlate(appIds: string[]): Promise<ApiResult<{ submittedAt: string }>>;
}
