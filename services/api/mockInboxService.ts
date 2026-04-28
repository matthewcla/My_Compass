import type { ApiResult } from '@/types/api';
import type { InboxMessage } from '@/types/inbox';
import type { IInboxService } from './interfaces/IInboxService';
import { CorrespondenceService } from '@/services/correspondence';

export const mockInboxService: IInboxService = {
    fetchMessages: async (): Promise<ApiResult<InboxMessage[]>> => {
        const messages = await CorrespondenceService.fetchMessages();

        return {
            success: true,
            data: messages,
            meta: {
                requestId: `req-${Date.now()}`,
                timestamp: new Date().toISOString(),
            },
        };
    },
};
