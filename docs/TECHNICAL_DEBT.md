# My Compass — Technical Debt Register

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Status:** Pre-Production (Offline-First, Mock Data Only)

This document catalogs all known technical debt, organized by priority. Each item includes its location, impact, and remediation path.

---

## Priority Definitions

| Priority | Definition | Timeline |
|----------|-----------|----------|
| **P0** | Blocks production deployment or creates security/compliance risk | Before any ATO submission |
| **P1** | Required before connecting to CUI/PII Navy APIs | Before API integration phase |
| **P2** | Should fix for code quality and maintainability | During next refactor cycle |
| **P3** | Nice to have, no immediate risk | As capacity allows |

---

## P0 — Blocks Production

### TD-001: Encryption Disabled

**Files:** [encryption.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/lib/encryption.ts)

`encryptData()` and `decryptData()` are no-op passthroughs. All SQLite data at rest is unencrypted.

```typescript
export const encryptData = (data: string): string => {
  return data; // Encryption disabled for dev phase
};
```

**Remediation:**
1. Replace `crypto-js` (not FIPS-validated) with Web Crypto API or a FIPS 140-2 validated module
2. Re-enable encryption in `encryptData/decryptData`
3. Implement secure key derivation (PBKDF2 from user credential, not env var)
4. Add data migration from unencrypted → encrypted storage

---

### TD-002: `crypto-js` Not FIPS-Validated

**Files:** [package.json](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/package.json), [encryption.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/lib/encryption.ts)

`crypto-js` is a JavaScript AES implementation that is **not FIPS 140-2 certified**. DISA STIG SRG-APP-000514 requires FIPS-validated cryptographic modules for CUI.

**Remediation:**
- Replace with Web Crypto API (`SubtleCrypto`) for AES-GCM
- Or use `react-native-quick-crypto` (wraps OpenSSL, FIPS-capable)
- Remove `crypto-js` and `@types/crypto-js` from dependencies

---

### TD-003: `@vercel/analytics` Sends Data to Commercial Servers

**Files:** [package.json](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/package.json)

Vercel Analytics transmits usage telemetry to Vercel's commercial infrastructure. This is incompatible with DON data handling requirements.

**Remediation:**
- Remove `@vercel/analytics` from dependencies
- Replace with a DoD-approved analytics solution or internal telemetry endpoint
- If analytics are needed, implement a self-hosted solution behind the Navy API gateway

---

### TD-004: Encryption Key Management Insecure

**Files:** [encryption.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/lib/encryption.ts)

Key derivation fallback chain is insecure:
1. `EXPO_PUBLIC_*` env vars are embedded in the client bundle (readable)
2. `localStorage` key on web is not encrypted
3. Fallback `'fallback-session-key-' + timestamp` is deterministic and session-only

**Remediation:**
- Derive key from user's CAC/PKI credential via PBKDF2
- Store derived key in `expo-secure-store` (native) or IndexedDB with Web Crypto (web)
- Never expose key material in environment variables with `PUBLIC_` prefix

---

## P1 — Required Before API Integration

### TD-005: Service Registry Wired to Mocks Only

**Files:** [serviceRegistry.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/api/serviceRegistry.ts), all `mock*Service.ts` files

All 6 services (`assignment`, `career`, `user`, `pcs`, `inbox`, `leave`) resolve to mock implementations. The interface contracts exist but no real implementations.

**Remediation:**
- Create `real*Service.ts` implementations for each interface
- Add environment-based service resolution (`IS_MOCK_MODE` flag)
- See [API_INTEGRATION_ROADMAP.md](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/docs/API_INTEGRATION_ROADMAP.md)

---

### TD-006: No Real Authentication Flow

**Files:** [auth.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/config/auth.ts), [ctx.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/lib/ctx.tsx)

Auth uses `mockAccessToken`. No real Okta OIDC flow is implemented.

**Remediation:**
- Integrate `expo-auth-session` with Okta
- Implement PKCE flow for mobile OAuth
- Add CAC/PKI certificate authentication support
- Implement token refresh rotation

---

### TD-007: No Role-Based Access Control (RBAC)

No authorization layer exists. All users have implicit full access.

**Remediation:**
- Define roles: Sailor, Supervisor, Admin, YN (Yeoman)
- Add `role` field to User type
- Implement route-level and action-level guards
- Approval chains for leave/PCS require supervisor role verification

---

### TD-008: No Audit Logging

No persistent audit trail for user actions. Only ephemeral console logs.

**Remediation:**
- Create `AuditLogService` that records action type, timestamp, user ID (hashed), and resource
- Persist locally in SQLite, sync to server when online
- Required for NIST AC-6, AU-2, AU-3

---

### TD-009: Sync Queue Payloads Unencrypted

**Files:** [syncQueue.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/syncQueue.ts)

Queue operations stored as plain JSON in AsyncStorage. When real mutations contain CUI/PII (e.g., leave requests with emergency contacts), this violates data-at-rest requirements.

**Remediation:**
- Encrypt payloads before `AsyncStorage.setItem`
- Decrypt on `hydrate()`
- Use Tier 2 storage (SQLite encrypted) instead of AsyncStorage for queue

---

### TD-010: `console.log` Used Instead of SecureLogger in Stores

**Files:** All files in `store/` directory

Stores use `console.log('[UserStore] ...')` directly instead of `SecureLogger.log()`. If objects containing PII are logged, they bypass redaction.

**Remediation:**
- Replace all `console.*` calls in `store/` with `SecureLogger.*`
- Add lint rule to flag direct `console.*` usage outside of `utils/logger.ts`

---

## P2 — Should Fix

### TD-011: `storage.ts` Monolith (1,517 Lines)

**Files:** [storage.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/storage.ts)

Single file contains all SQLite CRUD for users, billets, applications, leave, dashboard, assignments, PCS orders, and documents.

**Remediation:**
- Split into domain-specific repositories: `UserRepository.ts`, `LeaveRepository.ts`, `PCSRepository.ts`, etc.
- Keep shared `DatabaseManager` for connection, migration, and transaction management

---

### TD-012: Mock Data Hardcoded in Stores

**Files:** `store/usePCSStore.ts`, `store/useLeaveStore.ts`, `data/mockProfile.json`

Demo personas and default values are embedded directly in stores rather than loaded from a configurable data layer.

**Remediation:**
- Centralize all mock/demo data in `data/` directory
- Load conditionally based on `__DEV__` or `IS_DEMO_MODE` flag
- Keep stores clean of data fixtures

---

### TD-013: No Database Migration System

**Files:** [migrations.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/migrations.ts)

Migrations exist but are ad-hoc SQL strings. No version tracking or rollback capability.

**Remediation:**
- Implement migration version table in SQLite
- Add `up()` and `down()` methods per migration
- Track applied migrations to prevent re-execution

---

## P3 — Nice to Have

### TD-014: Limited Test Coverage

Test files exist for stores and some utilities, but no component-level tests, no E2E tests, and no integration tests.

**Remediation:**
- Add React Native Testing Library tests for critical components
- Add Detox or Maestro E2E tests for critical flows (Leave wizard, PCS phase transitions)
- Set coverage targets (recommend 60% statement coverage for MVP)

---

### TD-015: No Performance Benchmarks

No profiling data for FlashList rendering, store hydration speed, or SQLite query performance.

**Remediation:**
- Add benchmark scripts in `scripts/`
- Profile FlashList renders with Reanimated performance overlay
- Measure SQLite query times for datasets of 100/1,000/10,000 records

---

### TD-016: `moti` Animation Library Redundancy

Both `moti` and `react-native-reanimated` are in dependencies. `moti` wraps Reanimated and adds ~30KB to the bundle.

**Remediation:**
- Audit where `moti` is used vs direct Reanimated
- If usage is minimal, replace with equivalent Reanimated code and remove dependency
