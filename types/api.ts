// types/api.ts
// My Compass - API Response Wrapper Types
// Handles paginated responses, error envelopes, and API-specific typing

import { z } from 'zod';
import type {
    Application,
    Billet,
    LeaveBalance,
    LeaveRequest,
} from './schema';
import { User } from './user';

// =============================================================================
// PAGINATION
// =============================================================================

/**
 * Standard pagination metadata from API responses.
 */
export const PaginationMetaSchema = z.object({
    currentPage: z.number().int().min(1),
    totalPages: z.number().int().min(0),
    pageSize: z.number().int().min(1).max(100),
    totalItems: z.number().int().min(0),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

/**
 * Cursor-based pagination for infinite scroll.
 */
export const CursorPaginationMetaSchema = z.object({
    nextCursor: z.string().nullable(),
    previousCursor: z.string().nullable(),
    hasMore: z.boolean(),
    limit: z.number().int().min(1).max(100),
});
export type CursorPaginationMeta = z.infer<typeof CursorPaginationMetaSchema>;

// =============================================================================
// API RESPONSE ENVELOPES
// =============================================================================

/**
 * Standard success response envelope.
 */
export interface ApiResponse<T> {
    success: true;
    data: T;
    meta?: {
        requestId: string;
        timestamp: string;
    };
}

/**
 * Paginated success response envelope.
 */
export interface PaginatedApiResponse<T> {
    success: true;
    data: T[];
    pagination: PaginationMeta;
    meta?: {
        requestId: string;
        timestamp: string;
    };
}

/**
 * Cursor-paginated success response envelope.
 */
export interface CursorPaginatedApiResponse<T> {
    success: true;
    data: T[];
    pagination: CursorPaginationMeta;
    meta?: {
        requestId: string;
        timestamp: string;
    };
}

/**
 * API error codes for client-side handling.
 */
export const ApiErrorCodeSchema = z.enum([
    'UNAUTHORIZED',
    'FORBIDDEN',
    'NOT_FOUND',
    'VALIDATION_ERROR',
    'CONFLICT', // e.g., BIN race condition
    'RATE_LIMITED',
    'SERVICE_UNAVAILABLE',
    'INTERNAL_ERROR',
    'NETWORK_ERROR',
    'TIMEOUT',
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/**
 * Standard error response envelope.
 */
export interface ApiErrorResponse {
    success: false;
    error: {
        code: ApiErrorCode;
        message: string;
        details?: Record<string, string[]>; // Field-level validation errors
        retryable: boolean;
        retryAfterMs?: number;
    };
    meta?: {
        requestId: string;
        timestamp: string;
    };
}

/**
 * Union type for any API response.
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;
export type PaginatedApiResult<T> = PaginatedApiResponse<T> | ApiErrorResponse;

// =============================================================================
// DOMAIN-SPECIFIC API RESPONSES
// =============================================================================

// --- My Assignment (Billets & Applications) ---

export type GetBilletsResponse = PaginatedApiResponse<Billet>;
export type GetBilletResponse = ApiResponse<Billet>;

export type GetApplicationsResponse = PaginatedApiResponse<Application>;
export type GetApplicationResponse = ApiResponse<Application>;

/**
 * Buy-It-Now lock request response.
 */
export interface BinLockResponse {
    success: true;
    data: {
        lockToken: string;
        expiresAt: string; // ISO 8601
        billetId: string;
    };
    meta?: {
        requestId: string;
        timestamp: string;
    };
}

/**
 * Buy-It-Now lock failure (race condition).
 */
export interface BinLockFailedResponse {
    success: false;
    error: {
        code: 'CONFLICT';
        message: string;
        details: {
            lockedByUserId: string;
            lockedAt: string;
            expiresAt: string;
        };
        retryable: false;
    };
}

export type BinLockResult = BinLockResponse | BinLockFailedResponse;

// --- My Admin (Leave) ---

export type GetLeaveBalanceResponse = ApiResponse<LeaveBalance>;
export type GetLeaveRequestsResponse = PaginatedApiResponse<LeaveRequest>;
export type GetLeaveRequestResponse = ApiResponse<LeaveRequest>;

/**
 * Leave request submission response.
 */
export interface SubmitLeaveRequestResponse {
    success: true;
    data: {
        requestId: string;
        status: 'pending';
        submittedAt: string;
        nextApproverId: string;
        nextApproverName: string;
    };
}

// --- User / Auth ---

export type GetCurrentUserResponse = ApiResponse<User>;
export type SearchUsersResponse = PaginatedApiResponse<User>;

// =============================================================================
// REQUEST PAYLOADS
// =============================================================================

/**
 * Application creation payload.
 */
export const CreateApplicationPayloadSchema = z.object({
    billetId: z.string().uuid(),
    personalStatement: z.string().max(2000).optional(),
    isBuyItNow: z.boolean().default(false),
});
export type CreateApplicationPayload = z.infer<typeof CreateApplicationPayloadSchema>;

/**
 * Leave request creation payload.
 */
export const CreateLeaveRequestPayloadSchema = z.object({
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    leaveType: z.enum(['annual', 'emergency', 'convalescent', 'terminal', 'parental', 'bereavement', 'adoption', 'ptdy', 'other']),
    leaveAddress: z.string().min(1),
    leavePhoneNumber: z.string().min(10),
    emergencyContact: z.object({
        name: z.string().min(1),
        relationship: z.string().min(1),
        phoneNumber: z.string().min(10),
        altPhoneNumber: z.string().optional(),
        address: z.string().optional(),
    }),
    modeOfTravel: z.string().optional(),
    destinationCountry: z.string().default('USA'),
    leaveInConus: z.boolean().default(true),
    // Time & Working Hours
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(), // HH:mm
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),   // HH:mm
    departureWorkingHours: z.string().optional(), // e.g. "0700-1600" or "NONE"
    returnWorkingHours: z.string().optional(),    // e.g. "0700-1600" or "NONE"
    // Command Details
    dutySection: z.string().optional(),
    deptDiv: z.string().optional(),
    dutyPhone: z.string().optional(),
    rationStatus: z.enum(['commuted', 'in_kind', 'not_applicable']).optional(),
    memberRemarks: z.string().max(1000).optional(),
});
export type CreateLeaveRequestPayload = z.infer<typeof CreateLeaveRequestPayloadSchema>;

// =============================================================================
// API CLIENT TYPE HELPERS
// =============================================================================

/**
 * Type helper for extracting data from API response.
 */
export function isApiSuccess<T>(result: ApiResult<T>): result is ApiResponse<T> {
    return result.success === true;
}

/**
 * Type helper for paginated responses.
 */
export function isPaginatedSuccess<T>(result: PaginatedApiResult<T>): result is PaginatedApiResponse<T> {
    return result.success === true;
}

/**
 * Extract error from API response if present.
 */
export function getApiError(result: ApiResult<unknown> | PaginatedApiResult<unknown>): ApiErrorResponse['error'] | null {
    return result.success === false ? result.error : null;
}
