import {
    calculateConfidence,
    categorizeReceipt,
    extractAmounts,
    selectLikelyTotal,
} from '../receiptOCR';

describe('receiptOCR Utility', () => {
    describe('extractAmounts', () => {
        it('extracts simple amounts', () => {
            const text = 'Total: $12.34';
            expect(extractAmounts(text)).toEqual([12.34]);
        });

        it('extracts amounts without currency symbol', () => {
            const text = 'Total 12.34';
            expect(extractAmounts(text)).toEqual([12.34]);
        });

        it('extracts amounts with commas', () => {
            const text = 'Total: $1,234.56';
            expect(extractAmounts(text)).toEqual([1234.56]);
        });

        it('ignores invalid amounts', () => {
            const text = 'Phone: 555-1234';
            expect(extractAmounts(text)).toEqual([]);
        });

        it('handles multiple amounts', () => {
            const text = 'Item 1: $10.00\nItem 2: $20.00\nTotal: $30.00';
            expect(extractAmounts(text)).toEqual([10.0, 20.0, 30.0]);
        });
    });

    describe('selectLikelyTotal', () => {
        it('returns null for empty array', () => {
            expect(selectLikelyTotal([])).toBeNull();
        });

        it('returns max amount', () => {
            expect(selectLikelyTotal([10, 20, 30])).toBe(30);
        });

        it('ignores small amounts (potential noise)', () => {
            expect(selectLikelyTotal([0.5, 0.99])).toBeNull();
        });

        it('returns max amount > 1', () => {
            expect(selectLikelyTotal([0.5, 12.34])).toBe(12.34);
        });
    });

    describe('categorizeReceipt', () => {
        it('detects GAS', () => {
            expect(categorizeReceipt('Shell Station Fuel')).toBe('GAS');
            expect(categorizeReceipt('Pump 5')).toBe('GAS');
        });

        it('detects LODGING', () => {
            expect(categorizeReceipt('Marriott Hotel')).toBe('LODGING');
            expect(categorizeReceipt('Comfort Inn')).toBe('LODGING');
        });

        it('detects TOLLS', () => {
            expect(categorizeReceipt('Turnpike Toll')).toBe('TOLLS');
            expect(categorizeReceipt('SunPass')).toBe('TOLLS');
        });

        it('detects MEALS', () => {
            expect(categorizeReceipt('Burger King')).toBe('MEALS');
            expect(categorizeReceipt('Pizza Hut')).toBe('MEALS');
        });

        it('defaults to OTHER', () => {
            expect(categorizeReceipt('Target Store')).toBe('OTHER');
        });
    });

    describe('calculateConfidence', () => {
        it('returns low for 0 amounts', () => {
            expect(calculateConfidence([], 'text')).toBe('low');
        });

        it('returns high for 1 amount', () => {
            expect(calculateConfidence([10], 'text')).toBe('high');
        });

        it('returns medium for 2-5 amounts', () => {
            expect(calculateConfidence([10, 20], 'text')).toBe('medium');
            expect(calculateConfidence([10, 20, 30, 40, 50], 'text')).toBe('medium');
        });

        it('returns low for >5 amounts', () => {
            expect(calculateConfidence([1, 2, 3, 4, 5, 6], 'text')).toBe('low');
        });
    });
});
