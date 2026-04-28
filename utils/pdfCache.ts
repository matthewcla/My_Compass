import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

const CACHE_DIR = `${FileSystem.documentDirectory}cached_pdfs/`;
const METADATA_KEY = '@cached_pdfs_metadata';

export interface CachedPDF {
    filename: string;       // e.g., "orders_2024_001.pdf"
    localUri: string;       // File system path
    originalUrl: string;    // Source URL (for re-download if needed)
    cachedAt: string;       // ISO timestamp
    sizeBytes: number;
}

export async function initializePDFCache(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
}

export async function cachePDF(url: string, filename: string): Promise<CachedPDF> {
    await initializePDFCache();

    const localUri = `${CACHE_DIR}${filename}`;

    // Download PDF to cache
    const downloadResult = await FileSystem.downloadAsync(url, localUri);

    if (downloadResult.status !== 200) {
        throw new Error(`Failed to download PDF: ${downloadResult.status}`);
    }

    const fileInfo = await FileSystem.getInfoAsync(localUri);

    const cachedPDF: CachedPDF = {
        filename,
        localUri,
        originalUrl: url,
        cachedAt: new Date().toISOString(),
        sizeBytes: fileInfo.exists ? fileInfo.size : 0,
    };

    await savePDFMetadata(cachedPDF);
    return cachedPDF;
}

export async function getCachedPDF(filename: string): Promise<CachedPDF | null> {
    const metadata = await loadPDFMetadata();
    const pdf = metadata[filename];

    if (pdf) {
        const fileInfo = await FileSystem.getInfoAsync(pdf.localUri);
        if (!fileInfo.exists) {
            // Cleanup metadata if file is missing
            await deleteCachedPDF(filename);
            return null;
        }
        return pdf;
    }

    // Fallback if metadata is missing but file exists (less likely but robust)
    const localUri = `${CACHE_DIR}${filename}`;
    const fileInfo = await FileSystem.getInfoAsync(localUri);

    if (!fileInfo.exists) return null;

    return {
        filename,
        localUri,
        originalUrl: '', // Unknown without metadata
        cachedAt: new Date().toISOString(), // Approximate
        sizeBytes: fileInfo.size,
    };
}

export async function sharePDF(localUri: string): Promise<void> {
    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
        throw new Error('Sharing not available on this device');
    }

    await Sharing.shareAsync(localUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Share Orders',
        UTI: 'com.adobe.pdf',
    });
}

export async function deleteCachedPDF(filename: string): Promise<void> {
    const localUri = `${CACHE_DIR}${filename}`;
    // 1. Delete file
    await FileSystem.deleteAsync(localUri, { idempotent: true });

    // 2. Remove metadata
    const metadata = await loadPDFMetadata();
    delete metadata[filename];
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(metadata));
}

export async function listCachedPDFs(): Promise<CachedPDF[]> {
    await initializePDFCache();
    const metadata = await loadPDFMetadata();
    return Object.values(metadata);
}

// Metadata Persistence
export async function savePDFMetadata(pdf: CachedPDF): Promise<void> {
    const existing = await loadPDFMetadata();
    existing[pdf.filename] = pdf;
    await AsyncStorage.setItem(METADATA_KEY, JSON.stringify(existing));
}

export async function loadPDFMetadata(): Promise<Record<string, CachedPDF>> {
    try {
        const json = await AsyncStorage.getItem(METADATA_KEY);
        return json ? JSON.parse(json) : {};
    } catch (e) {
        console.warn('Failed to load PDF metadata', e);
        return {};
    }
}
