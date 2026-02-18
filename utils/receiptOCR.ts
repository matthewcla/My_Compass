import TextRecognition from 'react-native-mlkit-ocr';

export interface ReceiptOCRResult {
    rawText: string;              // Full recognized text
    extractedAmount: number | null; // Best-guess total amount
    confidence: 'high' | 'medium' | 'low';
    detectedCategory: 'GAS' | 'LODGING' | 'TOLLS' | 'MEALS' | 'OTHER';
}

export async function scanReceipt(imageUri: string): Promise<ReceiptOCRResult> {
    // 1. Run text recognition
    const result = await TextRecognition.detectFromUri(imageUri);
    const rawText = result.map(block => block.text).join('\n');

    // 2. Extract amount using regex patterns
    const amounts = extractAmounts(rawText);
    const extractedAmount = selectLikelyTotal(amounts);

    // 3. Detect category from keywords
    const detectedCategory = categorizeReceipt(rawText);

    // 4. Calculate confidence based on pattern matches
    const confidence = calculateConfidence(amounts, rawText);

    return { rawText, extractedAmount, confidence, detectedCategory };
}

export function extractAmounts(text: string): number[] {
    // Match currency patterns: $12.34, 12.34, $12,345.67
    const patterns = [
        /\$\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
        /(\d{1,3}(?:,\d{3})*\.\d{2})/g,
    ];
    const matches = new Set<number>();

    patterns.forEach(pattern => {
        const found = text.matchAll(pattern);
        for (const match of found) {
            // Remove commas and parse
            const amountStr = match[1].replace(/,/g, '');
            const amount = parseFloat(amountStr);
            if (!isNaN(amount) && amount > 0 && amount < 10000) {
                matches.add(amount);
            }
        }
    });

    return Array.from(matches);
}

export function selectLikelyTotal(amounts: number[]): number | null {
    if (amounts.length === 0) return null;

    // Heuristic: Total is usually the largest amount on receipt
    // Exclude amounts under $1 (likely unit prices or noise)
    const filtered = amounts.filter(a => a >= 1);
    return filtered.length > 0 ? Math.max(...filtered) : null;
}

export function categorizeReceipt(text: string): ReceiptOCRResult['detectedCategory'] {
    const upper = text.toUpperCase();

    if (upper.includes('SHELL') || upper.includes('EXXON') || upper.includes('CHEVRON')
        || upper.includes('GAS') || upper.includes('FUEL') || upper.includes('PUMP')) {
        return 'GAS';
    }
    if (upper.includes('HOTEL') || upper.includes('INN') || upper.includes('LODGE')
        || upper.includes('SUITES') || upper.includes('RESORT')) {
        return 'LODGING';
    }
    if (upper.includes('TOLL') || upper.includes('TURNPIKE') || upper.includes('E-ZPASS') || upper.includes('SUNPASS')) {
        return 'TOLLS';
    }
    if (upper.includes('RESTAURANT') || upper.includes('CAFE') || upper.includes('DINER')
        || upper.includes('BURGER') || upper.includes('PIZZA') || upper.includes('FOOD')) {
        return 'MEALS';
    }

    return 'OTHER';
}

export function calculateConfidence(amounts: number[], text: string): 'high' | 'medium' | 'low' {
    if (amounts.length === 0) return 'low';
    if (amounts.length === 1) return 'high';  // Only one amount found, likely correct
    if (amounts.length >= 2 && amounts.length <= 5) return 'medium';
    return 'low';  // Too many amounts, unclear which is total
}
