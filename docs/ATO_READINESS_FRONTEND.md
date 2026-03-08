# My Compass — Frontend ATO Readiness Assessment

> **Version:** 1.2 · **Updated:** 2026-02-27 · **Status:** Pre-ATO (Development Phase)
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

**Frontend Remediation:** Replace insecure fallback key derivation in `lib/encryption.ts` with PBKDF2 derived from the user's CAC credential. Store derived key in `expo-secure-store`. See [TECHNICAL_DEBT_FRONTEND.md TD-004](TECHNICAL_DEBT_FRONTEND.md#td-004-encryption-key-management-insecure).

---

### SC-13: Cryptographic Protection

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | AES encryption code exists but is disabled. `crypto-js` is not FIPS-validated. See TD-001, TD-002. |

**Frontend Remediation:** Replace `crypto-js` with a FIPS 140-2 validated module and re-enable `encryptData/decryptData`. See [TECHNICAL_DEBT_FRONTEND.md TD-001](TECHNICAL_DEBT_FRONTEND.md#td-001-encryption-disabled) and [TD-002](TECHNICAL_DEBT_FRONTEND.md#td-002-crypto-js-not-fips-validated).

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

**Frontend Remediation:** Enable SQLite encryption once TD-001 and TD-002 are resolved. Migrate existing unencrypted data. See [TECHNICAL_DEBT_FRONTEND.md TD-001](TECHNICAL_DEBT_FRONTEND.md#td-001-encryption-disabled).

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

**Remaining gap:** Per-screen/sub-tree boundaries deferred. See TD-017 in [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md#td-017-no-per-screen-error-boundaries).

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
