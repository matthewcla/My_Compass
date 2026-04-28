# My Compass — Technical Debt Register (Index)

> **Version:** 1.1 · **Updated:** 2026-03-17 · **Status:** Prototype (Offline-First, Mock Data Only)

> ⚠️ **Development Status:** This project is currently a **prototype**. Security controls, centralized authentication, and live API integrations represent deferred production requirements, not immediately actionable technical debt.

This register has been split to track both actionable frontend technical debt and deferred backend/security requirements for future API integration.

---

## Subregisters

| File | Scope | Items |
|------|-------|-------|
| [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md) | All issues resolvable within the React Native client — no live backend required | ~~TD-003~~ ✅, TD-001, TD-002, TD-004, TD-007 (FE), TD-008 (FE), TD-009, ~~TD-010~~ ✅, TD-011, TD-012, TD-013, TD-014, TD-015, TD-016, TD-017 |
| [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md) | Issues requiring server infrastructure, identity provider, or live API | TD-005, TD-006, TD-007 (BE), TD-008 (BE), TD-003 (BE) |

---

## Deferred Production Requirements (Security & Backend)

Items in this category represent features deferred to the formal API integration phase.

| ID | Title | Priority | Owner |
|----|-------|----------|-------|
| **REQ-001** | Enable and Configure Encryption | P0 | [Frontend](#td-001-encryption-disabled) |
| **REQ-002** | FIPS-Validated Cryptography Implementation | P0 | [Frontend](#td-002-crypto-js-not-fips-validated) |
| ~~**REQ-003**~~ | ~~`@vercel/analytics` Commercial Servers~~ ✅ RESOLVED 2026-02-27 | P0 | [Frontend](#td-003-vercelanalytics-sends-data-to-commercial-servers) / [Backend](#td-003-backend-component-dod-approved-analytics-endpoint) |
| **REQ-004** | Hardware-Backed Key Management | P0 | [Frontend](#td-004-encryption-key-management-insecure) |
| **REQ-005** | Service Registry Real Implementation | P1 | [Backend](#td-005-service-registry-wired-to-mocks-only) |
| **REQ-006** | Real Authentication Flow (IdP Integration) | P1 | [Backend](#td-006-no-real-authentication-flow) |
| **REQ-007** | Role-Based Access Control | P1 | [Frontend](#td-007-frontend-component-no-role-based-access-control--client-enforcement) + [Backend](#td-007-backend-component-no-role-based-access-control--server-enforcement) |
| **REQ-008** | Server-Side Audit Logging | P1 | [Frontend](#td-008-frontend-component-no-audit-logging--local-persistence) + [Backend](#td-008-backend-component-no-audit-logging--server-side-ingestion) |
| **REQ-009** | Encrypted Sync Queue Payloads | P1 | [Frontend](#td-009-sync-queue-payloads-unencrypted) |
| ~~**REQ-010**~~ | ~~`console.log` Instead of SecureLogger~~ ✅ RESOLVED 2026-02-27 | P1 | [Frontend](#td-010-consolelog-used-instead-of-securelogger-in-stores) |

---

## Actionable Technical Debt (Frontend)

Items in this category represent genuine technical debt in the current React Native implementation.

| ID | Title | Priority | Owner |
|----|-------|----------|-------|
| **TD-011** | `storage.ts` Monolith Refactor (1,517 Lines) | P2 | [Frontend](#td-011-storagets-monolith-1517-lines) |
| **TD-012** | Abstract Mock Data out of Global Stores | P2 | [Frontend](#td-012-mock-data-hardcoded-in-stores) |
| **TD-013** | Implement Local Database Migration System | P2 | [Frontend](#td-013-no-database-migration-system) |
| **TD-014** | Expand Unit and Integration Test Coverage | P3 | [Frontend](#td-014-limited-test-coverage) |
| **TD-015** | Establish Component Performance Benchmarks | P3 | [Frontend](#td-015-no-performance-benchmarks) |
| **TD-016** | Consolidate Animation Libraries (`moti` Redundancy) | P3 | [Frontend](#td-016-moti-animation-library-redundancy) |
| **TD-017** | Implement Per-Screen Error Boundaries | P3 | [Frontend](#td-017-no-per-screen-error-boundaries) |
| **TD-018** | Implement Frame Processor for Receipt OCR | P2 | [Frontend](#td-018-implement-frame-processor-for-receipt-ocr) |
| **TD-019** | Link Scanned Receipts in Travel Claim Store | P2 | [Frontend](#td-019-link-scanned-receipts-in-travel-claim-store) |
| **TD-020** | Hydrate Leave Balance from User Store | P3 | [Frontend](#td-020-hydrate-leave-balance-from-user-store) |
| **TD-021** | Sync Local Attendance in Career Events Store | P3 | [Frontend](#td-021-sync-local-attendance-in-career-events-store) |

---

## Priority Definitions

| Priority | Definition | Timeline |
|----------|-----------|----------|
| **P0** | Blocks production deployment or creates security/compliance risk | Before any ATO submission |
| **P1** | Required before connecting to CUI/PII Navy APIs | Before API integration phase |
| **P2** | Should fix for code quality and maintainability | During next refactor cycle |
| **P3** | Nice to have, no immediate risk | As capacity allows |


---

## Actionable Frontend Debt Details

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

### TD-018: Implement Frame Processor for Receipt OCR

**Files:** [utils/receiptOCR.ts](../utils/receiptOCR.ts)

Vision Camera Frame Processor logic is currently stubbed out.

**Frontend Remediation:**
- Implement `react-native-vision-camera` frame processors to parse text from receipt images.
- Map extracted text to `amount`, `merchant`, and `date` fields.

---

### TD-019: Link Scanned Receipts in Travel Claim Store

**Files:** [store/useTravelClaimStore.ts](../store/useTravelClaimStore.ts)

The expense data structure relies on a placeholder rather than linking to actual persisted receipts.

**Frontend Remediation:**
- Connect the `ReceiptScannerWidget` from Phase 3 directly to the Travel Claim expenses array.

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

---

### TD-020: Hydrate Leave Balance from User Store

**Files:** [components/pcs/widgets/LeaveImpactWidget.tsx](../components/pcs/widgets/LeaveImpactWidget.tsx)

The `LeaveImpactWidget` displays a static mock leave balance.

**Frontend Remediation:**
- Pull actual leave balance directly from the `useUserStore`.

---

### TD-021: Sync Local Attendance in Career Events Store

**Files:** [app/(tabs)/(calendar)/calendar.tsx](../app/(tabs)/(calendar)/calendar.tsx)

Local attendance status toggles are not persisting their state locally.

**Frontend Remediation:**
- Update local attendance status within the `useCareerEvents` store upon toggle.


---

## Deferred Backend/Security Requirements Details

>
> **Scope:** Issues requiring server infrastructure, a live identity provider, or a live API. These items cannot be resolved within the React Native client alone.
> Frontend components of shared items are tracked in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md).
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

## P1 — Required Before API Integration

All backend technical debt is at P1 or higher — none of it can be deferred past the API integration phase.

---

### TD-005: Service Registry Wired to Mocks Only

**Client files:** [services/api/serviceRegistry.ts](../services/api/serviceRegistry.ts), all `mock*Service.ts` files

All 6 services (`assignment`, `career`, `user`, `pcs`, `inbox`, `leave`) resolve to mock implementations. Interface contracts exist but no real server-backed implementations.

**Frontend Component:** Adding `IS_MOCK_MODE` environment flag, creating `real*Service.ts` stubs that call the `HttpClient`, and wiring `serviceRegistry.ts` to resolve by flag — tracked in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md).

**Backend Remediation:**
- Stand up API server at `https://api.dev.mycompass.navy.mil` with endpoints matching the service interfaces
- Each interface in `services/api/interfaces/` defines the contract the server must fulfill
- Endpoints required per service:
  - **assignment**: `GET /assignments`, `GET /assignments/:id`, `PUT /assignments/:id`
  - **career**: `GET /career/timeline`, `GET /career/billets`
  - **user**: `GET /users/me`, `PUT /users/me`
  - **pcs**: `GET /pcs/orders`, `POST /pcs/orders`, `PUT /pcs/orders/:id`
  - **inbox**: `GET /messages`, `POST /messages/:id/read`
  - **leave**: `GET /leave/requests`, `POST /leave/requests`, `PUT /leave/requests/:id`
- See [API_INTEGRATION_ROADMAP.md](API_INTEGRATION_ROADMAP.md) for the full mock-to-real transition plan

---

### TD-006: No Real Authentication Flow

**Client files:** [config/auth.ts](../config/auth.ts), [lib/ctx.tsx](../lib/ctx.tsx)

Auth uses a `mockAccessToken`. No real Okta OIDC flow is implemented on either the client or server.

**Frontend Component:** Integrating `expo-auth-session`, implementing PKCE, handling token storage in `expo-secure-store`, wiring refresh rotation — tracked in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md).

**Backend Remediation:**
- Provision an Okta tenant registered with DoD identity services
- Configure OIDC discovery endpoint (`/.well-known/openid-configuration`)
- Establish CAC/PKI trust chain with DoD PKI root certificates
- Configure Okta policy: PKCE-required, CAC authentication factor, token TTLs aligned with STIG (15-min session)
- Integrate DoD ID verification at the identity provider level
- Provide token introspection endpoint for server-side JWT validation

---

### TD-007 (Backend Component): No Role-Based Access Control — Server Enforcement

> **Full item:** Frontend client enforcement is tracked in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md).

No authorization layer exists on the server. All authenticated users have implicit full access to all API endpoints.

**Backend Remediation:**
- Define roles in the identity provider: `Sailor`, `Supervisor`, `Admin`, `YN` (Yeoman)
- Issue role claims in Okta JWT (`roles` array in token payload)
- Implement RBAC middleware at the API gateway level — client-side guards are supplementary, not authoritative
- Approval chain enforcement: leave and PCS approval mutations must verify `Supervisor` or `Admin` role server-side before committing
- Resource scoping: Sailors may only read their own records; Supervisors may read their division's records

---

### TD-008 (Backend Component): No Audit Logging — Server-Side Ingestion

> **Full item:** Frontend local audit persistence is tracked in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md).

No server-side audit trail exists. Local client records from the `AuditLogService` (once built) have nowhere to sync.

**Backend Remediation:**
- Provision a tamper-resistant audit log ingestion endpoint (`POST /audit/events`)
- Accept the structured audit record schema: timestamp, hashed user ID, event type, resource affected, outcome
- Store in append-only, immutable storage inaccessible to application users
- Implement AU-6 review capability: searchable and exportable by security personnel
- Align retention policy with NIST AU-11 (3 years for Moderate baseline)
- Required for NIST AC-6, AU-2, AU-3, AU-6, AU-9

---

### TD-003 (Backend Component): DoD-Approved Analytics Endpoint

> **Frontend removal** of `@vercel/analytics` is tracked in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md) at P0.

If usage analytics are required post-ATO, a replacement solution must be hosted within approved DoD infrastructure.

**Backend Remediation:**
- Stand up a self-hosted analytics ingestion endpoint behind the Navy API gateway
- Ensure data does not leave DoD-controlled infrastructure
- Obtain a DoD-approved analytics platform or use internal telemetry tooling
- This is not required for ATO but must be addressed before any telemetry is re-enabled
