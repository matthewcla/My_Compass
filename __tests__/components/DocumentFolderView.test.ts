
import { formatFileSize, groupDocuments } from '@/components/pcs/archive/archiveUtils';
import { PCSDocument } from '@/types/pcs';

describe('Document Folder View Logic', () => {
    describe('formatFileSize', () => {
        it('formats 0 bytes correctly', () => {
            expect(formatFileSize(0)).toBe('0 B');
        });

        it('formats KB correctly', () => {
            expect(formatFileSize(1024)).toBe('1 KB');
            expect(formatFileSize(1536)).toBe('1.5 KB');
        });

        it('formats MB correctly', () => {
            expect(formatFileSize(1048576)).toBe('1 MB');
            expect(formatFileSize(1572864)).toBe('1.5 MB');
        });

        it('formats GB correctly', () => {
            expect(formatFileSize(1073741824)).toBe('1 GB');
        });
    });

    describe('groupDocuments', () => {
        it('groups documents by category', () => {
            const docs: PCSDocument[] = [
                {
                    id: '1',
                    category: 'ORDERS',
                    filename: 'orders.pdf',
                    displayName: 'Orders',
                    localUri: '',
                    sizeBytes: 1000,
                    uploadedAt: new Date().toISOString(),
                    pcsOrderId: 'order-1',
                },
                {
                    id: '2',
                    category: 'RECEIPT',
                    filename: 'receipt.pdf',
                    displayName: 'Receipt',
                    localUri: '',
                    sizeBytes: 500,
                    uploadedAt: new Date().toISOString(),
                    pcsOrderId: 'order-1',
                },
                {
                    id: '3',
                    category: 'ORDERS',
                    filename: 'orders2.pdf',
                    displayName: 'Orders 2',
                    localUri: '',
                    sizeBytes: 2000,
                    uploadedAt: new Date().toISOString(),
                    pcsOrderId: 'order-1',
                },
            ];

            const groups = groupDocuments(docs);

            expect(groups.ORDERS).toHaveLength(2);
            expect(groups.RECEIPT).toHaveLength(1);
            expect(groups.W2).toBeUndefined();

            expect(groups.ORDERS?.[0].id).toBe('1');
            expect(groups.ORDERS?.[1].id).toBe('3');
        });

        it('handles empty document list', () => {
            const groups = groupDocuments([]);
            expect(Object.keys(groups)).toHaveLength(0);
        });
    });
});
