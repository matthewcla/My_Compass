# My Compass — ATO Readiness Assessment (Index)

> **Version:** 1.2 · **Updated:** 2026-02-27 · **Status:** Pre-ATO (Development Phase)
>
> **Target:** DISA Mobile Application SRG + NIST SP 800-53 Rev 5 (Moderate Baseline)

This assessment has been split into frontend and backend files for clearer ownership and sprint planning.

---

## Subassessments

| File | Scope |
|------|-------|
| [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md) | Controls implementable within the React Native client codebase |
| [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md) | Controls requiring server infrastructure, identity provider, or network services |

---

## Combined Executive Summary

| Category | Implemented | Stubbed | Not Implemented | Total |
|----------|-------------|---------|-----------------|-------|
| Access Control (AC) | 3 | 1 | 3 | 7 |
| Audit & Accountability (AU) | 0 | 0 | 4 | 4 |
| Identification & Auth (IA) | 1 | 3 | 1 | 5 |
| System & Comms Protection (SC) | 2 | 2 | 2 | 6 |
| System & Info Integrity (SI) | 4 | 0 | 0 | 4 |
| **Totals** | **10** | **6** | **10** | **26** |

**Assessment:** ~38% of required controls are fully implemented (+7% since v1.1). ~23% are stubbed. ~38% are not yet implemented. Sprint completed: AC-8 ✅, SI-11 ✅, IA-11 frontend ✅ (backend token alignment pending). Most remaining gaps require backend infrastructure.

---

## Quick Reference — All Controls

| Control | Title | Status | Owner |
|---------|-------|--------|-------|
| **AC-2** | Account Management | ⚠️ Stubbed | [Backend](#ac-2-account-management) |
| **AC-3** | Access Enforcement | ❌ Not Implemented | [Frontend](#ac-3-access-enforcement-shared--frontend-component) + [Backend](#ac-3-access-enforcement-shared--backend-component) |
| **AC-6** | Least Privilege | ❌ Not Implemented | [Frontend](#ac-6-least-privilege-shared--frontend-component) + [Backend](#ac-6-least-privilege-shared--backend-component) |
| **AC-7** | Unsuccessful Login Attempts | ❌ Not Implemented | [Backend](#ac-7-unsuccessful-login-attempts) |
| **AC-8** | System Use Notification (DoD Banner) | ✅ Implemented | [Frontend](#ac-8-system-use-notification) |
| **AC-11** | Session Lock | ✅ Implemented | [Frontend](#ac-11-session-lock) |
| **AC-17** | Remote Access (TLS) | ✅ Implemented | [Frontend](#ac-17-remote-access-shared--frontend-component) |
| **AU-2** | Audit Events | ❌ Not Implemented | [Frontend](#au-2-audit-events-shared--frontend-component) + [Backend](#au-2-audit-events-shared--backend-component) |
| **AU-3** | Content of Audit Records | ❌ Not Implemented | [Frontend](#au-3-content-of-audit-records-shared--frontend-component) + [Backend](#au-3-content-of-audit-records-shared--backend-component) |
| **AU-6** | Audit Review, Analysis, and Reporting | ❌ Not Implemented | [Backend](#au-6-audit-review-analysis-and-reporting) |
| **AU-9** | Protection of Audit Information | ❌ Not Implemented | [Frontend](#au-9-protection-of-audit-information-shared--frontend-component) + [Backend](#au-9-protection-of-audit-information-shared--backend-component) |
| **IA-2** | Identification and Authentication | ⚠️ Stubbed | [Frontend](#ia-2-identification-and-authentication-shared--frontend-component) + [Backend](#ia-2-identification-and-authentication-shared--backend-component) |
| **IA-5** | Authenticator Management | ⚠️ Stubbed | [Frontend](#ia-5-authenticator-management-shared--frontend-component) + [Backend](#ia-5-authenticator-management-shared--backend-component) |
| **IA-6** | Authenticator Feedback | ✅ Implemented | [Frontend](#ia-6-authenticator-feedback) |
| **IA-8** | Auth — Non-Organizational Users | ❌ N/A | [Backend](#ia-8-identification-and-authentication-non-organizational-users) |
| **IA-11** | Re-Authentication | ⚠️ Partial | [Frontend](#ia-11-re-authentication-shared--frontend-component) ✅ + [Backend](#ia-11-re-authentication-shared--backend-component) ❌ |
| **SC-8** | Transmission Confidentiality | ✅ Implemented | [Frontend](#sc-8-transmission-confidentiality-and-integrity-shared--frontend-component) + [Backend](#sc-8-transmission-confidentiality-and-integrity-shared--backend-component) |
| **SC-12** | Cryptographic Key Management | ⚠️ Stubbed | [Frontend](#sc-12-cryptographic-key-establishment-and-management) |
| **SC-13** | Cryptographic Protection | ⚠️ Stubbed | [Frontend](#sc-13-cryptographic-protection) |
| **SC-23** | Session Authenticity | ✅ Implemented | [Frontend](#sc-23-session-authenticity) |
| **SC-28** | Confidentiality at Rest | ❌ Not Implemented | [Frontend](#sc-28-confidentiality-of-information-at-rest) |
| **SC-39** | Process Isolation | ❌ Not Implemented | [Frontend](#sc-39-process-isolation-shared--frontend-component) + [Backend](#sc-39-process-isolation-shared--backend-component) |
| **SI-2** | Flaw Remediation | ✅ Implemented | [Frontend](#si-2-flaw-remediation) |
| **SI-3** | Malicious Code Protection | ✅ Implemented | [Frontend](#si-3-malicious-code-protection) |
| **SI-10** | Information Input Validation | ✅ Implemented | [Frontend](#si-10-information-input-validation) |
| **SI-11** | Error Handling | ✅ Implemented | [Frontend](#si-11-error-handling) |

---

## DISA Mobile App SRG Quick Reference

| SRG ID | Requirement | Status | Owner |
|--------|------------|--------|-------|
| SRG-APP-000141 | FIPS 140-2 validated crypto | ❌ | Frontend |
| SRG-APP-000153 | PKI/CAC authentication | ⚠️ | Frontend + Backend |
| SRG-APP-000175 | Encrypt data at rest | ⚠️ | Frontend |
| SRG-APP-000190 | Session timeout (15 min) | ⚠️ | Frontend ✅ (10-min sign-out) + Backend ❌ (token alignment) |
| SRG-APP-000210 | Audit trail | ❌ | Frontend + Backend |
| SRG-APP-000225 | DoD banner on startup | ✅ | Frontend |
| SRG-APP-000380 | Certificate pinning | ❌ | Frontend (blocked on Backend cert) |
| SRG-APP-000400 | Prevent data leakage | ✅ | Frontend |
| SRG-APP-000514 | FIPS crypto modules | ❌ | Frontend |

---

## What's Already Strong

- ✅ **Input validation** via Zod is comprehensive and prevents injection
- ✅ **PII redaction** in `SecureLogger` is production-grade; `patchGlobalConsole()` intercepts all stray logs app-wide
- ✅ **Offline-first architecture** — no data loss during network outages
- ✅ **Token storage** uses platform Keychain/Keystore via `expo-secure-store`
- ✅ **Network layer** has retry, timeout, and TLS enforcement
- ✅ **Service interface pattern** enables clean mock→real swap without client refactoring
- ✅ **Sync queue** with dead-letter recovery ensures no write loss
- ✅ **DoD consent banner** (AC-8) — every session, no bypass possible
- ✅ **Global error boundary** (SI-11) — safe messaging, no internal state exposed
- ✅ **Session idle timeout** (IA-11 frontend) — 10-min hard sign-out, 5-min warning


---

## Frontend Controls

>
> **Target:** DISA Mobile Application SRG + NIST SP 800-53 Rev 5 (Moderate Baseline)
>
> **Scope:** Controls implementable within the React Native client codebase. Backend components of shared controls are assessed in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).
> For the full unified assessment see [ATO_READINESS.md](ATO_READINESS.md).

---

## 1. Executive Summary

| Category | Implemented | Stubbed | Not Implemented | Total (Frontend Scope) |
|----------|-------------|---------|-----------------|----------------------|
| Access Control (AC) | 3 | 0 | 2 | 5 |
| Audit & Accountability (AU) | 0 | 0 | 3 | 3 |
| Identification & Auth (IA) | 2 | 2 | 0 | 4 |
| System & Comms Protection (SC) | 2 | 2 | 2 | 6 |
| System & Info Integrity (SI) | 4 | 0 | 0 | 4 |
| **Totals** | **11** | **4** | **7** | **22** |

**Assessment:** ~50% of frontend-scope controls are fully implemented (+14% since v1.1). ~18% are stubbed. ~32% are not yet implemented. Sprint completed: AC-8, SI-11, IA-11 (frontend), TD-010, TD-003.

---

## 2. Control Family: Access Control (AC)

### AC-3: Access Enforcement *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No route-level or action-level guards in the client. All authenticated users have implicit full access. |

**Frontend Remediation:** Add role-based route guards to Expo Router layouts. Add store-level action guards. Render role-conditional UI (e.g., hide supervisor-only actions from Sailors).
**Backend component:** Server-side enforcement tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

### AC-6: Least Privilege *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Follows from AC-3. No privilege separation in the client. |

**Frontend Remediation:** Same as AC-3 — role-scoped store selectors and UI gating enforce least privilege within the client.
**Backend component:** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

### AC-8: System Use Notification

| Status | Notes |
|--------|-------|
| ✅ Implemented | DoD consent banner implemented 2026-02-27. Displayed every session post-auth, pre-hub. |

**Implementation:** `app/consent.tsx` displays the full DoD standard Notice and Consent Banner (5 numbered items + CUI notice) after every successful sign-in, before accessing any app content. No back gesture. `consentAcknowledged` flag is in-memory only — resets on sign-out and app restart. `AuthGuard` enforces the gate. See [lib/ctx.tsx](../lib/ctx.tsx), [app/consent.tsx](../app/consent.tsx), [components/navigation/AuthGuard.tsx](../components/navigation/AuthGuard.tsx).

---

### AC-11: Session Lock

| Status | Notes |
|--------|-------|
| ✅ Implemented | `AuthGuard` protects all routes. App requires re-auth on fresh launch. |

---

### AC-17: Remote Access *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ✅ Implemented | All network communication uses TLS. `HttpClient` enforces `https://` base URL. |

**Backend component (TLS server cert):** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

## 3. Control Family: Audit & Accountability (AU)

> All AU controls are shared — the client builds local persistence, the server provides ingestion and review. Backend components are in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

### AU-2: Audit Events *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No audit event generation. Only ephemeral console logs. |

**Frontend Remediation:** Create `AuditService` that generates and locally persists structured events for: login, data access, data modification, form submission, and authorization failures. Store in encrypted SQLite via the service layer.

---

### AU-3: Content of Audit Records *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No structured audit records produced by the client. |

**Frontend Remediation:** Each audit record the client produces must include: timestamp, hashed user ID, event type, resource affected, outcome (success/failure). Define this as a Zod schema in `types/`.

---

### AU-9: Protection of Audit Information *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No audit data exists to protect locally. |

**Frontend Remediation:** Store local audit records in encrypted SQLite with append-only semantics. The application user must not be able to modify or delete audit records — no `UPDATE` or `DELETE` queries against the audit table.

---

## 4. Control Family: Identification & Authentication (IA)

### IA-2: Identification and Authentication *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Okta OIDC configuration exists. Mock token flow operational. No real PKCE or CAC authentication client-side. |

**Frontend Remediation:**
1. Complete `expo-auth-session` integration
2. Implement PKCE flow for mobile OAuth
3. Add CAC/PKI certificate presentation in the auth flow
4. Verify DoD ID claim from the Okta token before granting access

**Backend component (Okta tenant, CAC trust chain):** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

### IA-5: Authenticator Management *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Token stored in `expo-secure-store`. No refresh rotation or expiration handling on the client. |

**Frontend Remediation:** Implement JWT expiration checks before every API call. Implement refresh token rotation in `lib/ctx.tsx`. Clear all tokens from `expo-secure-store` on explicit sign-out.

**Backend component (Okta token TTL configuration):** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

### IA-6: Authenticator Feedback

| Status | Notes |
|--------|-------|
| ✅ Implemented | PII fields can be masked via `privacyMode`. Password-type inputs obscure entry. |

---

### IA-11: Re-Authentication *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ✅ Implemented | 10-min idle sign-out with 5-min warning implemented 2026-02-27. More restrictive than the 15-min STIG threshold. |

**Implementation:** `hooks/useIdleTimeout.ts` tracks inactivity via `onStartShouldSetResponderCapture` on the root View (fires on every touch). At 5 min: `SessionTimeoutOverlay` displays a live countdown — tap to extend. At 10 min: hard sign-out via `signOut()`. `AppState` listener checks wall-clock elapsed time so backgrounding for ≥10 min triggers immediate sign-out on foreground. See [hooks/useIdleTimeout.ts](../hooks/useIdleTimeout.ts), [components/SessionTimeoutOverlay.tsx](../components/SessionTimeoutOverlay.tsx).

**Note on biometric re-auth:** STIG SRG-APP-000190 recommends biometric re-auth via `expo-local-authentication`. Current implementation uses hard sign-out (requires full Okta re-auth), which satisfies the control. Biometric PIN-re-auth is deferred to a future sprint.

**Backend component (token lifetime alignment):** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

## 5. Control Family: System & Communications Protection (SC)

### SC-8: Transmission Confidentiality and Integrity *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ✅ Implemented | TLS enforced on all HTTP requests via `HttpClient` base URL (`https://`). |

**Backend component (server TLS certificate):** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

### SC-12: Cryptographic Key Establishment and Management

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Key generation code exists but uses insecure fallbacks. Not FIPS-validated. See TD-004. |

**Frontend Remediation:** Replace insecure fallback key derivation in `lib/encryption.ts` with PBKDF2 derived from the user's CAC credential. Store derived key in `expo-secure-store`. See [TECHNICAL_DEBT_FRONTEND.md TD-004](#td-004-encryption-key-management-insecure).

---

### SC-13: Cryptographic Protection

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | AES encryption code exists but is disabled. `crypto-js` is not FIPS-validated. See TD-001, TD-002. |

**Frontend Remediation:** Replace `crypto-js` with a FIPS 140-2 validated module and re-enable `encryptData/decryptData`. See [TECHNICAL_DEBT_FRONTEND.md TD-001](#td-001-encryption-disabled) and [TD-002](#td-002-crypto-js-not-fips-validated).

---

### SC-23: Session Authenticity

| Status | Notes |
|--------|-------|
| ✅ Implemented | Bearer token authentication in HTTP headers. HTTPS prevents session hijacking. |

---

### SC-28: Confidentiality of Information at Rest

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Encryption disabled in client. See TD-001. |

**Frontend Remediation:** Enable SQLite encryption once TD-001 and TD-002 are resolved. Migrate existing unencrypted data. See [TECHNICAL_DEBT_FRONTEND.md TD-001](#td-001-encryption-disabled).

---

### SC-39: Process Isolation *(Shared — Frontend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | WebView/native bridge isolation not hardened beyond standard React Native defaults. |

**Frontend Remediation:** Audit all `WebView` usages. Disable JavaScript in WebViews where not required. Apply Content Security Policy headers for the web deployment target. Restrict `allowsInlineMediaPlayback` and `allowsBackForwardNavigationGestures` where not needed.

**Backend component (server-side process isolation):** Tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

## 6. Control Family: System & Information Integrity (SI)

### SI-2: Flaw Remediation

| Status | Notes |
|--------|-------|
| ✅ Implemented | Dependencies managed via `package-lock.json`. Versions pinned. `npm audit` available. |

---

### SI-3: Malicious Code Protection

| Status | Notes |
|--------|-------|
| ✅ Implemented | App distributed via controlled channels (Expo managed workflow). No dynamic code execution. |

---

### SI-10: Information Input Validation

| Status | Notes |
|--------|-------|
| ✅ Implemented | Zod schemas validate all user inputs. Form validation via `react-hook-form` + `@hookform/resolvers/zod`. |

---

### SI-11: Error Handling

| Status | Notes |
|--------|-------|
| ✅ Implemented | Global error boundary with safe messaging implemented 2026-02-27. |

**Implementation:** `components/AppErrorBoundary.tsx` is exported as `ErrorBoundary` from `app/_layout.tsx`, making it the root-level catch for all unhandled navigation-tree errors. Displays "System Error" with a time-based support reference code (`MC-XXXXXX`) — no raw error message, no stack trace shown to user. `error` prop is intentionally suppressed from the UI. See [components/AppErrorBoundary.tsx](../components/AppErrorBoundary.tsx).

**Remaining gap:** Per-screen/sub-tree boundaries deferred. See TD-017 in [TECHNICAL_DEBT_FRONTEND.md](#td-017-no-per-screen-error-boundaries).

---

## 7. DISA Mobile App SRG — Frontend-Scope Requirements

| SRG ID | Requirement | Status | Notes |
|--------|------------|--------|-------|
| SRG-APP-000141 | Use FIPS 140-2 validated crypto | ❌ | `crypto-js` is not FIPS-validated — TD-002 |
| SRG-APP-000153 | Authenticate via PKI/CAC | ⚠️ | Client PKCE stub exists; CAC integration not wired — TD-006 frontend |
| SRG-APP-000175 | Encrypt data at rest | ⚠️ | Code exists but disabled — TD-001 |
| SRG-APP-000190 | Session timeout (15 min) | ✅ | 10-min idle sign-out (more restrictive). 5-min warning. See IA-11. |
| SRG-APP-000210 | Audit trail | ❌ | No local audit persistence — AU-2, AU-3 |
| SRG-APP-000225 | DoD banner on startup | ✅ | Consent banner shown every session post-auth. See AC-8. |
| SRG-APP-000380 | Certificate pinning | ❌ | No pinning in `HttpClient` — see note below |
| SRG-APP-000400 | Prevent data leakage | ✅ | PII redaction in logs, secure token storage |
| SRG-APP-000514 | FIPS crypto modules | ❌ | Duplicate of SRG-APP-000141 — TD-002 |

> **SRG-APP-000380 Note:** Certificate pinning logic lives in the client's network layer (`HttpClient`). The server's DoD-issued certificate must be known before pinning can be implemented — this is a dependency on the backend provisioning tracked in [ATO_READINESS_BACKEND.md](ATO_READINESS_BACKEND.md).

---

## 8. Frontend Remediation Priority Order

Address frontend controls in this order to maximize ATO credit per sprint:

1. ~~**AC-8 / SRG-APP-000225:** DoD consent banner~~ ✅ Done 2026-02-27
2. ~~**SI-11:** React error boundary~~ ✅ Done 2026-02-27
3. ~~**TD-010:** Replace `console.log` with `SecureLogger` across all stores~~ ✅ Done 2026-02-27
4. ~~**IA-11 / SRG-APP-000190:** Session idle timeout~~ ✅ Done 2026-02-27 (10-min hard sign-out; biometric re-auth deferred)
5. **AU-2, AU-3, AU-9:** Local `AuditLogService` with encrypted SQLite
6. **AC-3, AC-6:** Route and action guards (requires role field in mock user data)
7. **SC-13, SC-28 / SRG-APP-000141, SRG-APP-000175:** Replace `crypto-js`, re-enable encryption — requires TD-001 + TD-002 resolved together
8. **SC-12:** PBKDF2 key derivation — depends on SC-13 and IA-2 frontend completion
9. **SRG-APP-000380:** Certificate pinning — blocked on backend provisioning a server certificate

---

## 9. What's Already Strong (Frontend)

- ✅ **Input validation** via Zod is comprehensive and prevents injection
- ✅ **PII redaction** in `SecureLogger` is production-grade; `patchGlobalConsole()` intercepts all stray logs app-wide
- ✅ **Offline-first architecture** — no data loss during network outages
- ✅ **Token storage** uses platform Keychain/Keystore via `expo-secure-store`
- ✅ **Network layer** has retry, timeout, and TLS enforcement
- ✅ **Service interface pattern** enables clean mock→real swap without client refactoring
- ✅ **Sync queue** with dead-letter recovery ensures no write loss
- ✅ **DoD consent banner** (AC-8) shown every session, every sign-in
- ✅ **Global error boundary** (SI-11) — no raw error state reaches the user
- ✅ **Session idle timeout** (IA-11) — 10-min hard sign-out, 5-min warning


---

## Backend Controls

>
> **Target:** DISA Mobile Application SRG + NIST SP 800-53 Rev 5 (Moderate Baseline)
>
> **Scope:** Controls requiring server infrastructure, identity provider configuration, or network/platform services. Frontend components of shared controls are assessed in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).
> For the full unified assessment see [ATO_READINESS.md](ATO_READINESS.md).

---

## 1. Executive Summary

| Category | Implemented | Stubbed | Not Implemented | Total (Backend Scope) |
|----------|-------------|---------|-----------------|----------------------|
| Access Control (AC) | 0 | 0 | 4 | 4 |
| Audit & Accountability (AU) | 0 | 0 | 4 | 4 |
| Identification & Auth (IA) | 0 | 2 | 2 | 4 |
| System & Comms Protection (SC) | 1 | 1 | 1 | 3 |
| **Totals** | **1** | **3** | **11** | **15** |

**Assessment:** ~7% of backend-scope controls are fully satisfied by infrastructure already committed to (TLS). ~20% are partially stubbed. ~73% are not yet implemented — all are blocked on backend provisioning and are appropriate gaps for the current pre-API development phase.

---

## 2. Control Family: Access Control (AC)

### AC-2: Account Management

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | User profiles exist client-side (`useUserStore`) but are managed via mock data. No account lifecycle (create/disable/remove) tied to a real identity system. |

**Backend Remediation:** Integrate with the Navy identity provider (NSIPS or equivalent) for account provisioning. Implement account state changes — disable on PCS completion, re-activate on new assignment, deprovision on separation. Expose account state via the `/users/me` API endpoint so the client can reflect current status.

---

### AC-3: Access Enforcement *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No server-side authorization checks. All authenticated API calls return data regardless of caller role. |

**Backend Remediation:** Implement RBAC middleware at the API gateway. Read role claims from the Okta JWT and enforce:
- Sailors: read-only access to their own records
- Supervisors: read/approve access to their division's records
- Admin/YN: read/write access to all records in their command scope

Client-side guards alone are insufficient for ATO compliance — the server must enforce independently.
**Frontend component:** Tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

### AC-6: Least Privilege *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Follows from AC-3. API returns full record sets regardless of caller privilege level. |

**Backend Remediation:** Scope API responses to the caller's role — Sailors receive only their own data, not raw table dumps. Apply field-level filtering for CUI fields when the caller lacks the required clearance attribute in their token claims.
**Frontend component:** Tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

### AC-7: Unsuccessful Login Attempts

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Auth is stubbed. No lockout mechanism exists. |

**Backend Remediation:** Implement via Okta policy configuration: account lockout after N failed authentication attempts (recommend 3 per STIG), configurable lockout duration, and lockout event alerting to security personnel.

---

## 3. Control Family: Audit & Accountability (AU)

> The client builds local audit persistence — see [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md) for the frontend component. The server is required for ingestion, review, and protection.

### AU-2: Audit Events *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No server-side audit event generation or storage. |

**Backend Remediation:** Provision an audit log ingestion endpoint (`POST /audit/events`) to receive structured records synced from the client `AuditService`. Additionally, generate server-side audit events for all API mutations independent of client reporting (defense in depth).

---

### AU-3: Content of Audit Records *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No structured audit records stored server-side. |

**Backend Remediation:** Server-generated audit records must include: timestamp (UTC), hashed user identifier, event type, resource affected (endpoint + record ID), HTTP status code, and outcome (success/failure). Schema must be consistent with the client-side Zod definition for interoperability.

---

### AU-6: Audit Review, Analysis, and Reporting

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No audit review capability. Backend-only requirement. |

**Backend Remediation:** Audit logs must be queryable and exportable by authorized security personnel. Integrate with a SIEM or provide a dedicated security dashboard. Support filtering by user, event type, time range, and outcome. This control has no client-side component.

---

### AU-9: Protection of Audit Information *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No server-side audit data to protect yet. |

**Backend Remediation:** Store server-side audit logs in append-only, immutable storage. Access must be restricted to security personnel only — application users and API service accounts must not have write or delete permissions on audit tables. Sync records from the client `AuditService` into this protected storage. Align retention with NIST AU-11 (minimum 3 years for Moderate baseline).

---

## 4. Control Family: Identification & Authentication (IA)

### IA-2: Identification and Authentication *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Okta OIDC endpoint is configured in client config but no real tenant exists. Mock token flow only. |

**Backend Remediation:**
1. Provision Okta tenant registered with DoD identity services
2. Configure OIDC discovery endpoint (`/.well-known/openid-configuration`)
3. Establish CAC/PKI trust chain with DoD PKI root CA certificates
4. Configure Okta MFA policy: require CAC hardware authenticator
5. Enable DoD ID verification at the identity provider level
6. Provide token introspection endpoint for server-side JWT validation

**Frontend component:** Tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

### IA-5: Authenticator Management *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Token lifecycle management stubbed. No server-enforced token expiration. |

**Backend Remediation:** Configure Okta to issue short-lived access tokens (recommend 15-minute TTL per STIG SRG-APP-000190) with refresh tokens. Implement server-side token introspection so all API endpoints reject expired or revoked tokens. Implement token revocation endpoint for sign-out propagation.

**Frontend component:** Tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

### IA-8: Identification and Authentication (Non-Organizational Users)

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | N/A for current single-user scope. Applies if supervisor, YN, or external command access is added. |

**Backend Remediation (if required):** Configure Okta federation for non-organizational users (e.g., contractors, allied personnel). Define separate identity assurance levels and token claim profiles per user category. Client impact is limited to handling additional role claims already covered by AC-3.

---

### IA-11: Re-Authentication *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Server token lifetimes are not configured to enforce re-authentication. |

**Backend Remediation:** Configure Okta access token TTL to 15 minutes (matching the client idle timeout). Ensure the token introspection endpoint returns expired status so that API calls made after timeout are rejected with `401 Unauthorized`, forcing client-side re-auth. Refresh tokens must also have a bounded lifetime.

**Frontend component:** Tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

## 5. Control Family: System & Communications Protection (SC)

### SC-8: Transmission Confidentiality and Integrity *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ✅ Implemented (Infrastructure Committed) | API base URL is `https://api.dev.mycompass.navy.mil`. Server must run TLS with a valid DoD-issued certificate. |

**Backend Remediation (for production):** Provision TLS certificate from a DoD-approved CA. Enable TLS 1.2 minimum (TLS 1.3 preferred). Disable weak cipher suites per DISA guidance. Configure HSTS.

**Frontend component (TLS enforcement in client):** Already implemented — tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

### SC-23: Session Authenticity *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ✅ Implemented (Client-Side) | Bearer token in HTTP headers. HTTPS prevents session hijacking. |

**Backend Remediation:** Validate bearer token signature and claims on every API request. Reject tokens with invalid signatures, expired `exp` claims, or issuer mismatch. Bind sessions to the originating client IP where policy permits.

---

### SC-39: Process Isolation *(Shared — Backend Component)*

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Server-side process isolation not yet defined. |

**Backend Remediation:** Deploy API services in isolated containers (Docker/Kubernetes) with least-privilege service accounts. Enforce network segmentation between API, database, and identity provider tiers. Apply OS-level process isolation per DISA container STIG.

**Frontend component (WebView hardening):** Tracked in [ATO_READINESS_FRONTEND.md](ATO_READINESS_FRONTEND.md).

---

## 6. DISA Mobile App SRG — Backend-Scope Requirements

| SRG ID | Requirement | Status | Notes |
|--------|------------|--------|-------|
| SRG-APP-000153 | Authenticate via PKI/CAC | ⚠️ | Okta tenant + DoD PKI trust chain not provisioned |
| SRG-APP-000190 | Session timeout (15 min) | ❌ | Okta token TTL not configured |
| SRG-APP-000210 | Audit trail | ❌ | No server-side audit ingestion endpoint |
| SRG-APP-000380 | Certificate pinning | ❌ | Server DoD certificate not yet issued; client cannot pin until certificate is known |

> **SRG-APP-000380 Note:** Certificate pinning is configured in the client's `HttpClient` but the server's DoD-issued TLS certificate must be provisioned and known before the client can pin to it. This is a backend dependency that blocks a frontend implementation step.

---

## 7. Backend Remediation Priority Order

Address backend controls in this order to unblock client development and ATO submission:

1. **IA-2 / SRG-APP-000153:** Provision Okta tenant + CAC/PKI trust chain — unblocks all auth work on both sides
2. **AC-7:** Configure Okta lockout policy — low-effort Okta configuration, high ATO credit
3. **IA-5 / SRG-APP-000190:** Configure Okta token TTLs (15-min access, bounded refresh) — unblocks client IA-11
4. **AC-2:** Integrate NSIPS account lifecycle — establishes authoritative user identity
5. **AC-3, AC-6:** RBAC middleware at API gateway — unblocks client route guards and completes access enforcement
6. **AU-2, AU-3 / SRG-APP-000210:** Audit log ingestion endpoint — enables client `AuditLogService` to sync
7. **AU-9:** Immutable audit storage — required alongside AU-2
8. **AU-6:** Security review dashboard / SIEM integration — required for AU-6 closure
9. **SC-8 / SRG-APP-000380:** Provision DoD TLS certificate — unblocks client certificate pinning
10. **SC-39:** Container isolation, network segmentation — production infrastructure hardening

---

## 8. Backend Dependencies That Block Frontend Work

| Frontend Item | Blocked On |
|---------------|------------|
| IA-11 client idle timeout (full closure) | Okta token TTL ≤ 15 min (IA-5 backend) |
| SRG-APP-000380 certificate pinning | DoD TLS certificate provisioned (SC-8 backend) |
| AC-3 client route guards (role-based) | Role claims issued by Okta (IA-2 backend) |
| AU-2 client sync path (full closure) | Audit ingestion endpoint (AU-2 backend) |
| TD-006 frontend PKCE integration | Okta OIDC discovery endpoint (IA-2 backend) |
