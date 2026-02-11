import type { ApiResult } from '@/types/api';
import type { User } from '@/types/user';

export interface IUserService {
    getCurrentUser(token: string): Promise<ApiResult<User>>;
    updateUser(userId: string, updates: Partial<User>): Promise<ApiResult<User>>;
}
