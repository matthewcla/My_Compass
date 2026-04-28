/**
 * receiptBridge.ts
 * ────────────────────────────────────────────────────────────────────
 * Bridges Phase 3 PCSReceipts into DD 1351-2 Expense line items.
 *
 * PCSReceipt (captured via camera + OCR) is intentionally lightweight.
 * The Expense type (from types/travelClaim) carries full JTR-compliant
 * sub-details. This bridge promotes receipts into expenses with as
 * much data as OCR provides, leaving sub-details optional for the
 * Sailor to fill during settlement.
 */

import type { PCSReceipt, ReceiptCategory } from '@/types/pcs';
import type { Expense, ExpenseType, Receipt } from '@/types/travelClaim';

// ─── Category Mapping ────────────────────────────────────────────────

const CATEGORY_TO_EXPENSE_TYPE: Record<ReceiptCategory, ExpenseType> = {
    GAS: 'fuel',
    LODGING: 'lodging',
    TOLLS: 'toll',
    MEALS: 'misc',
    OTHER: 'misc',
};

const CATEGORY_DESCRIPTION: Record<ReceiptCategory, string> = {
    GAS: 'Fuel',
    LODGING: 'Lodging',
    TOLLS: 'Toll',
    MEALS: 'Meals',
    OTHER: 'Other expense',
};

// ─── Bridge Function ─────────────────────────────────────────────────

/**
 * Convert a single PCSReceipt into a TravelClaim Expense.
 *
 * The receipt photo is attached as a Receipt object. Category-specific
 * sub-details are populated with the OCR'd amount where applicable.
 */
function receiptToExpense(receipt: PCSReceipt, claimId: string): Expense {
    const expenseType = CATEGORY_TO_EXPENSE_TYPE[receipt.category];
    const amount = receipt.amount ?? 0;

    // Build the receipt attachment from the PCSReceipt image
    const attachment: Receipt = {
        id: `rcpt-${receipt.id}`,
        expenseId: receipt.id,
        localUri: receipt.imageUri,
        remoteUrl: null,
        mimeType: 'image/jpeg',
        uploadStatus: 'pending',
        capturedAt: receipt.capturedAt,
    };

    // Base expense
    const expense: Expense = {
        id: receipt.id,
        claimId,
        expenseType,
        amount,
        date: receipt.capturedAt,
        description: receipt.note || CATEGORY_DESCRIPTION[receipt.category],
        receipts: [attachment],
    };

    // Populate type-specific sub-details with available data
    switch (receipt.category) {
        case 'GAS':
            expense.fuelDetails = {
                // OCR only gives total amount — gallons/price derived later
            };
            break;

        case 'LODGING':
            expense.lodgingDetails = {
                nightlyRate: amount,
                numberOfNights: 1,
                localityMaxRate: 0, // Sailor fills during settlement
                isTLE: false,
            };
            break;

        case 'TOLLS':
            expense.tollDetails = {
                tollAmount: amount,
                roadOrBridgeName: receipt.note || undefined,
            };
            break;

        case 'MEALS':
        case 'OTHER':
            expense.miscDetails = {
                description: receipt.note || CATEGORY_DESCRIPTION[receipt.category],
            };
            break;
    }

    return expense;
}

/**
 * Bridge all Phase 3 PCSReceipts into TravelClaim Expenses.
 *
 * @param receipts  - Array of PCSReceipts from usePCSStore.receipts
 * @param claimId   - The travel claim draft ID to associate expenses with
 * @returns         - Array of Expense objects ready for the settlement flow
 */
export function bridgeReceiptsToExpenses(
    receipts: PCSReceipt[],
    claimId: string,
): Expense[] {
    return receipts.map((r) => receiptToExpense(r, claimId));
}
