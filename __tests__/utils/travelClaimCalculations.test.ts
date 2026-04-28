/**
 * @file travelClaimCalculations.test.ts
 * @description Unit tests for PCS Travel Claim Calculation Engine
 */

import {
    Expense,
    PerDiemDay,
    TravelClaim
} from '../../types/travelClaim';
import {
    calculateTravelClaim,
    calculateTravelDays,
    getPerDiemRateByZip,
    getTLERateByZip,
    MALT_RATE,
    validateExpenseAgainstCaps
} from '../../utils/travelClaimCalculations';

// Mock Data
const mockClaim: Partial<TravelClaim> = {
    maltMiles: 100,
    expenses: [],
    perDiemDays: [],
    advanceAmount: 0,
};

describe('Travel Claim Calculations', () => {

    describe('calculateTravelClaim', () => {
        it('should calculate MALT correctly', () => {
            const claim = { ...mockClaim, maltMiles: 500 };
            const result = calculateTravelClaim(claim);
            expect(result.maltAmount).toBe(500 * MALT_RATE); // 105
        });

        it('should calculate TLE correctly', () => {
            // Mock TLE expenses: 2 nights @ $150
            const tleExpense: Expense = {
                id: '1',
                claimId: 'claim-1',
                expenseType: 'lodging',
                amount: 300,
                date: '2023-01-01',
                lodgingDetails: {
                    nightlyRate: 150,
                    numberOfNights: 2,
                    localityMaxRate: 150,
                    isTLE: true,
                },
                receipts: [],
            };

            const claim = { ...mockClaim, expenses: [tleExpense] };
            const result = calculateTravelClaim(claim);
            expect(result.tleAmount).toBe(300);
        });

        it('should calculate Per Diem correctly', () => {
            // Mock Per Diem: 2 days @ $59 M&IE
            const day1: PerDiemDay = {
                date: '2023-01-01',
                locality: 'Standard',
                localityRate: 155,
                lodgingRate: 96,
                mieRate: 59,
                mealsRate: 'standard',
                actualMieAmount: 59,
                isProrated: false,
                breakfastProvided: false,
                lunchProvided: false,
                dinnerProvided: false,
            };

            const claim = { ...mockClaim, perDiemDays: [day1, day1] };
            const result = calculateTravelClaim(claim);
            expect(result.perDiemAmount).toBe(118);
        });

        it('should sum misc expenses', () => {
            const tollExpense: Expense = {
                id: '2',
                claimId: 'claim-1',
                expenseType: 'toll',
                amount: 20,
                date: '2023-01-01',
                receipts: [],
                tollDetails: {
                    tollAmount: 20
                }
            };

            const claim = { ...mockClaim, expenses: [tollExpense] };
            const result = calculateTravelClaim(claim);
            expect(result.miscExpensesAmount).toBe(20);
        });

        it('should calculate total entitlements and net payable', () => {
            // MALT: 100 miles * 0.21 = 21
            // TLE: 0
            // Per Diem: 0
            // Misc: 20
            // Total: 41
            // Advance: 10
            // Net: 31

            const claim: Partial<TravelClaim> = {
                maltMiles: 100,
                expenses: [{
                    id: '2',
                    claimId: 'claim-1',
                    expenseType: 'toll',
                    amount: 20,
                    date: '2023-01-01',
                    receipts: [],
                    tollDetails: { tollAmount: 20 }
                }],
                perDiemDays: [],
                advanceAmount: 10
            };

            const result = calculateTravelClaim(claim);
            expect(result.totalEntitlements).toBe(41);
            expect(result.netPayable).toBe(31);
        });
    });

    describe('Lookup Helpers', () => {
        it('should return default TLE rate for unknown zip', () => {
            expect(getTLERateByZip('00000')).toBe(150);
        });

        it('should return specific TLE rate for known zip', () => {
            expect(getTLERateByZip('92136')).toBe(210); // San Diego
        });

        it('should return default Per Diem rate for unknown zip', () => {
            const rate = getPerDiemRateByZip('00000');
            expect(rate.lodging).toBe(107);
            expect(rate.mie).toBe(59);
        });
    });

    describe('calculateTravelDays', () => {
        it('should calculate days correctly inclusive', () => {
            expect(calculateTravelDays('2023-01-01', '2023-01-05')).toBe(5);
        });

        it('should handle single day', () => {
            expect(calculateTravelDays('2023-01-01', '2023-01-01')).toBe(1);
        });
    });

    describe('validateExpenseAgainstCaps', () => {
        it('should validate lodging within cap', () => {
            const expense: Expense = {
                id: '1', claimId: '1', expenseType: 'lodging', amount: 100, date: '', receipts: [],
                lodgingDetails: { nightlyRate: 100, numberOfNights: 1, localityMaxRate: 150, isTLE: false }
            };
            const caps = { lodgingCap: 150, mieCap: 59 };
            const result = validateExpenseAgainstCaps(expense, caps);
            expect(result.isValid).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });

        it('should warn if lodging exceeds cap', () => {
            const expense: Expense = {
                id: '1', claimId: '1', expenseType: 'lodging', amount: 200, date: '', receipts: [],
                lodgingDetails: { nightlyRate: 200, numberOfNights: 1, localityMaxRate: 150, isTLE: false }
            };
            const caps = { lodgingCap: 150, mieCap: 59 };
            const result = validateExpenseAgainstCaps(expense, caps);
            // Note: Logic in util is currently returning isValid=false for this case.
            expect(result.isValid).toBe(false);
            expect(result.warnings[0]).toContain('exceeds locality cap');
        });
    });
});
