import { storage } from '@/services/storage';
import { DocumentCategory, PCSDocument } from '@/types/pcs';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const PCS_DOCUMENTS_DIR = `${FileSystem.documentDirectory}pcs_documents/`;

const generateUUID = (): string =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });

const ensureDirectory = async (dir: string): Promise<void> => {
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }
};

const getBasename = (value: string): string => {
  const normalized = value.split('?')[0];
  const chunks = normalized.split('/');
  return chunks[chunks.length - 1] || 'document.pdf';
};

const getExtension = (filename: string): string => {
  const match = filename.match(/\.([a-z0-9]+)$/i);
  return match ? `.${match[1].toLowerCase()}` : '.pdf';
};

const sanitizeFilename = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

const isRemoteUri = (uri: string): boolean => /^https?:\/\//i.test(uri);

const getShareMimeType = (filename: string): string | undefined => {
  const extension = getExtension(filename);
  if (extension === '.pdf') return 'application/pdf';
  if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
  if (extension === '.png') return 'image/png';
  return undefined;
};

/**
 * Detect PCS document category from a filename.
 */
export function detectDocumentCategory(filename: string): DocumentCategory {
  const normalized = getBasename(filename).toLowerCase();

  if (/^orders_.*\.pdf$/.test(normalized)) return 'ORDERS';
  if (/^dd_1351_2_.*\.pdf$/.test(normalized)) return 'TRAVEL_VOUCHER';
  if (/^w2_.*\.pdf$/.test(normalized)) return 'W2';
  if (/^receipt_.*\.(pdf|png|jpe?g)$/.test(normalized)) return 'RECEIPT';

  return 'OTHER';
}

/**
 * Persist a PCS document on local filesystem and save metadata in SQLite.
 */
export async function saveDocumentToPCS(
  pcsOrderId: string,
  category: DocumentCategory,
  fileUri: string,
  displayName: string
): Promise<PCSDocument> {
  await ensureDirectory(PCS_DOCUMENTS_DIR);
  const orderDir = `${PCS_DOCUMENTS_DIR}${pcsOrderId}/`;
  await ensureDirectory(orderDir);

  const sourceFilename = getBasename(fileUri);
  const extension = getExtension(sourceFilename);
  const safeBase = sanitizeFilename(displayName || sourceFilename || `document_${Date.now()}`);
  const storedFilename = `${safeBase}_${Date.now()}${extension}`;
  const localUri = `${orderDir}${storedFilename}`;

  if (isRemoteUri(fileUri)) {
    const result = await FileSystem.downloadAsync(fileUri, localUri);
    if (result.status !== 200) {
      throw new Error(`Failed to download PCS document: ${result.status}`);
    }
  } else if (fileUri !== localUri) {
    await FileSystem.copyAsync({ from: fileUri, to: localUri });
  }

  const fileInfo = await FileSystem.getInfoAsync(localUri);
  if (!fileInfo.exists) {
    throw new Error('Failed to save PCS document locally');
  }

  const doc: PCSDocument = {
    id: generateUUID(),
    pcsOrderId,
    category,
    filename: storedFilename,
    displayName: displayName || sourceFilename,
    localUri,
    originalUrl: isRemoteUri(fileUri) ? fileUri : undefined,
    sizeBytes: fileInfo.size || 0,
    uploadedAt: new Date().toISOString(),
  };

  try {
    await storage.savePCSDocument(doc);
    return doc;
  } catch (error) {
    await FileSystem.deleteAsync(localUri, { idempotent: true }).catch(() => undefined);
    throw error;
  }
}

/**
 * Delete local file + SQLite metadata for a PCS document.
 */
export async function deleteDocument(docId: string): Promise<void> {
  const existing = await storage.getPCSDocument(docId);
  if (existing?.localUri) {
    await FileSystem.deleteAsync(existing.localUri, { idempotent: true }).catch(() => undefined);
  }

  await storage.deletePCSDocument(docId);
}

/**
 * Open native share sheet for an already-saved PCS document.
 */
export async function shareDocument(doc: PCSDocument): Promise<void> {
  const shareAvailable = await Sharing.isAvailableAsync();
  if (!shareAvailable) {
    throw new Error('Sharing not available on this device');
  }

  const fileInfo = await FileSystem.getInfoAsync(doc.localUri);
  if (!fileInfo.exists) {
    throw new Error('Document file not found on this device');
  }

  const mimeType = getShareMimeType(doc.filename);
  await Sharing.shareAsync(doc.localUri, {
    mimeType,
    dialogTitle: `Share ${doc.displayName}`,
    UTI: mimeType === 'application/pdf' ? 'com.adobe.pdf' : undefined,
  });
}

