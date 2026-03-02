# My Compass — Frontend Technical Debt Register

> **Version:** 1.1 · **Updated:** 2026-02-27 · **Status:** Pre-Production (Offline-First, Mock Data Only)
>
> **Scope:** Issues resolvable entirely within the React Native client codebase — no live backend API required.
> Backend components of shared items are tracked in [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md).
> For the full unified register see [TECHNICAL_DEBT.md](TECHNICAL_DEBT.md).

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

**Files:** [lib/encryption.ts](../lib/encryption.ts)

`encryptData()` and `decryptData()` are no-op passthroughs. All SQLite data at rest is unencrypted.

```typescript
export const encryptData = (data: string): string => {
  return data; // Encryption disabled for dev phase
};
```

**Frontend Remediation:**
1. Replace `crypto-js` (not FIPS-validated) with Web Crypto API or a FIPS 140-2 validated module — see TD-002
2. Re-enable encryption in `encryptData/decryptData`
3. Implement secure key derivation (PBKDF2 from user credential, not env var) — see TD-004
4. Add data migration from unencrypted → encrypted storage

---

### TD-002: `crypto-js` Not FIPS-Validated

**Files:** [package.json](../package.json), [lib/encryption.ts](../lib/encryption.ts)

`crypto-js` is a JavaScript AES implementation that is **not FIPS 140-2 certified**. DISA STIG SRG-APP-000514 requires FIPS-validated cryptographic modules for CUI.

**Frontend Remediation:**
- Replace with Web Crypto API (`SubtleCrypto`) for AES-GCM
- Or use `react-native-quick-crypto` (wraps OpenSSL, FIPS-capable)
- Remove `crypto-js` and `@types/crypto-js` from `package.json`

---

### ~~TD-003: `@vercel/analytics` Sends Data to Commercial Servers~~ ✅ RESOLVED 2026-02-27

**Files:** [package.json](../package.json)

~~Vercel Analytics transmits usage telemetry to Vercel's commercial infrastructure. This is incompatible with DON data handling requirements.~~

**Resolution:** Removed `@vercel/analytics` from `package.json` and `package-lock.json`. No call sites existed in the codebase.

---

### TD-004: Encryption Key Management Insecure

**Files:** [lib/encryption.ts](../lib/encryption.ts)

Key derivation fallback chain is insecure:
1. `EXPO_PUBLIC_*` env vars are embedded in the client bundle (readable)
2. `localStorage` key on web is not encrypted
3. Fallback `'fallback-session-key-' + timestamp` is deterministic and session-only

**Frontend Remediation:**
- Derive key from user's CAC/PKI credential via PBKDF2 (CAC integration is a shared concern — see TD-006 in [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md))
- Store derived key in `expo-secure-store` (native) or IndexedDB with Web Crypto (web)
- Never expose key material in environment variables with `EXPO_PUBLIC_` prefix

---

## P1 — Required Before API Integration

### TD-007 (Frontend Component): No Role-Based Access Control — Client Enforcement

> **Full item:** See TD-007 in [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md) for the backend enforcement layer.

No client-side authorization layer exists. All users have implicit full access to all routes and store actions.

**Frontend Remediation:**
- Add `role` field to `User` type (`Sailor | Supervisor | Admin | YN`)
- Add `role` to mock user fixtures in `data/` — see TD-012
- Implement route-level guards in Expo Router layouts (`app/(tabs)/_layout.tsx`, etc.)
- Add action-level role checks in store actions (e.g., leave approval requires `Supervisor`)
- Build supervisor approval-chain UI for leave and PCS flows

---

### TD-008 (Frontend Component): No Audit Logging — Local Persistence

> **Full item:** See TD-008 in [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md) for the server-side ingestion layer.

No persistent audit trail for user actions. Only ephemeral console logs.

**Frontend Remediation:**
- Create `AuditLogService` in `services/auditLog.ts`
- Record structured events for: login, data access, data modification, form submission, authorization failures
- Each record must include: timestamp, hashed user ID, event type, resource affected, outcome (success/failure)
- Persist records locally in encrypted SQLite (append-only — no update/delete)
- Queue records for background sync via `syncQueue.ts` when server endpoint is available
- Required for NIST AC-6, AU-2, AU-3

---

### TD-009: Sync Queue Payloads Unencrypted

**Files:** [services/syncQueue.ts](../services/syncQueue.ts)

Queue operations stored as plain JSON in AsyncStorage. When real mutations contain CUI/PII (e.g., leave requests with emergency contacts), this violates data-at-rest requirements.

**Frontend Remediation:**
- Encrypt payloads before `AsyncStorage.setItem` using fixed encryption from TD-001/TD-002
- Decrypt on `hydrate()`
- Migrate queue storage to Tier 2 (encrypted SQLite) instead of AsyncStorage

---

### ~~TD-010: `console.log` Used Instead of SecureLogger in Stores~~ ✅ RESOLVED 2026-02-27

**Files:** All files in [store/](../store/), [app/_layout.tsx](../app/_layout.tsx)

~~Stores use `console.log('[UserStore] ...')` directly instead of `SecureLogger.log()`. If objects containing PII are logged, they bypass redaction.~~

**Resolution:** Replaced all `console.*` calls across 8 stores and `_layout.tsx` with `SecureLogger.*`. Stripped `user.displayName` (PII) from OBLISERV check log in `usePCSStore.ts`. Wired `SecureLogger.patchGlobalConsole()` in `_layout.tsx` to intercept stray console calls globally. Remaining gap: ESLint rule to enforce this at CI — see ATO_READINESS_FRONTEND.md.

---

## P2 — Should Fix

### TD-011: `storage.ts` Monolith (1,517 Lines)

**Files:** [services/storage.ts](../services/storage.ts)

Single file contains all SQLite CRUD for users, billets, applications, leave, dashboard, assignments, PCS orders, and documents.

**Frontend Remediation:**
- Split into domain-specific repositories: `UserRepository.ts`, `LeaveRepository.ts`, `PCSRepository.ts`, etc.
- Keep shared `DatabaseManager` for connection, migration, and transaction management

---

### TD-012: Mock Data Hardcoded in Stores

**Files:** `store/usePCSStore.ts`, `store/useLeaveStore.ts`, `data/mockProfile.json`

Demo personas and default values are embedded directly in stores rather than loaded from a configurable data layer.

**Frontend Remediation:**
- Centralize all mock/demo data in `data/` directory
- Load conditionally based on `__DEV__` or `IS_DEMO_MODE` flag
- Keep stores clean of data fixtures

---

### TD-013: No Database Migration System

**Files:** [services/migrations.ts](../services/migrations.ts)

Migrations exist but are ad-hoc SQL strings. No version tracking or rollback capability.

**Frontend Remediation:**
- Implement migration version table in SQLite
- Add `up()` and `down()` methods per migration
- Track applied migrations to prevent re-execution

---

## P3 — Nice to Have

### TD-014: Limited Test Coverage

Test files exist for stores and some utilities, but no component-level tests, no E2E tests, and no integration tests.

**Frontend Remediation:**
- Add React Native Testing Library tests for critical components
- Add Detox or Maestro E2E tests for critical flows (Leave wizard, PCS phase transitions)
- Set coverage targets (recommend 60% statement coverage for MVP)

---

### TD-015: No Performance Benchmarks

No profiling data for FlashList rendering, store hydration speed, or SQLite query performance.

**Frontend Remediation:**
- Add benchmark scripts in `scripts/`
- Profile FlashList renders with Reanimated performance overlay
- Measure SQLite query times for datasets of 100/1,000/10,000 records

---

### TD-016: `moti` Animation Library Redundancy

Both `moti` and `react-native-reanimated` are in dependencies. `moti` wraps Reanimated and adds ~30KB to the bundle.

**Frontend Remediation:**
- Audit where `moti` is used vs direct Reanimated
- If usage is minimal, replace with equivalent Reanimated code and remove dependency

---

### TD-017: No Per-Screen Error Boundaries

**Files:** [components/AppErrorBoundary.tsx](../components/AppErrorBoundary.tsx), all route files in [app/](../app/)

A single global `ErrorBoundary` is wired in `_layout.tsx` (SI-11). If any screen throws, the entire app unmounts and the user is dropped to the global recovery screen — they lose their current flow context.

Per-screen boundaries would allow graceful degradation: a broken PCS wizard step could show an inline error without kicking the user out of the wizard, and a broken widget on the Hub could show a placeholder without resetting the full navigation stack.

**Frontend Remediation:**
- Export route-level `ErrorBoundary` from high-risk flow layouts: `app/leave/_layout.tsx`, `app/pcs-wizard/_layout.tsx`, `app/travel-claim/_layout.tsx`
- Add inline widget-level boundaries for Hub dashboard widgets
- Each boundary must follow the same SI-11 rule: no raw error content shown to user, include a support reference code
