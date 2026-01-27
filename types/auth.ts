/**
 * Authentication Types
 */

/**
 * Authentication token (JWT).
 * @security ZERO TRUST - Treat as untrusted input. Verify signature/expiration.
 */
export type AuthToken = string;
