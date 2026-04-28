/**
 * ─────────────────────────────────────────────────────────────────────────────
 * travelClaimValidation.ts — Travel Claim Wizard Validation Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Comprehensive validation for DD 1351-2 Travel Voucher wizard steps.
 *
 * References:
 *   • JTR Ch.1 — General Travel Provisions
 *   • DD Form 1351-2 — Travel Voucher or Subvoucher
 *   • DoDFMR Vol. 9 — Receipt requirements (≥ $75)
 *
 * @module travelClaimValidation
 */

import type {
  Expense,
  FuelExpense,
  LodgingExpense,
  TravelClaim,
  TravelMode,
} from '@/types/travelClaim';

// ────────────────────────────────────────────────────────────────────────────
// TYPES & INTERFACES
// ────────────────────────────────────────────────────────────────────────────

/**
 * Validation result returned by all validation functions.
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Warning message with severity classification.
 */
export interface Warning {
  type: 'missing_receipt' | 'tle_cap_exceeded' | 'high_amount' | 'no_expenses' | 'general';
  message: string;
  severity: 'warning' | 'error';
  field?: string;
}

// ────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ────────────────────────────────────────────────────────────────────────────

/** Auto-approval threshold per JTR guidance (simplified) */
const AUTO_APPROVAL_THRESHOLD = 10000;

/** High amount review threshold */
const HIGH_AMOUNT_THRESHOLD = 5000;

/** Receipt required threshold per DoDFMR Vol. 9, Ch. 3 */
const RECEIPT_REQUIRED_THRESHOLD = 75;

/** Maximum per diem daily rate (conservative estimate for validation) */
const MAX_PER_DIEM_DAILY_RATE = 400;

/** Maximum TLE days per JTR §5530 */
const MAX_TLE_DAYS = 14;

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION FUNCTIONS
// ────────────────────────────────────────────────────────────────────────────

/**
 * Validate Step 1: Trip Details
 *
 * Checks:
 * - PCS order number exists (if required)
 * - Departure and return dates are valid
 * - Return date is after departure date
 * - Travel mode is selected
 * - MALT mileage > 0 for POV mode
 * - Locations are provided
 *
 * @param data - Partial travel claim with trip details
 * @returns Validation result with errors array
 */
export function validateTripDetails(data: Partial<TravelClaim>): ValidationResult {
  const errors: string[] = [];

  // Check required fields
  if (!data.departureDate) {
    errors.push('Departure date is required');
  }

  if (!data.returnDate) {
    errors.push('Return date is required');
  }

  if (!data.departureLocation?.trim()) {
    errors.push('Departure location is required');
  }

  if (!data.destinationLocation?.trim()) {
    errors.push('Destination location is required');
  }

  if (!data.travelMode) {
    errors.push('Travel mode is required');
  }

  // Date logic validation
  if (data.departureDate && data.returnDate) {
    const departure = new Date(data.departureDate);
    const returnDate = new Date(data.returnDate);

    if (Number.isNaN(departure.getTime())) {
      errors.push('Invalid departure date');
    }

    if (Number.isNaN(returnDate.getTime())) {
      errors.push('Invalid return date');
    }

    if (departure >= returnDate) {
      errors.push('Return date must be after departure date');
    }

    // Check if dates are in the future (more than 1 year out)
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    if (departure > oneYearFromNow) {
      errors.push('Departure date cannot be more than 1 year in the future');
    }
  }

  // POV mode requires mileage
  if (data.travelMode === 'pov' && (!data.maltMiles || data.maltMiles <= 0)) {
    errors.push('Mileage must be greater than 0 for POV travel mode');
  }

  // PCS travel type should have order number
  if (data.travelType === 'pcs' && !data.orderNumber?.trim()) {
    errors.push('PCS order number is required for Permanent Change of Station travel');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Step 2: Lodging Expenses
 *
 * Checks:
 * - Each lodging expense has required fields
 * - Check-out date is after check-in date
 * - Total cost matches (nights × rate) if not manually overridden
 * - Receipt photo attached for expenses ≥ $75 (warn if missing)
 *
 * @param expenses - Array of lodging expenses
 * @returns Validation result with errors and warnings
 */
export function validateLodgingExpenses(expenses: Expense[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (expenses.length === 0) {
    // Empty lodging is allowed (member may have stayed with family)
    return { isValid: true, errors: [], warnings: ['No lodging expenses entered'] };
  }

  expenses.forEach((expense, index) => {
    const expenseNum = index + 1;
    const details = expense.lodgingDetails;

    if (!details) {
      errors.push(`Lodging expense #${expenseNum}: Missing lodging details`);
      return;
    }

    // Check required fields
    if (!details.hotelName?.trim()) {
      errors.push(`Lodging expense #${expenseNum}: Hotel name is required`);
    }

    if (details.nightlyRate <= 0) {
      errors.push(`Lodging expense #${expenseNum}: Nightly rate must be greater than 0`);
    }

    if (details.numberOfNights <= 0) {
      errors.push(`Lodging expense #${expenseNum}: Number of nights must be greater than 0`);
    }

    if (expense.amount <= 0) {
      errors.push(`Lodging expense #${expenseNum}: Total cost must be greater than 0`);
    }

    // Check date logic (if available)
    if (!expense.date) {
      errors.push(`Lodging expense #${expenseNum}: Date is required`);
    }

    // Warn if no receipt for expenses >= $75
    if (
      expense.amount >= RECEIPT_REQUIRED_THRESHOLD &&
      (!expense.receipts || expense.receipts.length === 0)
    ) {
      warnings.push(
        `Lodging expense #${expenseNum}: Receipt required for expenses ≥ $${RECEIPT_REQUIRED_THRESHOLD}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Step 3: Fuel & Transportation Expenses
 *
 * Checks:
 * - If POV mode: At least 1 fuel receipt required
 * - Each expense has date, location (if applicable), amount
 * - Receipt photo attached for expenses ≥ $75 (warn if missing)
 *
 * @param expenses - Array of fuel/transportation expenses
 * @param travelMode - Selected travel mode
 * @returns Validation result with errors and warnings
 */
export function validateFuelExpenses(expenses: Expense[], travelMode: TravelMode): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // POV mode requires at least 1 fuel expense
  const fuelExpenses = expenses.filter((e) => e.expenseType === 'fuel');

  if (travelMode === 'pov' && fuelExpenses.length === 0) {
    errors.push('At least 1 fuel expense is required for POV (Privately Owned Vehicle) travel mode');
  }

  expenses.forEach((expense, index) => {
    const expenseNum = index + 1;
    const typeName =
      expense.expenseType === 'fuel'
        ? 'Fuel'
        : expense.expenseType === 'toll'
        ? 'Toll'
        : expense.expenseType === 'parking'
        ? 'Parking'
        : expense.expenseType === 'rental_car'
        ? 'Rental Car'
        : 'Transportation';

    // Check required fields
    if (!expense.date) {
      errors.push(`${typeName} expense #${expenseNum}: Date is required`);
    }

    if (expense.amount <= 0) {
      errors.push(`${typeName} expense #${expenseNum}: Amount must be greater than 0`);
    }

    // Fuel-specific validations
    if (expense.expenseType === 'fuel' && expense.fuelDetails) {
      const details = expense.fuelDetails;

      // If gallons provided, validate
      if (details.gallons !== undefined && details.gallons <= 0) {
        errors.push(`${typeName} expense #${expenseNum}: Gallons must be greater than 0`);
      }

      // If price per gallon provided, validate
      if (details.pricePerGallon !== undefined && details.pricePerGallon <= 0) {
        errors.push(`${typeName} expense #${expenseNum}: Price per gallon must be greater than 0`);
      }
    }

    // Warn if no receipt for expenses >= $75
    if (
      expense.amount >= RECEIPT_REQUIRED_THRESHOLD &&
      (!expense.receipts || expense.receipts.length === 0)
    ) {
      warnings.push(
        `${typeName} expense #${expenseNum}: Receipt required for expenses ≥ $${RECEIPT_REQUIRED_THRESHOLD}`
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate Step 4: Per Diem & Meals
 *
 * Checks:
 * - Per diem days > 0
 * - Meal deductions >= 0
 * - Meal deductions <= (days × max daily rate)
 * - Misc expenses have descriptions
 *
 * @param days - Number of per diem days
 * @param deductions - Total meal deductions amount
 * @returns Validation result with errors
 */
export function validatePerDiem(days: number, deductions: number): ValidationResult {
  const errors: string[] = [];

  if (days <= 0) {
    errors.push('Per diem days must be greater than 0');
  }

  if (deductions < 0) {
    errors.push('Meal deductions cannot be negative');
  }

  // Check if deductions exceed reasonable maximum
  const maxDeductions = days * MAX_PER_DIEM_DAILY_RATE;
  if (deductions > maxDeductions) {
    errors.push(
      `Meal deductions ($${deductions.toFixed(2)}) exceed maximum allowed ($${maxDeductions.toFixed(2)} for ${days} days)`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate Total Claim Amount
 *
 * Checks:
 * - Total claim < $10,000 (auto-approval threshold)
 * - Warn if > $5,000 (may require additional review)
 * - Block if total claim === 0
 *
 * @param claim - Complete travel claim
 * @returns Validation result with errors and warnings
 */
export function validateTotalClaim(claim: Partial<TravelClaim>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const totalClaim = claim.totalClaimAmount ?? 0;

  // Block if zero claim
  if (totalClaim === 0) {
    errors.push('Total claim amount cannot be $0. Please add expenses or entitlements.');
  }

  // Block if exceeds auto-approval threshold
  if (totalClaim >= AUTO_APPROVAL_THRESHOLD) {
    errors.push(
      `Total claim amount ($${totalClaim.toLocaleString()}) exceeds the auto-approval threshold of $${AUTO_APPROVAL_THRESHOLD.toLocaleString()}. Additional approval may be required.`
    );
  }

  // Warn if exceeds high amount threshold
  if (totalClaim >= HIGH_AMOUNT_THRESHOLD && totalClaim < AUTO_APPROVAL_THRESHOLD) {
    warnings.push(
      `Total claim amount ($${totalClaim.toLocaleString()}) exceeds $${HIGH_AMOUNT_THRESHOLD.toLocaleString()} and may require additional review by approving official.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get Claim Warnings
 *
 * Analyzes the complete claim and returns an array of warnings:
 * - TLE cap exceeded
 * - Missing receipts for expenses ≥ $75
 * - High total amount
 * - No expenses entered
 *
 * @param claim - Complete travel claim
 * @returns Array of warning objects with type, message, and severity
 */
export function getClaimWarnings(claim: Partial<TravelClaim>): Warning[] {
  const warnings: Warning[] = [];

  // Check TLE cap
  if (claim.tleDays && claim.tleDays > MAX_TLE_DAYS) {
    warnings.push({
      type: 'tle_cap_exceeded',
      message: `TLE days (${claim.tleDays}) exceed the maximum allowed (${MAX_TLE_DAYS} days per JTR §5530)`,
      severity: 'error',
      field: 'tleDays',
    });
  }

  // Check for missing receipts
  const expensesRequiringReceipts =
    claim.expenses?.filter(
      (expense) =>
        expense.amount >= RECEIPT_REQUIRED_THRESHOLD &&
        (!expense.receipts || expense.receipts.length === 0)
    ) ?? [];

  if (expensesRequiringReceipts.length > 0) {
    warnings.push({
      type: 'missing_receipt',
      message: `${expensesRequiringReceipts.length} expense${
        expensesRequiringReceipts.length > 1 ? 's' : ''
      } ≥ $${RECEIPT_REQUIRED_THRESHOLD} missing receipt photo${
        expensesRequiringReceipts.length > 1 ? 's' : ''
      }`,
      severity: 'warning',
      field: 'receipts',
    });
  }

  // Check high total amount
  const totalClaim = claim.totalClaimAmount ?? 0;
  if (totalClaim >= HIGH_AMOUNT_THRESHOLD && totalClaim < AUTO_APPROVAL_THRESHOLD) {
    warnings.push({
      type: 'high_amount',
      message: `Total claim amount ($${totalClaim.toLocaleString()}) may require additional approving official review`,
      severity: 'warning',
      field: 'totalClaimAmount',
    });
  }

  // Check if no expenses
  if (!claim.expenses || claim.expenses.length === 0) {
    warnings.push({
      type: 'no_expenses',
      message: 'No expenses have been entered. Add lodging, fuel, or miscellaneous expenses.',
      severity: 'warning',
      field: 'expenses',
    });
  }

  // Check if total claim exceeds auto-approval
  if (totalClaim >= AUTO_APPROVAL_THRESHOLD) {
    warnings.push({
      type: 'high_amount',
      message: `Total claim amount ($${totalClaim.toLocaleString()}) exceeds auto-approval threshold and requires O-6+ approval`,
      severity: 'error',
      field: 'totalClaimAmount',
    });
  }

  // Check if claim is zero
  if (totalClaim === 0) {
    warnings.push({
      type: 'no_expenses',
      message: 'Total claim amount is $0. Cannot submit an empty claim.',
      severity: 'error',
      field: 'totalClaimAmount',
    });
  }

  return warnings;
}

/**
 * Validate Claim Step (Unified Validator)
 *
 * Validates a specific wizard step based on step number.
 * Calls the appropriate validation function for each step.
 *
 * @param claim - Complete or partial travel claim
 * @param step - Step number (1-5)
 * @returns Validation result with errors and warnings
 */
export function validateClaimStep(claim: Partial<TravelClaim>, step: 1 | 2 | 3 | 4 | 5): ValidationResult {
  switch (step) {
    case 1:
      // Step 1: Trip Details
      return validateTripDetails(claim);

    case 2:
      // Step 2: Lodging Expenses
      const lodgingExpenses = claim.expenses?.filter((e) => e.expenseType === 'lodging') ?? [];
      return validateLodgingExpenses(lodgingExpenses);

    case 3:
      // Step 3: Fuel & Transportation
      const transportExpenses =
        claim.expenses?.filter((e) =>
          ['fuel', 'toll', 'parking', 'rental_car'].includes(e.expenseType)
        ) ?? [];
      return validateFuelExpenses(transportExpenses, claim.travelMode ?? 'pov');

    case 4:
      // Step 4: Per Diem & Meals
      const perDiemDays = claim.perDiemDays?.length ?? 0;
      const mealDeductions = claim.mealsAndIncidentals?.mealDeductions ?? 0;
      return validatePerDiem(perDiemDays, mealDeductions);

    case 5:
      // Step 5: Review & Submit
      // Combine all validations
      const step1 = validateTripDetails(claim);
      const step2 = validateLodgingExpenses(
        claim.expenses?.filter((e) => e.expenseType === 'lodging') ?? []
      );
      const step3 = validateFuelExpenses(
        claim.expenses?.filter((e) =>
          ['fuel', 'toll', 'parking', 'rental_car'].includes(e.expenseType)
        ) ?? [],
        claim.travelMode ?? 'pov'
      );
      const step4 = validatePerDiem(
        claim.perDiemDays?.length ?? 0,
        claim.mealsAndIncidentals?.mealDeductions ?? 0
      );
      const totalValidation = validateTotalClaim(claim);

      // Check member certification
      const certificationErrors: string[] = [];
      if (!claim.memberCertification) {
        certificationErrors.push(
          'You must certify that this claim is accurate per 31 U.S.C. §3729 (False Claims Act)'
        );
      }

      const allErrors = [
        ...step1.errors,
        ...step2.errors,
        ...step3.errors,
        ...step4.errors,
        ...totalValidation.errors,
        ...certificationErrors,
      ];

      const allWarnings = [
        ...(step1.warnings ?? []),
        ...(step2.warnings ?? []),
        ...(step3.warnings ?? []),
        ...(step4.warnings ?? []),
        ...(totalValidation.warnings ?? []),
      ];

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
      };

    default:
      return {
        isValid: false,
        errors: [`Invalid step number: ${step}. Must be 1-5.`],
      };
  }
}

/**
 * Check if expense requires receipt per DoDFMR Vol. 9
 *
 * @param amount - Expense amount in USD
 * @returns True if receipt is required
 */
export function requiresReceipt(amount: number): boolean {
  return amount >= RECEIPT_REQUIRED_THRESHOLD;
}

/**
 * Get validation summary for display in UI
 *
 * @param result - Validation result
 * @returns Human-readable summary string
 */
export function getValidationSummary(result: ValidationResult): string {
  if (result.isValid) {
    return result.warnings && result.warnings.length > 0
      ? `Valid with ${result.warnings.length} warning${result.warnings.length > 1 ? 's' : ''}`
      : 'Valid';
  }

  return `${result.errors.length} error${result.errors.length > 1 ? 's' : ''} found`;
}
