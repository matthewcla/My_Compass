# My Compass — Security Posture

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Status:** Development (Offline-First, No Live APIs)

This document inventories all security controls currently implemented in the My Compass codebase, their status, and the gaps that must be closed before connecting to Navy HR data systems.

---

## 1. Current State Summary

| Category | Status | Notes |
|----------|--------|-------|
| PII Log Prevention | ✅ Implemented | `SecureLogger` with regex redaction |
| Token Storage | ✅ Implemented | `expo-secure-store` for native, encrypted cookies for web |
| Data Encryption at Rest | ⚠️ Stubbed | AES functions exist but are **disabled** (no-op passthrough) |
| Authentication | ⚠️ Stubbed | Okta OIDC config exists but uses mock token flow |
| Authorization / RBAC | ❌ Not Implemented | No role-based access control |
| Audit Logging | ❌ Not Implemented | No action trail beyond console logs |
| Input Validation | ✅ Implemented | Zod schemas for all data models |
| Network Security | ✅ Implemented | TLS enforcement, retry with backoff, abort/timeout |
| Secrets Management | ✅ Implemented | `process.env` only, no hardcoded secrets verified |
| Offline Sync Security | ⚠️ Partial | Sync queue exists but payloads are unencrypted |

---

## 2. PII Protection

### 2.1 SecureLogger

**File:** [logger.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/utils/logger.ts)

Auto-redacts PII patterns from all log output:
- SSN: `\b\d{3}-\d{2}-\d{4}\b`
- DoD ID: `\b\d{10}\b`
- Email: Standard email regex

**Global patching:** `SecureLogger.patchGlobalConsole()` intercepts `console.log/warn/error/info` to sanitize all arguments recursively.

### 2.2 Schema Annotations

PII fields in [user.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/types/user.ts) are annotated:
```typescript
/** @security PII - STRICTLY FORBIDDEN IN LOGS */
dodId: z.string().optional(),
displayName: z.string(),
email: z.string().email().optional(),
```

### 2.3 Privacy Mode

User schema includes `privacyMode: boolean` for UI-level PII masking (e.g., hiding DoD ID behind eye-toggle).

### 2.4 Gaps

| Gap | Impact | Remediation |
|-----|--------|-------------|
| `console.log` used directly in stores (not `SecureLogger`) | PII could leak in store log statements | Replace all `console.*` calls in `store/` with `SecureLogger` |
| No `@security` annotations on leave form fields (phone, emergency contact) | Developers may log these fields | Add annotations to `types/leave.ts` |

---

## 3. Storage Tiers

### Tier 1: Secure Store (Highest Security)

**Technology:** `expo-secure-store` (Keychain on iOS, Keystore on Android)

**Usage:** Auth tokens, session credentials

**File:** [useStorageState.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/lib/useStorageState.ts)

### Tier 2: SQLite (Encrypted — Currently Disabled)

**Technology:** `expo-sqlite` with AES encryption via `crypto-js`

**File:** [storage.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/storage.ts)

**Current state:** `encryptData()` and `decryptData()` in [encryption.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/lib/encryption.ts) are **no-op passthroughs** — they return data unmodified. This was intentionally disabled for development speed:

```typescript
export const encryptData = (data: string): string => {
  return data; // Encryption disabled for dev phase
};
```

**Key management issue:** The encryption key falls back through:
1. `process.env.EXPO_PUBLIC_STORAGE_KEY` (preferred)
2. `localStorage` (web only)
3. `'fallback-session-key-' + timestamp` (session-only, insecure)

### Tier 3: AsyncStorage (Non-Sensitive Only)

**Usage:** Sync queue state, UI preferences, non-PII cache

**Constraint:** `_AI_CONTEXT.xml` explicitly forbids PII or tokens in plain AsyncStorage.

---

## 4. Authentication

### Current Implementation

**File:** [auth.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/config/auth.ts)

```typescript
export const OKTA_ISSUER = 'https://dev-navy-mock.okta.com';
export const CLIENT_ID = 'my-compass-client';
export const REDIRECT_URI = 'mycompass://auth';
```

**Flow:** `AuthGuard` in root layout checks session → `hydrateUserFromToken()` → `services.user.getCurrentUser(token)` → populates `useUserStore`.

**Current state:** Token flow is stubbed. `lib/ctx.tsx` uses `mockAccessToken = 'mock-okta-access-token'` for development.

### What's Needed for Production

1. **CAC/PKI integration** — Okta with DoD PKI trust chain
2. **Token refresh** — JWT refresh token rotation
3. **Session timeout** — Configurable idle timeout with re-auth
4. **Certificate pinning** — Pin Navy API server certificates

---

## 5. Network Security

### HTTP Client

**File:** [client.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/api/client.ts)

| Feature | Status |
|---------|--------|
| TLS enforcement | ✅ Base URL is `https://` |
| Request timeout | ✅ 30s with AbortController |
| Retry with exponential backoff | ✅ Max 3 retries, jittered delay, cap 30s |
| Auth token injection | ✅ Bearer token in Authorization header |
| Request/response interceptors | ✅ Extensible pipeline |
| Retryable status codes | ✅ 429, 500, 502, 503, 504 |
| Certificate pinning | ❌ Not implemented |
| Request signing | ❌ Not implemented |

### API Configuration

**File:** [api.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/config/api.ts)

Base URL: `https://api.dev.mycompass.navy.mil` (placeholder — not a real endpoint)

---

## 6. Input Validation

**Framework:** Zod 4

Schemas defined in [types/](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/types/) for:
- `UserSchema` — validates user profile fields
- `LeaveRequestSchema` — validates leave form data
- `PCSOrderSchema` — validates PCS order structure
- `TravelClaimSchema` — validates travel claim expenses

All form inputs validated via `react-hook-form` + `@hookform/resolvers/zod` before store persistence.

---

## 7. Sync Queue

**File:** [syncQueue.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/syncQueue.ts)

Offline-first write queue with:
- Persistent queue in AsyncStorage
- Exponential backoff retry (base 2s, cap 60s, max 5 attempts)
- Dead-letter queue for failed operations
- In-flight recovery on app restart (resets to `pending`)

**Security gap:** Queue payloads are stored as plain JSON in AsyncStorage. When real API operations contain CUI/PII, payloads must be encrypted before persistence.

---

## 8. Secrets Management

### Verified Controls

- No hardcoded secrets in source (verified by [SECURITY_REVIEW.md](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/SECURITY_REVIEW.md))
- `OKTA_ISSUER` is a config URL, not a secret
- Mock tokens are explicitly labeled as development-only
- `process.env` pattern enforced for all sensitive config

### Remaining Concerns

| Item | Risk | Location |
|------|------|----------|
| `EXPO_PUBLIC_STORAGE_KEY` env var | Exposed in client bundle (Expo `PUBLIC_` prefix) | `lib/encryption.ts` |
| Fallback key generation | Session-only keys mean data unrecoverable after restart | `lib/encryption.ts` |
| `CLIENT_ID` in source | Not sensitive per Okta public client spec, but should be env-sourced | `config/auth.ts` |
