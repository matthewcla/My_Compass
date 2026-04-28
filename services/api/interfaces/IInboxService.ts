import type { ApiResult } from '@/types/api';
import type { InboxMessage } from '@/types/inbox';

export interface IInboxService {
    fetchMessages(): Promise<ApiResult<InboxMessage[]>>;
}
