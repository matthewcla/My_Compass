/**
 * Travel Claim Validation Tests
 *
 * Comprehensive test suite for validation utilities.
 */

import {
  getClaimWarnings,
  getValidationSummary,
  requiresReceipt,
  validateClaimStep,
  validateFuelExpenses,
  validateLodgingExpenses,
  validatePerDiem,
  validateTotalClaim,
  validateTripDetails,
  type Warning,
} from '@/utils/travelClaimValidation';
import type { Expense, TravelClaim } from '@/types/travelClaim';

describe('validateTripDetails', () => {
  it('should pass with valid trip details', () => {
    const data: Partial<TravelClaim> = {
      departureDate: '2024-03-01T08:00:00Z',
      returnDate: '2024-03-05T16:00:00Z',
      departureLocation: 'Norfolk, VA',
      destinationLocation: 'San Diego, CA',
      travelMode: 'pov',
      maltMiles: 2800,
      travelType: 'pcs',
      orderNumber: 'PCS-2024-001',
    };

    const result = validateTripDetails(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail if departure date is missing', () => {
    const data: Partial<TravelClaim> = {
      returnDate: '2024-03-05T16:00:00Z',
      departureLocation: 'Norfolk, VA',
      destinationLocation: 'San Diego, CA',
      travelMode: 'pov',
      maltMiles: 2800,
    };

    const result = validateTripDetails(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Departure date is required');
  });

  it('should fail if return date is before departure date', () => {
    const data: Partial<TravelClaim> = {
      departureDate: '2024-03-05T08:00:00Z',
      returnDate: '2024-03-01T16:00:00Z',
      departureLocation: 'Norfolk, VA',
      destinationLocation: 'San Diego, CA',
      travelMode: 'pov',
      maltMiles: 2800,
    };

    const result = validateTripDetails(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Return date must be after departure date');
  });

  it('should fail if POV mode has no mileage', () => {
    const data: Partial<TravelClaim> = {
      departureDate: '2024-03-01T08:00:00Z',
      returnDate: '2024-03-05T16:00:00Z',
      departureLocation: 'Norfolk, VA',
      destinationLocation: 'San Diego, CA',
      travelMode: 'pov',
      maltMiles: 0,
    };

    const result = validateTripDetails(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Mileage must be greater than 0 for POV travel mode');
  });

  it('should fail if PCS travel has no order number', () => {
    const data: Partial<TravelClaim> = {
      departureDate: '2024-03-01T08:00:00Z',
      returnDate: '2024-03-05T16:00:00Z',
      departureLocation: 'Norfolk, VA',
      destinationLocation: 'San Diego, CA',
      travelMode: 'pov',
      maltMiles: 2800,
      travelType: 'pcs',
    };

    const result = validateTripDetails(data);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'PCS order number is required for Permanent Change of Station travel'
    );
  });
});

describe('validatePerDiem', () => {
  it('should pass with valid per diem', () => {
    const result = validatePerDiem(5, 150);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should fail if days <= 0', () => {
    const result = validatePerDiem(0, 150);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Per diem days must be greater than 0');
  });

  it('should fail if deductions are negative', () => {
    const result = validatePerDiem(5, -50);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Meal deductions cannot be negative');
  });

  it('should fail if deductions exceed maximum', () => {
    const result = validatePerDiem(5, 3000);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('validateTotalClaim', () => {
  it('should pass with valid claim amount', () => {
    const claim: Partial<TravelClaim> = {
      totalClaimAmount: 3500,
    };

    const result = validateTotalClaim(claim);
    expect(result.isValid).toBe(true);
  });

  it('should warn if claim exceeds $5,000', () => {
    const claim: Partial<TravelClaim> = {
      totalClaimAmount: 6000,
    };

    const result = validateTotalClaim(claim);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toBeDefined();
    expect(result.warnings!.length).toBeGreaterThan(0);
  });

  it('should fail if claim is $0', () => {
    const claim: Partial<TravelClaim> = {
      totalClaimAmount: 0,
    };

    const result = validateTotalClaim(claim);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain(
      'Total claim amount cannot be $0. Please add expenses or entitlements.'
    );
  });

  it('should fail if claim exceeds $10,000', () => {
    const claim: Partial<TravelClaim> = {
      totalClaimAmount: 12000,
    };

    const result = validateTotalClaim(claim);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('getClaimWarnings', () => {
  it('should warn about missing receipts', () => {
    const claim: Partial<TravelClaim> = {
      expenses: [
        {
          id: '1',
          claimId: 'claim1',
          expenseType: 'lodging',
          amount: 150,
          date: '2024-03-01T00:00:00Z',
          receipts: [],
        } as Expense,
      ],
      totalClaimAmount: 150,
    };

    const warnings = getClaimWarnings(claim);
    const missingReceiptWarning = warnings.find((w) => w.type === 'missing_receipt');
    expect(missingReceiptWarning).toBeDefined();
    expect(missingReceiptWarning!.severity).toBe('warning');
  });

  it('should warn about high claim amount', () => {
    const claim: Partial<TravelClaim> = {
      totalClaimAmount: 6000,
      expenses: [],
    };

    const warnings = getClaimWarnings(claim);
    const highAmountWarning = warnings.find((w) => w.type === 'high_amount');
    expect(highAmountWarning).toBeDefined();
  });

  it('should error if TLE days exceed maximum', () => {
    const claim: Partial<TravelClaim> = {
      tleDays: 20,
      totalClaimAmount: 1000,
    };

    const warnings = getClaimWarnings(claim);
    const tleWarning = warnings.find((w) => w.type === 'tle_cap_exceeded');
    expect(tleWarning).toBeDefined();
    expect(tleWarning!.severity).toBe('error');
  });
});

describe('requiresReceipt', () => {
  it('should return true for amounts >= $75', () => {
    expect(requiresReceipt(75)).toBe(true);
    expect(requiresReceipt(100)).toBe(true);
    expect(requiresReceipt(1000)).toBe(true);
  });

  it('should return false for amounts < $75', () => {
    expect(requiresReceipt(74.99)).toBe(false);
    expect(requiresReceipt(50)).toBe(false);
    expect(requiresReceipt(0)).toBe(false);
  });
});

describe('getValidationSummary', () => {
  it('should return "Valid" for valid result with no warnings', () => {
    const result = { isValid: true, errors: [] };
    expect(getValidationSummary(result)).toBe('Valid');
  });

  it('should return warning count for valid result with warnings', () => {
    const result = { isValid: true, errors: [], warnings: ['Warning 1', 'Warning 2'] };
    expect(getValidationSummary(result)).toBe('Valid with 2 warnings');
  });

  it('should return error count for invalid result', () => {
    const result = { isValid: false, errors: ['Error 1', 'Error 2'] };
    expect(getValidationSummary(result)).toBe('2 errors found');
  });
});
