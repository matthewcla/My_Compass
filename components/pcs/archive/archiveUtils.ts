
import { DocumentCategory, PCSDocument } from '@/types/pcs';

export function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function groupDocuments(documents: PCSDocument[]) {
    const groups: Partial<Record<DocumentCategory, PCSDocument[]>> = {};

    documents.forEach((doc) => {
        if (!groups[doc.category]) {
            groups[doc.category] = [];
        }
        groups[doc.category]?.push(doc);
    });

    return groups;
}
