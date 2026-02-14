# My Compass — ATO Readiness Assessment

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Status:** Pre-ATO (Development Phase)
>
> **Target:** DISA Mobile Application SRG + NIST SP 800-53 Rev 5 (Moderate Baseline)

This document assesses the current codebase against the security controls required for an Authority to Operate (ATO) under the DoD Risk Management Framework (RMF). It maps implemented controls, identifies gaps, and provides remediation guidance.

---

## 1. Executive Summary

| Category | Implemented | Stubbed | Not Implemented | Total |
|----------|-------------|---------|-----------------|-------|
| Access Control (AC) | 2 | 1 | 4 | 7 |
| Audit & Accountability (AU) | 0 | 0 | 4 | 4 |
| Identification & Auth (IA) | 1 | 2 | 2 | 5 |
| System & Comms Protection (SC) | 2 | 2 | 2 | 6 |
| System & Info Integrity (SI) | 3 | 0 | 1 | 4 |
| **Totals** | **8** | **5** | **13** | **26** |

**Assessment:** ~31% of required controls are fully implemented. ~19% are stubbed. ~50% are not yet implemented. This is appropriate for the current development phase — most missing controls require backend infrastructure.

---

## 2. Control Family: Access Control (AC)

### AC-2: Account Management

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | User profiles exist (`useUserStore`) but managed via mock data. No account lifecycle (create/disable/remove). |

**Remediation:** Integrate with Navy identity provider for account provisioning. Implement account disable on PCS completion.

### AC-3: Access Enforcement

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No authorization checks. All authenticated users have implicit full access. |

**Remediation:** Implement RBAC middleware. Define roles (Sailor, Supervisor, Admin). Gate routes and store actions by role.

### AC-6: Least Privilege

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | See AC-3. No privilege separation. |

### AC-7: Unsuccessful Login Attempts

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Auth is stubbed. No lockout mechanism. |

**Remediation:** Implement via Okta policy configuration (account lockout after N failed attempts).

### AC-8: System Use Notification

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No DoD consent banner displayed at login. |

**Remediation:** Add DoD Standard Notice and Consent Banner before authentication. Must include "You are accessing a U.S. Government information system…" text.

### AC-11: Session Lock

| Status | Notes |
|--------|-------|
| ✅ Implemented | `AuthGuard` protects all routes. App requires re-auth on fresh launch. |

### AC-17: Remote Access

| Status | Notes |
|--------|-------|
| ✅ Implemented | All network communication uses TLS. `HttpClient` enforces `https://` base URL. |

---

## 3. Control Family: Audit & Accountability (AU)

### AU-2: Audit Events

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No audit event generation. Only ephemeral console logs. |

**Remediation:** Create `AuditService` that generates structured events for: login, data access, data modification, form submission, and authorization failures.

### AU-3: Content of Audit Records

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No structured audit records. |

**Remediation:** Each audit record must include: timestamp, user identifier (hashed), event type, resource affected, outcome (success/failure).

### AU-6: Audit Review, Analysis, and Reporting

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No audit review capability. |

**Remediation:** Backend requirement. Audit logs must be exportable and searchable by security personnel.

### AU-9: Protection of Audit Information

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No audit data exists to protect. |

**Remediation:** Store audit logs in encrypted SQLite. Ensure audit data cannot be modified by the user (append-only). Sync to tamper-resistant server storage.

---

## 4. Control Family: Identification & Authentication (IA)

### IA-2: Identification and Authentication

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Okta OIDC configuration exists. Mock token flow operational. No real authentication. |

**Remediation:**
1. Complete Okta integration with `expo-auth-session`
2. Implement PKCE flow for mobile
3. Add CAC/PKI certificate authentication
4. Verify user identity via DoD ID

### IA-5: Authenticator Management

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Token stored in `expo-secure-store`. No refresh rotation or expiration handling. |

**Remediation:** Implement JWT refresh token rotation. Add token expiration checks before API calls. Clear tokens on explicit sign-out.

### IA-6: Authenticator Feedback

| Status | Notes |
|--------|-------|
| ✅ Implemented | PII fields can be masked via `privacyMode`. Password-type inputs obscure entry. |

### IA-8: Identification and Authentication (Non-Organizational Users)

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | N/A for current scope (single-user app), but may apply if supervisor access added. |

### IA-11: Re-Authentication

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | No session timeout or re-auth prompt. |

**Remediation:** Implement configurable idle timeout (recommend 15 minutes per STIG). Prompt re-authentication via biometric or PIN.

---

## 5. Control Family: System & Communications Protection (SC)

### SC-8: Transmission Confidentiality and Integrity

| Status | Notes |
|--------|-------|
| ✅ Implemented | TLS enforced on all HTTP requests. Base URL is `https://api.dev.mycompass.navy.mil`. |

### SC-12: Cryptographic Key Establishment and Management

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | Key generation code exists but uses insecure fallbacks. Not FIPS-validated. |

**Remediation:** See [TECHNICAL_DEBT.md TD-004](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/docs/TECHNICAL_DEBT.md). Replace with FIPS 140-2 validated key management.

### SC-13: Cryptographic Protection

| Status | Notes |
|--------|-------|
| ⚠️ Stubbed | AES encryption code exists but is disabled. `crypto-js` is not FIPS-validated. |

**Remediation:** See [TECHNICAL_DEBT.md TD-001, TD-002](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/docs/TECHNICAL_DEBT.md).

### SC-23: Session Authenticity

| Status | Notes |
|--------|-------|
| ✅ Implemented | Bearer token authentication in HTTP headers. HTTPS prevents session hijacking. |

### SC-28: Confidentiality of Information at Rest

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Encryption disabled. See TD-001. |

### SC-39: Process Isolation

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | WebView/native bridge isolation not hardened. Standard React Native isolation applies. |

---

## 6. Control Family: System & Information Integrity (SI)

### SI-2: Flaw Remediation

| Status | Notes |
|--------|-------|
| ✅ Implemented | Dependencies managed via `package-lock.json`. Versions pinned. Can run `npm audit`. |

### SI-3: Malicious Code Protection

| Status | Notes |
|--------|-------|
| ✅ Implemented | App distributed via controlled channels (Expo managed workflow). No dynamic code execution. |

### SI-10: Information Input Validation

| Status | Notes |
|--------|-------|
| ✅ Implemented | Zod schemas validate all user inputs. Form validation via `react-hook-form` + `@hookform/resolvers/zod`. |

### SI-11: Error Handling

| Status | Notes |
|--------|-------|
| ❌ Not Implemented | Error messages may expose internal state. No global error boundary with safe messaging. |

**Remediation:** Add React error boundary that shows generic message to user while logging details via `SecureLogger`.

---

## 7. DISA Mobile App SRG Specific Requirements

| SRG ID | Requirement | Status | Notes |
|--------|------------|--------|-------|
| SRG-APP-000141 | Use FIPS 140-2 validated crypto | ❌ | `crypto-js` is not FIPS-validated |
| SRG-APP-000153 | Authenticate via PKI/CAC | ⚠️ | Okta stub exists, no CAC integration |
| SRG-APP-000175 | Encrypt data at rest | ⚠️ | Code exists but disabled |
| SRG-APP-000190 | Session timeout (15 min) | ❌ | No idle timeout |
| SRG-APP-000210 | Audit trail | ❌ | No audit logging |
| SRG-APP-000225 | DoD banner on startup | ❌ | No consent banner |
| SRG-APP-000380 | Validate certificates | ❌ | No cert pinning |
| SRG-APP-000400 | Prevent data leakage | ✅ | PII redaction in logs, secure storage for tokens |
| SRG-APP-000514 | FIPS crypto modules | ❌ | See SRG-APP-000141 |

---

## 8. Remediation Priority Order

For ATO submission, address controls in this order:

1. **SC-13 / SRG-APP-000141:** Replace `crypto-js` → FIPS-validated crypto, re-enable encryption
2. **IA-2 / SRG-APP-000153:** Complete Okta + CAC/PKI authentication
3. **AC-8 / SRG-APP-000225:** Add DoD consent banner
4. **AU-2 / SRG-APP-000210:** Implement audit logging
5. **IA-11 / SRG-APP-000190:** Add session timeout (15 min idle)
6. **AC-3:** Implement RBAC
7. **SC-28 / SRG-APP-000175:** Enable data-at-rest encryption with FIPS key management
8. **SRG-APP-000380:** Add certificate pinning

---

## 9. What's Already Strong

- ✅ **Input validation** via Zod is comprehensive and prevents injection
- ✅ **PII redaction** in logging is production-grade
- ✅ **Offline-first architecture** — no data loss during network outages
- ✅ **Token storage** uses platform Keychain/Keystore
- ✅ **Network layer** has retry, timeout, and TLS enforcement
- ✅ **Service interface pattern** enables clean mock→real swap without refactoring
- ✅ **Sync queue** with dead-letter recovery ensures no write loss
