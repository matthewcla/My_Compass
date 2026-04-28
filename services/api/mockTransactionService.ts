// services/api/mockTransactionService.ts
// Mock Transaction Service - Simulates Navy Legacy System BIN Lock
// Zero Trust: No PII logging

import type {
    BinLockFailedResponse,
    BinLockResponse,
    BinLockResult,
} from '@/types/api';

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate a cryptographically-styled mock token.
 * @returns A random hex string for lock token simulation.
 */
function generateLockToken(): string {
    const chars = '0123456789abcdef';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars[Math.floor(Math.random() * chars.length)];
    }
    return token;
}

/**
 * Generate a random delay between min and max milliseconds.
 * Simulates legacy system network latency.
 */
function getRandomLatency(minMs: number = 500, maxMs: number = 2000): number {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Generate an ISO 8601 timestamp offset by a given number of minutes.
 */
function getExpirationTimestamp(minutesFromNow: number = 5): string {
    const expiration = new Date();
    expiration.setMinutes(expiration.getMinutes() + minutesFromNow);
    return expiration.toISOString();
}

// =============================================================================
// MOCK TRANSACTION SERVICE
// =============================================================================

/**
 * Attempts to acquire a Buy-It-Now (BIN) lock on a billet.
 *
 * Simulates Navy legacy system behavior:
 * - Network latency between 500ms and 2000ms
 * - 80% success rate (returns BinLockResponse with lockToken)
 * - 20% failure rate (returns BinLockFailedResponse with CONFLICT code)
 *
 * @param billetId - The UUID of the billet to lock
 * @param userId - The UUID of the user attempting the lock (not logged per Zero Trust)
 * @returns Promise resolving to BinLockResult
 */
export async function attemptBinLock(
    billetId: string,
    userId: string
): Promise<BinLockResult> {
    // Validate inputs exist (no PII logging)
    if (!billetId || !userId) {
        // Return conflict for invalid requests (fail-safe)
        const failedResponse: BinLockFailedResponse = {
            success: false,
            error: {
                code: 'CONFLICT',
                message: 'Invalid request parameters',
                details: {
                    lockedByUserId: 'SYSTEM',
                    lockedAt: new Date().toISOString(),
                    expiresAt: getExpirationTimestamp(1),
                },
                retryable: false,
            },
        };
        return failedResponse;
    }

    // Simulate network latency
    const latency = getRandomLatency(500, 2000);

    return new Promise<BinLockResult>((resolve) => {
        setTimeout(() => {
            // Simulate race condition: 80% success, 20% failure
            const isSuccess = Math.random() < 0.8;

            if (isSuccess) {
                // SUCCESS: Generate lock token and return success response
                const successResponse: BinLockResponse = {
                    success: true,
                    data: {
                        lockToken: generateLockToken(),
                        expiresAt: getExpirationTimestamp(5), // 5 minute lock
                        billetId: billetId,
                    },
                    meta: {
                        requestId: generateLockToken().substring(0, 16),
                        timestamp: new Date().toISOString(),
                    },
                };
                resolve(successResponse);
            } else {
                // FAILURE: Another user has the lock (simulated race condition)
                const failedResponse: BinLockFailedResponse = {
                    success: false,
                    error: {
                        code: 'CONFLICT',
                        message: 'Billet lock unavailable - another transaction in progress',
                        details: {
                            // Anonymized competing user (Zero Trust)
                            lockedByUserId: `USR-${generateLockToken().substring(0, 8).toUpperCase()}`,
                            lockedAt: new Date(Date.now() - Math.random() * 300000).toISOString(), // Random past time
                            expiresAt: getExpirationTimestamp(Math.floor(Math.random() * 4) + 1), // 1-5 min remaining
                        },
                        retryable: false,
                    },
                };
                resolve(failedResponse);
            }
        }, latency);
    });
}
