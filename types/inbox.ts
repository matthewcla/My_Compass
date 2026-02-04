import { z } from 'zod';

export const InboxMessageTypeSchema = z.enum(['NAVADMIN', 'ALNAV', 'STATUS_REPORT', 'GENERAL_ADMIN']);
export type InboxMessageType = z.infer<typeof InboxMessageTypeSchema>;

export const InboxMessageSchema = z.object({
    id: z.string().uuid(),
    type: InboxMessageTypeSchema,
    subject: z.string(),
    body: z.string(),
    timestamp: z.string().datetime(),
    isRead: z.boolean().default(false),
    isPinned: z.boolean().default(false),
    metadata: z.record(z.any()).optional(), // JSON object for deep linking
});

export type InboxMessage = z.infer<typeof InboxMessageSchema>;
