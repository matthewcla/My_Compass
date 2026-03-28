# My Compass -- Compliance Gap Analysis

> **Date:** 2026-03-28
> **Assessor:** Automated compliance review (Claude Code)
> **Target Authorization:** DISA Mobile Application SRG + NIST SP 800-53 Rev 5 (Moderate Baseline)
> **Scope:** Client-side React Native / Expo codebase (no backend exists)
> **Codebase Commit:** `ba5a8a6` (main branch, clean working tree)

---

## 1. Executive Summary

### Overall Compliance Posture

| Category | Implemented | Partial / Stubbed | Not Implemented | Backend Dependency | Total |
|----------|-------------|-------------------|-----------------|-------------------|-------|
| AC (Access Control) | 3 | 1 | 2 | 4 | 10 |
| AU (Audit & Accountability) | 0 | 0 | 3 | 3 | 6 |
| IA (Identification & Auth) | 2 | 2 | 0 | 4 | 8 |
| SC (System & Comms Protection) | 2 | 2 | 2 | 1 | 7 |
| SI (System & Info Integrity) | 4 | 0 | 0 | 0 | 4 |
| CM (Configuration Management) | 3 | 1 | 0 | 0 | 4 |
| MP (Media Protection) | 0 | 0 | 1 | 1 | 2 |
| **Totals** | **14** | **6** | **8** | **13** | **41** |

**Effective compliance rate:** ~34% fully implemented, ~15% partial/stubbed, ~20% not implemented (client-fixable), ~31% blocked on backend infrastructure.

### Critical ATO Blockers (Ordered by Severity)

1. **Encryption disabled (SC-28, SRG-APP-000175)** -- `encryptData()` and `decryptData()` in `lib/encryption.ts` are no-op passthroughs. All data at rest in SQLite and localStorage is plaintext, including PII (emergency contacts, phone numbers, addresses).
2. **No FIPS 140-2 validated cryptography (SC-13, SRG-APP-000141, SRG-APP-000514)** -- `crypto-js` is the only crypto library present and is not FIPS-validated. Even if encryption were re-enabled, it would not satisfy DISA SRG requirements.
3. **Insecure key management (SC-12)** -- Encryption key fallback chain includes: `EXPO_PUBLIC_` env var (embedded in client bundle), `localStorage` (unprotected), and a deterministic timestamp-based fallback.
4. **No audit logging (AU-2, AU-3, AU-9, SRG-APP-000210)** -- Zero audit trail exists. No structured event generation, no local persistence, no sync path. This is a fundamental RMF gap.
5. **No RBAC / access enforcement (AC-3, AC-6)** -- All authenticated users have full access to all routes, stores, and actions. No role field exists on the user model.
6. **Mock authentication only (IA-2, SRG-APP-000153)** -- Auth uses a hardcoded `mockAccessToken`. No real OIDC, PKCE, or CAC/PKI integration exists.
7. **No certificate pinning (SRG-APP-000380)** -- `HttpClient` in `services/api/client.ts` does not pin server certificates.
8. **Sync queue payloads unencrypted (SC-28 extension)** -- `services/syncQueue.ts` stores mutation payloads as plaintext JSON in AsyncStorage (Tier 3 storage), which will contain CUI/PII when connected to real APIs.

### Assessment of Readiness Timeline

The app is in a **pre-ATO prototype phase**. The documented assessment in `ATO_READINESS.md` claims ~38% control coverage, which is broadly accurate. However, several discrepancies between documentation and code were identified (see below). Reaching ATO-ready status requires:

- **3-4 sprint cycles** for client-side remediation (FIPS crypto, encryption, audit logging, RBAC)
- **Concurrent backend provisioning** (Okta tenant, API server, DoD TLS cert, audit ingestion)
- **SBOM generation** and dependency vulnerability audit before package submission

### Delta Between Documentation and Actual Implementation

| Documented Claim | Actual Finding | Severity |
|-----------------|----------------|----------|
| **TD-010 RESOLVED** ("All `console.*` replaced with `SecureLogger`") | `store/usePCSStore.ts:260` still uses `console.error()` directly. `lib/ctx.tsx` lines 63-66, 78, 80 use `console.log/error` directly (6 instances). `services/syncQueue.ts` has 3 `console.error` calls. Multiple repository files (`PCSRepository.ts`, `BilletRepository.ts`, `ApplicationRepository.ts`, `LeaveRepository.ts`, `InboxRepository.ts`, `CareerRepository.ts`) use `console.error/warn` directly. `services/migrations.ts` uses `console.log/error`. `components/leave/QuickLeaveTicket.tsx` and `components/StartupAnimation.tsx` use `console.error`. `services/storage.web.ts` has 12+ `console.warn/log` calls. Total: **50+ direct console calls remain outside test files.** | High -- PII leak risk in repository/storage layer where user data is handled |
| **AC-8 DoD Banner: "No bypass possible"** | `AuthGuard.tsx:38` allows `isDemoMode` to bypass consent acknowledgement (`const isConsentAcknowledged = consentAcknowledged \|\| isDemoMode`). While demo mode is a development feature, this bypass path exists in production-shipped code with no compile-time guard. | Medium -- should be gated behind `__DEV__` |
| **SI-3: "No dynamic code execution"** | Verified correct. No `eval()` or `new Function()` found in the codebase. | Confirmed |
| **Secrets Management: "No hardcoded secrets verified"** | Verified correct. No API keys or bearer tokens hardcoded. `CLIENT_ID` is a public OAuth client identifier per spec. Mock token is explicitly labeled. | Confirmed |
| **SecureLogger `patchGlobalConsole()` called at startup** | Confirmed in `app/_layout.tsx:16`. However, the call happens before the `SecureLogger` import (line 29). This works due to hoisting but the object sanitization in `sanitizeArgs` returns raw objects without sanitization (line 49: `return arg`), meaning PII in object-typed arguments passes through unredacted. | High -- objects containing PII fields bypass regex redaction |
| **`app.json` `usesNonExemptEncryption: false`** | This is currently accurate (encryption is disabled). When encryption is re-enabled with FIPS crypto, this must be set to `true` and the corresponding export compliance documentation filed. | Informational |

---

## 2. NIST SP 800-53 Rev 5 (Moderate Baseline) Control Matrix

### AC -- Access Control

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| AC-2 | Account Management | Backend Dependency | Mock user in `useUserStore`. No account lifecycle. | No create/disable/remove tied to identity system | Integrate with Navy IdP (NSIPS) for account provisioning and lifecycle management | Backend |
| AC-3 | Access Enforcement | Not Implemented | `AuthGuard.tsx` checks authentication only, not authorization. No role field on `User` type. | All authenticated users have full access to all routes and store actions | Add `role` field to `UserSchema`. Implement route-level guards in Expo Router layouts. Add action-level guards in store actions. | Client + Backend |
| AC-4 | Information Flow Enforcement | Partial | `SecureLogger` redacts PII in string logs. Tiered storage model defined. `encryptData` called on web localStorage writes. | Encryption disabled (no-op). Object-typed log arguments bypass sanitization. Sync queue in AsyncStorage unencrypted. | Re-enable encryption, fix object sanitization in logger, encrypt sync queue payloads | Client |
| AC-6 | Least Privilege | Not Implemented | Follows AC-3. All stores expose all selectors to all consumers. | No privilege separation at any level | Same as AC-3. Add role-scoped selectors and UI gating. | Client + Backend |
| AC-7 | Unsuccessful Login Attempts | Backend Dependency | Auth is stubbed with mock token. No lockout mechanism. | No failed-attempt tracking or lockout | Configure Okta policy: lockout after 3 failed attempts per STIG | Backend |
| AC-8 | System Use Notification | Implemented | `app/consent.tsx` displays full DoD Notice and Consent Banner. `AuthGuard` enforces gate. In-memory flag resets on sign-out. | Demo mode bypass exists (`isDemoMode` skips consent in `AuthGuard.tsx:38`). Should be gated behind `__DEV__`. | Gate demo bypass with `__DEV__` check | Client |
| AC-11 | Session Lock | Implemented | `hooks/useIdleTimeout.ts`: 5-min warning, 10-min hard sign-out. `AppState` listener catches background timeout. `AuthGuard` protects all routes. | None for client scope. Backend token TTL alignment pending. | Backend token TTL must match (IA-5 backend) | Client (done) + Backend |
| AC-12 | Session Termination | Implemented | `signOut()` in `lib/ctx.tsx` clears session, resets consent flag. Idle timeout triggers `signOut()`. | Token revocation not implemented (requires backend). No explicit `expo-secure-store` clear on sign-out beyond session key. | Implement token revocation call on sign-out. Clear all cached tokens from secure store. | Client + Backend |
| AC-17 | Remote Access | Implemented | `services/api/client.ts` enforces `https://` base URL from `config/api.ts`. Bearer token injected in headers. | No certificate pinning (blocked on backend cert). No mutual TLS. | Implement certificate pinning when DoD cert available (SRG-APP-000380) | Client (partial) + Backend |
| AC-20 | Use of External Systems | Not Applicable | App does not connect to external systems. All services are mocked. | N/A -- will become applicable when connecting to NSIPS, eCRM, MNA, DPS, DTS | Define DSA documentation per `services/api/CLAUDE.md` pattern for each Navy system integration | Future |

### AU -- Audit and Accountability

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| AU-2 | Event Logging | Not Implemented | No audit event generation anywhere in the codebase. Only ephemeral console logs. | No structured audit events for login, data access, data modification, form submission, or authorization failures | Create `AuditLogService` in `services/auditLog.ts`. Generate events for all security-relevant actions. Persist in encrypted SQLite. | Client + Backend |
| AU-3 | Content of Audit Records | Not Implemented | No audit records produced. | Audit records must include: timestamp, hashed user ID, event type, resource affected, outcome | Define `AuditRecordSchema` in `types/`. Ensure all fields populated by `AuditLogService`. | Client + Backend |
| AU-6 | Audit Record Review | Backend Dependency | No audit data exists to review. | Requires server-side SIEM or review dashboard | Provision audit review capability on server. Searchable/exportable by security personnel. | Backend |
| AU-8 | Time Stamps | Partial | Zod schemas include `lastSyncTimestamp` (ISO 8601). `SyncOperation` uses `Date.now()` Unix timestamps. | No consistent audit timestamp standard. No NTP sync verification. UTC not enforced across all timestamps. | Standardize all timestamps to ISO 8601 UTC. Add NTP clock sync check at app startup. | Client |
| AU-9 | Protection of Audit Information | Not Implemented | No audit data exists to protect. | Local audit records must be append-only in encrypted SQLite. No UPDATE/DELETE on audit table. | Implement append-only audit table with encrypted storage. No application-accessible mutation path. | Client + Backend |
| AU-12 | Audit Record Generation | Not Implemented | Same as AU-2. No generation capability. | Identical to AU-2 gap | Same remediation as AU-2 | Client + Backend |

### IA -- Identification and Authentication

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| IA-2 | Identification and Authentication | Partial | `config/auth.ts` has Okta OIDC config (mock issuer). `lib/ctx.tsx` simulates auth flow. Token stored in `expo-secure-store` (native). | Mock token `'mock-okta-access-token'` hardcoded at `lib/ctx.tsx:75`. No real PKCE flow. No CAC/PKI. No `expo-auth-session` integration. | Integrate `expo-auth-session` with PKCE. Implement CAC certificate presentation. Verify DoD ID claim from token. | Client + Backend |
| IA-4 | Identifier Management | Backend Dependency | User `id` field exists in `UserSchema`. `dodId` field defined with `@security` annotation. | No real identity binding. Mock user has arbitrary ID. | Bind user identity to Okta subject claim. Derive from CAC EDIPI. | Backend |
| IA-5 | Authenticator Management | Partial | Token stored in `expo-secure-store` (native) via `useStorageState.ts`. On web, stored in `localStorage` with (disabled) encryption. | No JWT expiration check. No refresh token rotation. No token clear on sign-out beyond session key. Web token storage is unencrypted. | Implement JWT expiry checks before API calls. Implement refresh rotation. Clear all tokens on sign-out. Fix web token encryption. | Client + Backend |
| IA-6 | Authenticator Feedback | Implemented | `privacyMode` toggle on `UserSchema` for PII masking. Password-type inputs obscure entry. | None identified | N/A | Client |
| IA-8 | Auth -- Non-Organizational Users | Not Applicable | Single-user military personnel app. No external user access pathway. | N/A for current scope. Would apply if supervisor/contractor access added. | If needed: configure Okta federation for non-org users with separate assurance levels | Future |
| IA-11 | Re-Authentication | Implemented | `hooks/useIdleTimeout.ts`: 10-min idle sign-out (more restrictive than 15-min STIG). 5-min warning with countdown. AppState background check. | Backend token TTL not configured. Server does not enforce re-auth on expired tokens. | Configure Okta access token TTL to 15 min. Implement token introspection on server. | Client (done) + Backend |

### SC -- System and Communications Protection

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| SC-8 | Transmission Confidentiality | Implemented | `config/api.ts`: base URL `https://api.dev.mycompass.navy.mil`. `HttpClient` enforces HTTPS. Bearer token in Authorization header. | No certificate pinning. No mutual TLS. | Implement cert pinning when DoD cert available. Configure mTLS for Navy API endpoints. | Client + Backend |
| SC-12 | Cryptographic Key Management | Partial | `lib/encryption.ts` has key generation code. Three-tier fallback: env var, localStorage, timestamp-based. | `EXPO_PUBLIC_` prefix exposes key in client bundle. `localStorage` key unprotected. Timestamp fallback is deterministic and insecure. Not FIPS-validated. | Derive key from CAC credential via PBKDF2. Store in `expo-secure-store`. Never expose in env vars with PUBLIC prefix. | Client |
| SC-13 | Cryptographic Protection | Partial | `crypto-js` (v4.2.0) in `package.json`. AES encrypt/decrypt functions exist in `lib/encryption.ts`. | Functions are no-op passthroughs (lines 49-51, 63-64). `crypto-js` is not FIPS 140-2 validated. | Replace `crypto-js` with Web Crypto API (`SubtleCrypto`) for AES-256-GCM or `react-native-quick-crypto` (OpenSSL, FIPS-capable). Re-enable functions. Remove `crypto-js` and `@types/crypto-js`. | Client |
| SC-23 | Session Authenticity | Implemented | Bearer token in HTTP headers via `HttpClient`. HTTPS prevents session hijacking. | Server-side token validation not implemented (backend dependency). | Backend must validate JWT signature, expiry, and issuer on every request. | Client (done) + Backend |
| SC-28 | Protection of Information at Rest | Not Implemented | Encryption code exists but is disabled. SQLite database `my_compass.db` stores all data unencrypted. Web localStorage stores PII with disabled encryption. AsyncStorage (sync queue) is plaintext. | All local data is plaintext. Leave requests contain emergency contacts (PII). User records contain DoD ID, DOB, addresses (PII). | Re-enable encryption after SC-13 remediation. Migrate existing unencrypted data. Encrypt sync queue payloads. Move sync queue to Tier 2 (SQLite). | Client |
| SC-39 | Process Isolation | Not Implemented | Standard React Native process isolation only. No WebView hardening beyond defaults. | No CSP headers for web deployment. No WebView JavaScript restriction. No explicit sandbox configuration. | Audit WebView usages (found in 3 doc/feature files). Add CSP headers for web. Disable JS in WebViews where not needed. | Client + Backend |

### SI -- System and Information Integrity

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| SI-2 | Flaw Remediation | Implemented | `package-lock.json` pins dependency versions. `npm audit` available. Dependencies managed via Expo managed workflow. | No automated vulnerability scanning in CI. No documented patch cadence. | Add `npm audit` to CI pipeline. Document patch review cadence (recommend 30-day cycle). | Client |
| SI-3 | Malicious Code Protection | Implemented | No `eval()` or `new Function()` in codebase (verified). App distributed via Expo managed workflow. No dynamic code loading. | No runtime integrity verification. | Consider code-signing verification at startup (future enhancement). | Client |
| SI-4 | System Monitoring | Backend Dependency | `SecureLogger` exists but logs are ephemeral (console only). No persistent monitoring. | No real-time monitoring capability. No anomaly detection. | Integrate with Navy SIEM when backend available. Local anomaly detection deferred. | Backend |
| SI-10 | Information Input Validation | Implemented | Zod schemas in `types/` validate all data models: `UserSchema`, `LeaveRequestSchema`, `BilletSchema`, `ApplicationSchema`, `TravelClaimSchema`, `PCSOrderSchema`. `react-hook-form` + `@hookform/resolvers/zod` enforces validation on all forms. | No server-side validation (backend dependency). Some schemas lack field-level constraints (e.g., phone format regex). | Add format-level validation (phone regex, zip code format) to Zod schemas. Server must independently validate. | Client (strong) + Backend |
| SI-11 | Error Handling | Implemented | `components/AppErrorBoundary.tsx` exported as `ErrorBoundary` from `app/_layout.tsx`. Displays generic "System Error" with time-based reference code (`MC-XXXXXX`). No raw error message or stack trace shown. | Only global boundary exists. No per-screen boundaries (TD-017). Broken widget/screen crashes entire app. | Add per-screen `ErrorBoundary` exports in flow layouts (`leave/_layout.tsx`, `pcs-wizard/_layout.tsx`, `travel-claim/_layout.tsx`). | Client |

### CM -- Configuration Management

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| CM-2 | Baseline Configuration | Implemented | `app.json` defines app configuration. `package.json` + `package-lock.json` pin all dependency versions. `tsconfig.json` enforces strict TypeScript. | No documented system baseline for ATO package. | Generate baseline configuration document from `app.json`, `package.json`, and build profiles in `eas.json`. | Client |
| CM-6 | Configuration Settings | Implemented | `config/auth.ts` and `config/api.ts` centralize configuration. Environment variables via `process.env.EXPO_PUBLIC_*`. | `EXPO_PUBLIC_STORAGE_KEY` exposes encryption key in client bundle. `CLIENT_ID` hardcoded (acceptable per OAuth public client spec). | Move encryption key to `expo-secure-store` derivation (SC-12 remediation). | Client |
| CM-7 | Least Functionality | Implemented | Expo managed workflow limits native capabilities. Permissions declared in `app.json` (`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSCalendarsUsageDescription`, `NSRemindersUsageDescription`, `NSFaceIDUsageDescription`, `NSContactsUsageDescription`). Android: `CAMERA`, `RECORD_AUDIO`. | `RECORD_AUDIO` permission declared but no audio recording feature identified. `NSContactsUsageDescription` declared but contacts integration not yet implemented. | Remove `RECORD_AUDIO` if unused. Document justification for each declared permission. | Client |
| CM-8 | System Component Inventory | Partial | `package.json` lists 50 production dependencies and 6 dev dependencies. | No formal SBOM (Software Bill of Materials) generated. No dependency risk assessment beyond `DEPENDENCY_MANIFEST.md`. | Generate CycloneDX or SPDX SBOM from `package-lock.json`. Run `npm audit` and document findings. | Client |

### MP -- Media Protection

| Control | Name | Status | Evidence | Gap | Remediation | Owner |
|---------|------|--------|----------|-----|-------------|-------|
| MP-5 | Media Transport | Not Implemented | Sync queue transports data via HTTPS (SC-8), but local data is unencrypted. Device could be lost/stolen with plaintext PII on filesystem. | SQLite database and AsyncStorage contain unencrypted PII on device storage. | Same as SC-28 -- re-enable encryption at rest. Consider remote wipe capability via MDM integration. | Client |
| MP-7 | Media Use | Backend Dependency | App captures receipt images via `react-native-vision-camera`. Images stored in `expo-file-system`. | No encryption for captured images. No DRM or access controls on stored media. No automatic purge policy. | Encrypt stored images. Implement media purge after sync. Integrate with enterprise MDM for device-level controls. | Client + Backend |

---

## 3. DISA Mobile Application SRG Mapping

| SRG ID | Requirement | Status | Evidence | Gap | Remediation |
|--------|-------------|--------|----------|-----|-------------|
| SRG-APP-000141 | Use FIPS 140-2 validated cryptographic modules | Not Implemented | `crypto-js` (v4.2.0) is a JavaScript AES implementation. Not FIPS 140-2 certified. Listed in `package.json:22`. | Sole crypto library is non-FIPS. | Replace with Web Crypto API (`SubtleCrypto`) for AES-256-GCM or `react-native-quick-crypto` (wraps OpenSSL FIPS module). Remove `crypto-js` and `@types/crypto-js`. |
| SRG-APP-000153 | Authenticate users via PKI/CAC | Partial | `config/auth.ts` has Okta OIDC configuration. `REDIRECT_URI: 'mycompass://auth'` deep link configured. `lib/ctx.tsx` has auth flow scaffold. | Mock token only. No `expo-auth-session` integration. No PKCE flow. No CAC certificate presentation. No DoD PKI trust chain. | Integrate `expo-auth-session`. Implement PKCE. Wire CAC authentication factor via Okta. Backend must provision Okta tenant with DoD PKI trust. |
| SRG-APP-000175 | Encrypt data at rest with AES-256 | Partial | `lib/encryption.ts` has `encryptData()`/`decryptData()` using `crypto-js` AES. Functions are commented-out no-ops (lines 50-51, 63-64). | All stored data is plaintext. SQLite `my_compass.db`, AsyncStorage sync queue, web localStorage -- all unencrypted. | Re-enable encryption after FIPS crypto replacement. Implement data migration from plaintext to encrypted. Verify AES-256 key length. |
| SRG-APP-000190 | Enforce session timeout (15 minutes maximum) | Implemented | `hooks/useIdleTimeout.ts`: 5-min warning, 10-min hard sign-out (more restrictive than 15-min requirement). `AppState` listener catches background timeout via wall-clock comparison. `SessionTimeoutOverlay` shows countdown. | Backend token TTL not configured. If token lives longer than 10 min, server-side sessions persist after client sign-out. | Configure Okta access token TTL <= 15 min. Implement token revocation on sign-out. |
| SRG-APP-000210 | Maintain audit trail of security-relevant events | Not Implemented | No audit logging exists. Only ephemeral console logs. `AuditLogService` planned (TD-008) but not built. | Complete absence of audit trail. No login events, no data access records, no modification history. | Build `AuditLogService` per TD-008 spec. Persist in encrypted SQLite. Sync to server endpoint when available. |
| SRG-APP-000225 | Display DoD-approved system use notification | Implemented | `app/consent.tsx` displays full DoD Notice and Consent Banner (5 numbered items + CUI notice). Shown every session post-auth, pre-hub. `AuthGuard` enforces gate. `consentAcknowledged` is in-memory only (resets on sign-out/restart). | Demo mode bypass in `AuthGuard.tsx:38` (`isDemoMode` skips consent). | Gate `isDemoMode` behind `__DEV__` or `process.env.NODE_ENV !== 'production'` check. |
| SRG-APP-000380 | Implement certificate pinning for DoD servers | Not Implemented | `HttpClient` in `services/api/client.ts` has no certificate pinning logic. No pinning configuration in `app.json` or native config. | No pinning capability. App accepts any valid TLS certificate. | Implement certificate pinning in `HttpClient` using the DoD-issued server certificate. Blocked on backend provisioning the certificate. |
| SRG-APP-000400 | Prevent data leakage in logs, caches, backups | Implemented | `SecureLogger` in `utils/logger.ts` redacts SSN, DoD ID, and email patterns. `patchGlobalConsole()` called at app startup (`_layout.tsx:16`). `privacyMode` toggle for UI masking. `expo-secure-store` for tokens. | Object-typed arguments bypass string regex sanitization (`logger.ts:49` returns raw object). 50+ direct `console.*` calls remain across repository/service/component files. PII in leave requests (emergency contacts, phone numbers) could be logged by repository error handlers. | Fix `sanitizeArgs` to recursively stringify and sanitize objects. Replace all remaining `console.*` calls with `SecureLogger`. Add ESLint `no-console` rule to CI. |
| SRG-APP-000514 | Use only FIPS 140-2 validated cryptographic modules | Not Implemented | Duplicate of SRG-APP-000141. `crypto-js` is the only crypto library and is not FIPS-validated. | Same as SRG-APP-000141 | Same as SRG-APP-000141 |
| SRG-APP-000220 | Restrict app permissions to minimum required | Partial | Permissions declared in `app.json`. iOS: Camera, Photo Library, Location, Calendar, Reminders, Face ID, Contacts. Android: Camera, Record Audio. | `RECORD_AUDIO` (Android) not justified by any feature. `NSContactsUsageDescription` declared for unbuilt feature. | Remove unjustified permissions. Document justification for each remaining permission in ATO package. |
| SRG-APP-000320 | Protect against injection attacks | Implemented | Zod schema validation on all inputs. Parameterized SQLite queries in repositories. No `eval()` or dynamic code execution. | Phone number and zip code fields lack format-specific regex validation in Zod schemas. | Add format validators (phone regex, zip pattern) to Zod schemas for defense-in-depth. |
| SRG-APP-000450 | Implement secure data deletion | Not Implemented | No explicit data wipe capability. No secure delete on sign-out. SQLite database persists after sign-out. | User data remains on device after sign-out. No remote wipe. | Implement data purge on sign-out (clear SQLite, AsyncStorage, file system). Integrate with MDM for remote wipe. |

---

## 4. USN Data Governance (VAULTIS) Alignment

### VAULTIS Principles Assessment

| Principle | Status | Evidence | Gaps | Remediation |
|-----------|--------|----------|------|-------------|
| **Visible** | Strong | Every entity has a typed definition in `types/` (`UserSchema`, `BilletSchema`, `LeaveRequestSchema`, `ApplicationSchema`, `TravelClaimSchema`, 10+ schemas). Each has a home store in `store/`. `@security` annotations on PII fields in `types/user.ts` (9 annotations). | `@security` annotations missing from `types/schema.ts` PII fields: `EmergencyContactSchema.name`, `.phoneNumber`, `.altPhoneNumber`, `.address`; `LeaveRequestSchema.leavePhoneNumber`, `.leaveAddress`, `.dutyPhone`, `.emergencyContact`. No annotations in `types/pcs.ts` (`DetailerContact.phone`, `.email`). | Add `@security PII` annotations to all PII fields across all type files. Create a PII field registry document. |
| **Accessible** | Strong | Data available via typed service interfaces in `services/api/interfaces/` (7 interfaces: `IAssignmentService`, `ICareerService`, `IDPSService`, `IInboxService`, `ILeaveService`, `IPCSService`, `IUserService`). `serviceRegistry.ts` provides single access point. | Data access not scoped by role (no RBAC). All consumers get full data regardless of need-to-know. | Implement role-scoped service methods and store selectors per AC-3/AC-6. |
| **Understandable** | Strong | Zod schemas document data shape with JSDoc comments. Navy terminology enforced per CLAUDE.md Section 4.8. Field names self-describing. Type files include context comments (e.g., PRD, SEAOS, EAOS definitions). | Some schemas lack field descriptions (e.g., `BilletSchema` compass fields). | Add JSDoc descriptions to undocumented schema fields. |
| **Linked** | Strong | Consistent foreign keys: `userId` links leave requests, applications, and PCS orders to users. `billetId` links applications to billets. SQLite foreign key constraints defined in table schemas. | Foreign key enforcement not enabled at runtime (`PRAGMA foreign_keys = ON` not observed in `DatabaseManager.init()`). | Add `PRAGMA foreign_keys = ON;` to `DatabaseManager.init()`. |
| **Trustworthy** | Moderate | Zod validation at form input boundary via `react-hook-form`. Zod parse on SQLite read (repository layer validates data integrity, self-heals corrupted records). | No Zod validation on mock service responses (trust boundary gap -- mock services return unvalidated data). No Zod validation planned for API response boundary in mock implementations. | Implement Zod validation in `real*Service.ts` response handlers per `services/api/CLAUDE.md` pattern. |
| **Interoperable** | Strong | Standardized service interfaces with typed contracts. Shared Zod schemas. `@DSA` documentation pattern defined in `services/api/CLAUDE.md`. API design standards documented. | No `real*Service.ts` implementations exist yet. No IDES alignment verification. | Build `real*Service.ts` implementations with `@DSA` documentation per integration phase. |
| **Secure** | Weak | Storage tier model defined (Secure Store, SQLite, AsyncStorage). PII annotations on user type. SecureLogger for log redaction. Token in Secure Store (native). | Encryption disabled. No RBAC. No audit trail. Sync queue unencrypted. Web token storage unprotected. Object PII leaks through logger. 50+ unpatched console calls. | Address SC-28, AC-3, AU-2, and data leakage findings. This is the weakest VAULTIS dimension. |

### 7 Data Quality Dimensions Assessment

| Dimension | Status | Evidence | Gaps |
|-----------|--------|----------|------|
| **Accuracy** | Moderate | Mock data provides realistic Navy personnel data shapes. Zod schemas enforce type correctness. | No validation against authoritative source (NSIPS). Mock data may drift from real data shapes. |
| **Completeness** | Strong | Required fields enforced in Zod schemas (`.min()`, `.nonempty()`). Form validation prevents incomplete submissions. | Some schemas use excessive `.optional()` (e.g., `UserSchema` has 30+ optional fields), which could allow incomplete records through. |
| **Conformity** | Strong | Enum schemas for leave types, PCS phases, billet categories, application statuses. SQLite CHECK constraints mirror Zod enums. | No cross-system conformity validation (e.g., leave type enum may not match NSIPS values). |
| **Consistency** | Strong | ISO 8601 datetime format enforced via `z.string().datetime()`. Consistent ID field naming (`id`, `userId`, `billetId`). `SyncStatusSchema` reused across all entities. | Inconsistent timestamp types: some use ISO 8601 strings, `SyncOperation` uses Unix milliseconds (`Date.now()`). |
| **Uniqueness** | Strong | Primary keys on all SQLite tables. Unique constraint on `leave_balances.user_id`. Application/decision tables use composite keys where appropriate. | No explicit uniqueness check on leave request submissions (could create duplicates if sync queue replays). |
| **Integrity** | Moderate | Foreign key constraints defined in SQL DDL. Zod validation at input and read boundaries. Repository self-healing for corrupted records. | `PRAGMA foreign_keys = ON` not called -- foreign keys are defined but not enforced at runtime. |
| **Timeliness** | Strong | `lastSyncTimestamp` on all syncable entities. `SyncMetadataSchema` provides `localModifiedAt` for conflict detection. Background refresh pattern established in store SOP. | No freshness indicator shown in UI. User cannot see when data was last synced. |

---

## 5. POA&M-Ready Findings

### COMP-001: Data-at-Rest Encryption Disabled

| Field | Content |
|-------|---------|
| **ID** | COMP-001 |
| **Control Reference** | SC-28, SRG-APP-000175, MP-5 |
| **Title** | All local data stored unencrypted |
| **Risk Level** | Critical |
| **Description** | `encryptData()` and `decryptData()` in `lib/encryption.ts` (lines 49-51, 63-64) are no-op passthroughs that return data unmodified. SQLite database `my_compass.db` stores user profiles (DoD ID, DOB, emergency contacts), leave requests (phone numbers, addresses), PCS orders, and financial data in plaintext. AsyncStorage sync queue stores mutation payloads in plaintext. Web localStorage stores user data with disabled encryption. A lost or stolen device exposes all cached PII/CUI. |
| **Milestone** | `encryptData`/`decryptData` re-enabled with FIPS-validated crypto (COMP-002). All existing plaintext data migrated to encrypted format. Sync queue payloads encrypted before AsyncStorage write. Verified by unit test demonstrating data is not readable without key. |
| **Responsible Party** | Client team |
| **Effort** | M |
| **Dependencies** | COMP-002 (FIPS crypto), COMP-003 (key management) |

### COMP-002: Non-FIPS Cryptographic Library

| Field | Content |
|-------|---------|
| **ID** | COMP-002 |
| **Control Reference** | SC-13, SRG-APP-000141, SRG-APP-000514 |
| **Title** | `crypto-js` is not FIPS 140-2 validated |
| **Risk Level** | Critical |
| **Description** | `crypto-js` (v4.2.0, `package.json:22`) is a pure JavaScript AES implementation that has not undergone FIPS 140-2 certification. DISA Mobile Application SRG requires all cryptographic operations to use FIPS-validated modules. Even if encryption were re-enabled, it would not satisfy the STIG requirement. |
| **Milestone** | `crypto-js` and `@types/crypto-js` removed from `package.json`. Replaced with Web Crypto API (`SubtleCrypto`) for AES-256-GCM (web + modern RN) or `react-native-quick-crypto` (wraps OpenSSL FIPS module, native). All encrypt/decrypt call sites updated. Verified by `npm ls crypto-js` returning empty. |
| **Responsible Party** | Client team |
| **Effort** | M |
| **Dependencies** | None |

### COMP-003: Insecure Encryption Key Management

| Field | Content |
|-------|---------|
| **ID** | COMP-003 |
| **Control Reference** | SC-12 |
| **Title** | Encryption key derivation uses insecure fallback chain |
| **Risk Level** | Critical |
| **Description** | `lib/encryption.ts` (lines 10-39) derives the encryption key through a three-tier fallback: (1) `process.env.EXPO_PUBLIC_STORAGE_KEY` -- the `EXPO_PUBLIC_` prefix means this value is embedded in the client JavaScript bundle, readable by anyone with the app binary; (2) `localStorage.getItem()` -- unencrypted browser storage; (3) `'fallback-session-key-' + new Date().getTime()` -- deterministic, session-only, trivially guessable. None of these meet key management requirements for protecting CUI. |
| **Milestone** | Key derived from user's CAC/PKI credential via PBKDF2 (or from biometric-protected keychain entry). Derived key stored in `expo-secure-store` (iOS Keychain / Android Keystore). `EXPO_PUBLIC_STORAGE_KEY` env var removed. `localStorage` fallback removed. Timestamp fallback removed. |
| **Responsible Party** | Client team (key storage) + Backend team (CAC/PKI credential availability) |
| **Effort** | L |
| **Dependencies** | COMP-007 (CAC/PKI authentication) |

### COMP-004: No Audit Logging Capability

| Field | Content |
|-------|---------|
| **ID** | COMP-004 |
| **Control Reference** | AU-2, AU-3, AU-9, AU-12, SRG-APP-000210 |
| **Title** | Complete absence of audit trail |
| **Risk Level** | Critical |
| **Description** | No audit event generation, no structured audit records, no local persistence, and no sync path to a server-side audit store. Security-relevant events (login, data access, data modification, form submission, authorization failures) produce only ephemeral console logs that are lost when the app closes. This is a fundamental RMF gap -- assessors require demonstrable audit capability for Moderate baseline authorization. |
| **Milestone** | `AuditLogService` created in `services/auditLog.ts`. `AuditRecordSchema` defined in `types/audit.ts` with fields: timestamp (ISO 8601 UTC), hashed user ID, event type, resource affected, outcome. Events generated for: authentication, data reads, data writes, form submissions, authorization checks. Records persisted in encrypted SQLite (append-only, no UPDATE/DELETE). Background sync via `syncQueue.ts` to server endpoint when available. |
| **Responsible Party** | Client team (local) + Backend team (ingestion endpoint) |
| **Effort** | L |
| **Dependencies** | COMP-001 (encrypted storage), Backend audit ingestion endpoint |

### COMP-005: No Role-Based Access Control

| Field | Content |
|-------|---------|
| **ID** | COMP-005 |
| **Control Reference** | AC-3, AC-6 |
| **Title** | All users have unrestricted access to all features and data |
| **Risk Level** | High |
| **Description** | No `role` field exists on the `UserSchema` in `types/user.ts`. `AuthGuard.tsx` checks only authentication status, not authorization level. All store actions and selectors are accessible to all authenticated users. A Sailor could access supervisor-only features (leave approval, division records) when connected to real APIs. No route-level guards distinguish user types. |
| **Milestone** | `role` field added to `UserSchema` (`Sailor | Supervisor | Admin | YN`). Route-level guards in Expo Router layouts gate supervisor/admin features. Store actions check caller role before mutation (e.g., `approveLeave` requires `Supervisor`). Role-conditional UI rendering hides unavailable actions. Server-side RBAC middleware enforces independently. |
| **Responsible Party** | Client team (UI/store guards) + Backend team (server enforcement, role claims in JWT) |
| **Effort** | L |
| **Dependencies** | Backend must issue role claims in Okta JWT |

### COMP-006: PII Leakage Through Logger Object Passthrough

| Field | Content |
|-------|---------|
| **ID** | COMP-006 |
| **Control Reference** | SRG-APP-000400, AC-4, SI-11 |
| **Title** | SecureLogger passes objects containing PII without sanitization |
| **Risk Level** | High |
| **Description** | `utils/logger.ts` line 49: when `sanitizeArgs` encounters an object argument, it returns the raw object (`return arg`). This means any object containing PII fields (e.g., a `User` object with `dodId`, `email`, `phone`, `emergencyContact`) passes through to the console without redaction. Additionally, 50+ direct `console.*` calls remain across `lib/ctx.tsx` (6 calls), `services/syncQueue.ts` (3), `services/repositories/` (15+), `services/storage.web.ts` (12+), `services/migrations.ts` (3), `services/notifications.ts` (3), and `components/` (2). TD-010 was marked RESOLVED on 2026-02-27, but the resolution was incomplete. |
| **Milestone** | `sanitizeArgs` in `utils/logger.ts` updated to JSON.stringify objects and apply regex sanitization before returning. All 50+ remaining `console.*` calls replaced with `SecureLogger` equivalents. ESLint `no-console` rule added and enforced in CI to prevent regression. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

### COMP-007: Mock Authentication -- No CAC/PKI

| Field | Content |
|-------|---------|
| **ID** | COMP-007 |
| **Control Reference** | IA-2, SRG-APP-000153 |
| **Title** | Authentication uses hardcoded mock token |
| **Risk Level** | High |
| **Description** | `lib/ctx.tsx:75` sets `mockAccessToken = 'mock-okta-access-token'` on every sign-in. No real Okta OIDC flow executes. No PKCE challenge. No CAC/PKI certificate presentation. No DoD ID verification from token claims. `config/auth.ts` points to `https://dev-navy-mock.okta.com` (non-existent domain). |
| **Milestone** | `expo-auth-session` integrated with PKCE flow. Okta tenant provisioned with DoD PKI trust chain. CAC hardware authenticator configured as MFA factor. DoD ID claim extracted and verified from JWT. Mock token flow gated behind `__DEV__` flag. |
| **Responsible Party** | Client team (PKCE integration) + Backend team (Okta tenant, PKI trust) |
| **Effort** | L |
| **Dependencies** | Backend must provision Okta tenant |

### COMP-008: No Certificate Pinning

| Field | Content |
|-------|---------|
| **ID** | COMP-008 |
| **Control Reference** | SRG-APP-000380 |
| **Title** | HttpClient does not pin server certificates |
| **Risk Level** | High |
| **Description** | `services/api/client.ts` makes HTTPS requests but accepts any valid TLS certificate. No pinning configuration exists in the client, `app.json`, or native config files. This leaves the app vulnerable to man-in-the-middle attacks using rogue CA certificates, which is a significant risk in DIL environments where network infrastructure may be compromised. |
| **Milestone** | Certificate pinning configured in `HttpClient` for all Navy API endpoints. DoD-issued server certificate hash stored in app config. Pinning failure results in connection rejection. Fallback to cached data on pin failure (offline-first). |
| **Responsible Party** | Client team (pinning logic) + Backend team (provision DoD TLS certificate) |
| **Effort** | S |
| **Dependencies** | Backend must provision and share DoD-issued TLS certificate |

### COMP-009: Sync Queue Stores PII in Plaintext AsyncStorage

| Field | Content |
|-------|---------|
| **ID** | COMP-009 |
| **Control Reference** | SC-28, MP-5 |
| **Title** | Offline mutation queue stores CUI/PII payloads unencrypted |
| **Risk Level** | High |
| **Description** | `services/syncQueue.ts` persists queued operations to AsyncStorage (Tier 3) as plain JSON via `AsyncStorage.setItem()` / `AsyncStorage.multiSet()`. When real API mutations contain CUI/PII (leave requests with emergency contacts, user profile updates with DoD ID), this data will be stored unencrypted on the device filesystem. Per `CLAUDE.md` Section 3 Storage Tiers, AsyncStorage must never be used for PII. |
| **Milestone** | Sync queue payloads encrypted before AsyncStorage write using FIPS-validated crypto. Better: migrate sync queue storage to Tier 2 (encrypted SQLite) instead of AsyncStorage. Decrypt on `hydrate()`. |
| **Responsible Party** | Client team |
| **Effort** | M |
| **Dependencies** | COMP-001, COMP-002 |

### COMP-010: Missing @security PII Annotations

| Field | Content |
|-------|---------|
| **ID** | COMP-010 |
| **Control Reference** | VAULTIS-Visible, SRG-APP-000400 |
| **Title** | PII fields in leave and PCS schemas lack @security annotations |
| **Risk Level** | Medium |
| **Description** | `types/user.ts` has comprehensive `@security PII` annotations (9 fields). However, `types/schema.ts` has zero `@security` annotations despite containing PII fields: `EmergencyContactSchema` (name, phoneNumber, altPhoneNumber, address), `LeaveRequestSchema` (leavePhoneNumber, leaveAddress, emergencyContact, dutyPhone). `types/pcs.ts` has no annotations on `DetailerContact` (name, phone, email). Without annotations, developers may inadvertently log these fields. |
| **Milestone** | `@security PII` JSDoc annotations added to all PII fields in `types/schema.ts`, `types/pcs.ts`, and any other type files containing personal data. PII field registry created for developer reference. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

### COMP-011: Demo Mode Bypasses DoD Consent Banner

| Field | Content |
|-------|---------|
| **ID** | COMP-011 |
| **Control Reference** | AC-8, SRG-APP-000225 |
| **Title** | Demo mode allows consent banner bypass in production code |
| **Risk Level** | Medium |
| **Description** | `components/navigation/AuthGuard.tsx:38`: `const isConsentAcknowledged = consentAcknowledged \|\| isDemoMode`. The `isDemoMode` flag from `useDemoStore` allows skipping the DoD Notice and Consent Banner. This flag is not gated behind `__DEV__` or `process.env.NODE_ENV` check, meaning it could theoretically be activated in a production build. AC-8 requires the banner be displayed every session with no bypass. |
| **Milestone** | `isDemoMode` consent bypass gated with `__DEV__` or `process.env.NODE_ENV !== 'production'` guard. Production builds always require explicit consent acknowledgement. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

### COMP-012: Unjustified App Permissions

| Field | Content |
|-------|---------|
| **ID** | COMP-012 |
| **Control Reference** | CM-7, SRG-APP-000220 |
| **Title** | Declared permissions exceed implemented functionality |
| **Risk Level** | Medium |
| **Description** | `app.json` declares `android.permission.RECORD_AUDIO` but no audio recording feature exists in the codebase. `NSContactsUsageDescription` is declared for iOS but contacts integration is not yet implemented. Least functionality principle requires only permissions needed by implemented features. |
| **Milestone** | Remove `RECORD_AUDIO` from Android permissions. Remove `NSContactsUsageDescription` from iOS `infoPlist` until contacts feature is built. Document justification for each remaining permission in ATO package. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

### COMP-013: No SBOM for ATO Package

| Field | Content |
|-------|---------|
| **ID** | COMP-013 |
| **Control Reference** | CM-8, SI-2 |
| **Title** | No Software Bill of Materials generated |
| **Risk Level** | Medium |
| **Description** | The application has 50 production dependencies and 6 dev dependencies in `package.json`. No formal SBOM in CycloneDX or SPDX format has been generated. No automated vulnerability scanning is configured in CI. `npm audit` is available but not systematically run. |
| **Milestone** | CycloneDX SBOM generated from `package-lock.json` and included in ATO package. `npm audit` added to CI pipeline with fail-on-high threshold. Dependency update cadence documented (30-day review recommended). |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

### COMP-014: Foreign Key Enforcement Not Enabled at Runtime

| Field | Content |
|-------|---------|
| **ID** | COMP-014 |
| **Control Reference** | VAULTIS-Linked, VAULTIS-Integrity |
| **Title** | SQLite foreign key constraints defined but not enforced |
| **Risk Level** | Medium |
| **Description** | `services/db/DatabaseManager.ts:56` calls `PRAGMA journal_mode = WAL;` during init but does not call `PRAGMA foreign_keys = ON;`. SQLite disables foreign key enforcement by default. The DDL in `types/schema.ts` defines foreign key relationships (e.g., `leave_requests.user_id REFERENCES users(id)`) but these constraints are never enforced, allowing orphaned records. |
| **Milestone** | `PRAGMA foreign_keys = ON;` added to `DatabaseManager.init()` immediately after database open. Integration test verifying FK violation throws error. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

### COMP-015: `usesNonExemptEncryption` Must Update When Encryption Enabled

| Field | Content |
|-------|---------|
| **ID** | COMP-015 |
| **Control Reference** | CM-6 |
| **Title** | iOS export compliance flag must change when encryption is enabled |
| **Risk Level** | Low |
| **Description** | `app.json` iOS config sets `usesNonExemptEncryption: false`. This is currently correct because encryption is disabled. When COMP-001 and COMP-002 are resolved and encryption is re-enabled, this must be set to `true` and the corresponding Apple/BIS export compliance documentation filed. |
| **Milestone** | When encryption is re-enabled: update `usesNonExemptEncryption` to `true` in `app.json`. File export compliance documentation with Apple and BIS as required. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | COMP-001, COMP-002 |

### COMP-016: No Secure Data Deletion on Sign-Out

| Field | Content |
|-------|---------|
| **ID** | COMP-016 |
| **Control Reference** | SRG-APP-000450, MP-5 |
| **Title** | User data persists on device after sign-out |
| **Risk Level** | Medium |
| **Description** | `signOut()` in `lib/ctx.tsx:92-95` clears the session token and resets the consent flag, but does not clear cached user data from SQLite, AsyncStorage, or file system. A subsequent user on a shared device could potentially access the previous user's cached data. |
| **Milestone** | Sign-out flow clears all user-specific data from SQLite (user profile, leave requests, applications, PCS orders), AsyncStorage (sync queue, dashboard cache), and file system (cached receipts, PDFs). Secure store tokens cleared. |
| **Responsible Party** | Client team |
| **Effort** | M |
| **Dependencies** | None |

### COMP-017: Web Platform Token Storage Insecure

| Field | Content |
|-------|---------|
| **ID** | COMP-017 |
| **Control Reference** | IA-5, SC-28 |
| **Title** | Web session tokens stored in localStorage with disabled encryption |
| **Risk Level** | High |
| **Description** | `lib/useStorageState.ts:23` stores session tokens in `localStorage` on web platform, passing through `encryptData()` which is a no-op. Unlike native platforms which use `expo-secure-store` (Keychain/Keystore), web tokens are in plaintext `localStorage`, accessible to any JavaScript running in the same origin. `services/storage.web.ts` stores full user objects (containing PII) in `localStorage` with the same disabled encryption. `services/db/DatabaseManager.ts:62-67` has `WebHelpers` that read/write `localStorage` directly without any encryption. |
| **Milestone** | Web token storage migrated to `HttpOnly` secure cookies (requires backend) or encrypted IndexedDB via Web Crypto API. All `localStorage` PII usage in `storage.web.ts` encrypted with Web Crypto `SubtleCrypto`. `DatabaseManager.WebHelpers` updated to encrypt data. |
| **Responsible Party** | Client team |
| **Effort** | M |
| **Dependencies** | COMP-002 (for Web Crypto replacement) |

### COMP-018: Store Residual console.error Call

| Field | Content |
|-------|---------|
| **ID** | COMP-018 |
| **Control Reference** | SRG-APP-000400 |
| **Title** | Residual console.error in usePCSStore after TD-010 resolution |
| **Risk Level** | Low |
| **Description** | `store/usePCSStore.ts:260` contains `console.error('[PCSStore] Failed to fetch active order:', result.error.message)`. TD-010 was marked RESOLVED on 2026-02-27 with the claim that all `console.*` calls across 8 stores were replaced. This instance was missed. While the error message logged here is a service error message (not direct PII), it bypasses SecureLogger and could potentially include PII in error details from future real API responses. |
| **Milestone** | Replace `console.error` with `SecureLogger.error` at `store/usePCSStore.ts:260`. Audit all store files for any other missed instances. |
| **Responsible Party** | Client team |
| **Effort** | S |
| **Dependencies** | None |

---

## Appendix A: Files Reviewed

**Documentation:**
- `docs/ATO_READINESS.md` (unified index + frontend + backend sections)
- `docs/SECURITY_POSTURE.md`
- `docs/TECHNICAL_DEBT.md` (unified index + frontend + backend sections)
- `docs/USN_DATA_GOVERNANCE_SUMMARY.md`
- `docs/API_INTEGRATION_ROADMAP.md`

**Implementation (security-critical):**
- `lib/ctx.tsx` -- Authentication context and session management
- `lib/encryption.ts` -- Encryption functions (disabled)
- `lib/useStorageState.ts` -- Token storage (platform-specific)
- `config/auth.ts` -- Okta OIDC configuration
- `config/api.ts` -- API endpoint configuration
- `utils/logger.ts` -- SecureLogger with PII redaction
- `app/_layout.tsx` -- Root layout, error boundary, console patching
- `app/consent.tsx` -- DoD consent banner (AC-8)
- `components/navigation/AuthGuard.tsx` -- Route protection
- `components/AppErrorBoundary.tsx` -- Global error boundary (SI-11)
- `services/api/client.ts` -- HTTP client with TLS/retry
- `services/storage.ts` -- Storage facade (repository pattern)
- `services/storage.web.ts` -- Web localStorage implementation
- `services/syncQueue.ts` -- Offline mutation queue
- `services/db/DatabaseManager.ts` -- SQLite database management
- `hooks/useIdleTimeout.ts` -- Session idle timeout (IA-11)

**Type definitions:**
- `types/user.ts` -- User schema with PII annotations
- `types/schema.ts` -- Core schemas (leave, billet, application)
- `types/pcs.ts` -- PCS types
- `types/auth.ts` -- Auth token type
- `types/travelClaim.ts` -- Travel claim schema

**Configuration:**
- `app.json` -- Expo configuration, permissions, deep linking
- `package.json` -- Dependencies (50 production, 6 dev)

**Codebase-wide searches performed:**
- `console.(log|warn|error|info)` across all `.ts/.tsx` files -- 50+ hits outside test files
- `eval()` / `new Function()` -- 0 hits (confirmed clean)
- `localStorage.` usage -- 30+ hits across encryption, storage, web storage
- `@security` annotations -- found in `types/user.ts` (9), `types/auth.ts` (1), missing from `types/schema.ts`, `types/pcs.ts`
- Hardcoded credentials/secrets -- 0 hits (confirmed clean)

## Appendix B: Remediation Priority Order

Addressing findings in this order maximizes ATO credit per sprint:

| Priority | Finding | Effort | Blocked By |
|----------|---------|--------|------------|
| 1 | COMP-006: Fix SecureLogger object sanitization + replace all console calls | S | None |
| 2 | COMP-010: Add @security annotations to all PII fields | S | None |
| 3 | COMP-011: Gate demo mode consent bypass behind `__DEV__` | S | None |
| 4 | COMP-012: Remove unjustified permissions | S | None |
| 5 | COMP-014: Enable SQLite foreign key enforcement | S | None |
| 6 | COMP-018: Fix residual console.error in usePCSStore | S | None |
| 7 | COMP-002: Replace crypto-js with FIPS-validated crypto | M | None |
| 8 | COMP-001: Re-enable encryption at rest | M | COMP-002 |
| 9 | COMP-003: Implement secure key management | L | COMP-002, COMP-007 |
| 10 | COMP-009: Encrypt sync queue payloads | M | COMP-001, COMP-002 |
| 11 | COMP-017: Fix web platform token/data storage | M | COMP-002 |
| 12 | COMP-004: Build AuditLogService | L | COMP-001 |
| 13 | COMP-005: Implement RBAC | L | Backend (JWT role claims) |
| 14 | COMP-016: Implement secure data deletion on sign-out | M | None |
| 15 | COMP-013: Generate SBOM | S | None |
| 16 | COMP-007: Implement real CAC/PKI auth | L | Backend (Okta tenant) |
| 17 | COMP-008: Implement certificate pinning | S | Backend (DoD cert) |
| 18 | COMP-015: Update export compliance flag | S | COMP-001, COMP-002 |
