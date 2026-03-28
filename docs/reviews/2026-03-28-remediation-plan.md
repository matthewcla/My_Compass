# Remediation Plan — My Compass

**Date:** 2026-03-28
**Source:** Architecture Review, Security Audit, Compliance Gap Analysis (same date)
**Context:** Pre-ATO prototype with mock services and no live API connections

---

## Prototype Reality Check

This application is a **prototype**. The following are **expected and acceptable** at this stage:

- Mock authentication (no real Okta tenant exists yet)
- Disabled encryption (FIPS-validated crypto library not yet selected)
- No RBAC (no backend to issue role claims)
- No certificate pinning (no production server to pin against)
- No audit log ingestion (no backend endpoint)
- No real API integrations (all services are mocks)

These are not bugs — they are **planned future work** that requires backend infrastructure that doesn't exist yet. The review correctly flags them for ATO planning, but they are not actionable today.

**What IS actionable now:** Client-side code quality, pattern correctness, and laying groundwork so that when backend infrastructure arrives, the transition is clean.

---

## Phasing

| Phase | Name | Goal | When |
|-------|------|------|------|
| **0** | Quick Wins | Fix low-effort client-side issues that improve code quality now | Now |
| **1** | Foundation | Fix structural issues that will compound if left unaddressed | Before next major feature work |
| **2** | Pre-Integration | Prepare the client for real API connections | When backend work begins |
| **3** | ATO Blockers | Implement security controls required for Authority to Operate | Before ATO submission |

---

## Phase 0 — Quick Wins (Now)

Low-effort, client-only fixes. No dependencies. Improve code quality and prevent drift.

| # | Finding(s) | What to Do | Effort |
|---|-----------|------------|--------|
| 0.1 | ARCH-006, SEC-008, COMP-006, COMP-018 | **Replace all remaining `console.*` with SecureLogger.** Grep the entire codebase for `console.log`, `console.warn`, `console.error` outside of `utils/logger.ts`. Add ESLint `no-console` rule with SecureLogger exception. | S |
| 0.2 | COMP-010 | **Add `@security PII` annotations** to all PII fields in `types/schema.ts`, `types/pcs.ts`, and any other schema files missing them. | S |
| 0.3 | COMP-012, SEC-011 | **Remove unjustified permissions** from `app.json`: `RECORD_AUDIO` (Android) and `NSContactsUsageDescription` (iOS) if not used. | S |
| 0.4 | ARCH-012 | **Delete duplicate store file** `useBottomSheetStore 2.ts`. | S |
| 0.5 | ARCH-013 | **Consolidate UUID generation** into `utils/uuid.ts`. Use `crypto.randomUUID()` where available. | S |
| 0.6 | SEC-017 | **Mark mock PII data as fake.** Add header comments to mock service files clarifying data is synthetic. Use obviously fake patterns (e.g., `000-00-0000`). | S |
| 0.7 | ARCH-008 | **Fix migration runner** to read current schema version from `schema_version` table before running migrations. | S |
| 0.8 | ARCH-024 | **Guard auth config logging** behind `__DEV__` check in `ctx.tsx`. | S |
| 0.9 | COMP-011 | **Gate demo mode consent bypass** behind `__DEV__` flag so demo mode can't bypass the DoD banner in production builds. | S |
| 0.10 | COMP-014 | **Enable SQLite foreign keys** by adding `PRAGMA foreign_keys = ON` to `DatabaseManager.init()`. | S |
| 0.11 | ARCH-016 | **Move `@types/crypto-js`** to `devDependencies`. | S |
| 0.12 | SEC-007 | **Improve SecureLogger sanitization** — add recursive object sanitization and phone number regex pattern. | S |

**Estimated scope:** ~12 small tasks, each independently mergeable.

---

## Phase 1 — Foundation (Before Next Major Feature Work)

Structural improvements that prevent technical debt from compounding. Still client-only, no backend dependency.

| # | Finding(s) | What to Do | Effort |
|---|-----------|------------|--------|
| 1.1 | ARCH-005 | **Split `usePCSStore` monolith** (1,261 lines, 12+ concerns) into focused stores: `usePCSOrderStore`, `usePCSFinancialsStore`, `usePCSChecklistStore`, etc. | L |
| 1.2 | ARCH-009 | **Unify database schema management.** Make migrations the single source of truth — remove duplicate table creation in `storage.ts`. | M |
| 1.3 | ARCH-022 | **Decouple `useDemoStore`** from cross-store `require()` calls. Extract demo orchestration into `services/demoOrchestrator.ts`. | M |
| 1.4 | ARCH-007 | **Audit `storage.web.ts`** — determine if it's still used. If yes, implement missing PCS operations. If no, remove it. | M |
| 1.5 | ARCH-014 | **Fix store interface patterns** — split `useInboxStore` and `useCareerStore` into separate `State` and `Actions` interfaces per convention. | S |
| 1.6 | ARCH-021 | **Add selector hooks** to `useLeaveStore` and any other stores missing them. | S |
| 1.7 | ARCH-025 | **Audit persisted Zustand stores** for consistent `version`, `migrate`, and `partialize` configuration. | S |
| 1.8 | SEC-016 | **Add deep link parameter validation.** Validate `mycompass://` scheme parameters before routing. | S |
| 1.9 | COMP-013 | **Generate SBOM.** Run `npx @cyclonedx/cyclonedx-npm` and add `npm audit` to CI. This is a quick setup that pays dividends for ATO paperwork later. | S |

**Estimated scope:** 2-3 focused PRs. The PCS store split (1.1) is the biggest item.

---

## Phase 2 — Pre-Integration (When Backend Work Begins)

Prepare the client so that when real APIs and auth infrastructure arrive, the transition is straightforward. Some items require backend coordination.

| # | Finding(s) | What to Do | Effort | Depends On |
|---|-----------|------------|--------|-----------|
| 2.1 | COMP-002, SEC-001, ARCH-001 | **Replace `crypto-js` with FIPS-validated crypto.** Integrate Web Crypto API (web) and `react-native-quick-crypto` (native). Remove `crypto-js` and `@types/crypto-js`. | M | Nothing — do this first |
| 2.2 | COMP-001, ARCH-001, SEC-003 | **Re-enable encryption.** Uncomment and rewire `encryptData`/`decryptData` in `lib/encryption.ts` using the new FIPS crypto from 2.1. Write migration to encrypt existing plaintext SQLite data. | M | 2.1 |
| 2.3 | COMP-003, ARCH-002, SEC-005 | **Fix key management.** Derive encryption key via PBKDF2 from a user-held credential. Store in `expo-secure-store`. Remove env var and localStorage fallback chains. For prototype, a user-chosen PIN is acceptable as the key source until CAC/PKI is available. | L | 2.1, 2.2 |
| 2.4 | COMP-009, ARCH-004, SEC-020 | **Encrypt sync queue payloads.** Either encrypt before writing to AsyncStorage or migrate queue storage to encrypted SQLite. | M | 2.2 |
| 2.5 | COMP-004, ARCH-020 | **Build client-side audit logging.** Create `AuditLogService` with append-only encrypted SQLite table. Log auth events, data mutations, and access denials. Server sync can come later. | M | 2.2 |
| 2.6 | ARCH-010 | **Wire `httpClient` auth token provider.** Configure the singleton with a `getAuthToken` callback that retrieves from `expo-secure-store`. | S | Nothing |
| 2.7 | SEC-006 | **Remove dev settings from production builds.** Set `enableDevSettings: false` in `app.json` for non-development profiles, or guard with `__DEV__`. | S | Nothing |
| 2.8 | COMP-016 | **Secure sign-out data deletion.** Clear all user data from SQLite, AsyncStorage, and filesystem on sign-out. Ensure no PII remains after session ends. | M | Nothing |
| 2.9 | SEC-013 | **Exclude databases from platform backup.** Set `NSURLIsExcludedFromBackupKey` (iOS) and `android:allowBackup="false"` or exclusion rules (Android). | S | Nothing |
| 2.10 | SEC-018 | **Prevent screenshots on PII screens.** Add `expo-screen-capture` and use `usePreventScreenCapture` on screens showing full SSN, financial data, etc. | S | Nothing |
| 2.11 | COMP-017, SEC-004 | **Fix web token storage.** Migrate from `localStorage` to encrypted `IndexedDB` via Web Crypto API. | M | 2.1 |

**Estimated scope:** This is the biggest phase. Items 2.1-2.4 form a dependency chain (crypto first, then encryption, then key management, then encrypted queue). Items 2.6-2.10 are independent and can be done in parallel.

---

## Phase 3 — ATO Blockers (Before ATO Submission)

These require backend infrastructure and organizational coordination. They cannot be completed client-side alone.

| # | Finding(s) | What to Do | Effort | Blocked By |
|---|-----------|------------|--------|-----------|
| 3.1 | COMP-007, ARCH-003, SEC-002 | **Real authentication.** Integrate `expo-auth-session` with PKCE against a real Okta tenant with DoD PKI trust chain. Implement token validation, refresh rotation, and session invalidation. | L | Okta tenant provisioned with DoD PKI |
| 3.2 | SEC-014 | **Token expiration and refresh.** Validate JWT `exp` on every API call. Implement refresh token rotation. Hard sign-out on refresh failure. Ensure access token TTL ≤ 15 min server-side. | M | 3.1 (real auth) |
| 3.3 | COMP-005, ARCH-018 | **Role-Based Access Control.** Add role field to `UserSchema`, implement route-level guards from JWT role claims, add action-level permission checks in service layer. | L | 3.1 (JWT with role claims) |
| 3.4 | COMP-008, SEC-009 | **Certificate pinning.** Pin against Navy API server certificates in `HttpClient`. Include backup pin for rotation. | S | DoD TLS certificate available |
| 3.5 | COMP-004 (server sync) | **Audit log server ingestion.** Add background sync of local audit records to server endpoint. Implement integrity verification on the server side. | M | Backend audit endpoint |
| 3.6 | ARCH-023 | **Conflict resolution for offline mutations.** Define per-entity conflict policies. Implement `lastModified` comparison and user-facing conflict resolution UI. | L | Real API with conflict detection |
| 3.7 | SEC-010 | **Device integrity checks.** Implement jailbreak/root detection. Warn or restrict functionality on compromised devices per DISA SRG. | M | Policy decision on enforcement level |
| 3.8 | COMP-015 | **Update export compliance.** Set `usesNonExemptEncryption: true` in `app.json` and file Apple/BIS export compliance documentation once encryption is enabled. | S | 2.1, 2.2 complete |
| 3.9 | SEC-019 | **Organizational Apple Developer account.** Move production build signing from personal email to organizational account. | S | Org account provisioned |

---

## Summary

| Phase | Items | Effort Profile | Dependency |
|-------|-------|---------------|------------|
| **0 — Quick Wins** | 12 | All Small | None — do now |
| **1 — Foundation** | 9 | 1L, 2M, 6S | None — before next feature |
| **2 — Pre-Integration** | 11 | 1L, 6M, 4S | Client-side only (mostly) |
| **3 — ATO Blockers** | 9 | 3L, 3M, 3S | Backend infrastructure required |

**Total: 41 actionable items** (some review findings map to the same remediation task, which is why 65 findings collapse to 41 items).

### What's NOT in this plan

The following findings are **informational only** — they describe the current prototype state and don't require action until the context changes:

- Mock services returning synthetic data (expected — no APIs exist)
- No real API connections (expected — Phase 2/3 transition handles this)
- Backend-only controls like server-side process isolation (SC-39) — not a client concern
- SQL interpolation in migrations (SEC-015) — low risk since migrations run trusted DDL, not user input

---

## Reading This Plan

- **Phases are sequential** — complete Phase 0 before Phase 1, etc.
- **Items within a phase can be parallelized** unless a dependency is noted.
- **Finding cross-references** let you trace back to the full analysis in the review reports.
- **This plan will need updating** as backend infrastructure becomes available — Phase 3 items will get specific timelines then.
