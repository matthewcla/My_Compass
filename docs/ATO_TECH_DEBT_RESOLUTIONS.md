# My Compass — ATO & Tech Debt Resolution Paths

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Status:** Pre-ATO Analysis

This document categorizes all ATO and technical debt items by their resolution path: Claude Code (client-side), Gov't Okta implementation, Gov't API implementation (MNA, NSIPS, etc.), or items that fall outside all three.

---

## Resolvable via Claude Code (client-side code changes)

| Item | Description |
|------|-------------|
| **TD-001** | Re-enable encryption (implement `encryptData`/`decryptData` with Web Crypto API) |
| **TD-002** | Replace `crypto-js` with `react-native-quick-crypto` or Web Crypto API (SubtleCrypto) |
| **TD-003** | Remove `@vercel/analytics` from dependencies |
| **TD-004** | Fix key management — derive from credential via PBKDF2, store in SecureStore |
| **TD-009** | Encrypt sync queue payloads before AsyncStorage persistence |
| **TD-010** | Replace `console.log` with `SecureLogger` in all stores |
| **TD-011** | Split `storage.ts` monolith into domain repositories |
| **TD-012** | Centralize mock data into `data/` directory |
| **TD-013** | Implement SQLite migration versioning system |
| **TD-014** | Add test coverage (RNTL component tests, E2E) |
| **TD-015** | Add performance benchmark scripts |
| **TD-016** | Audit and potentially remove `moti` |
| **AC-3/AC-6** | Implement RBAC middleware, role guards on routes and store actions |
| **AC-8** | Add DoD Standard Notice and Consent Banner at login |
| **AU-2/AU-3** | Create `AuditLogService` with structured local logging to encrypted SQLite |
| **AU-9** | Append-only local audit storage with encryption |
| **IA-5** | Token refresh rotation, expiration checks, clear on sign-out |
| **IA-11** | 15-minute idle session timeout with re-auth prompt |
| **SI-11** | Add React error boundary with generic user-facing messages |
| **SRG-APP-000380** | Certificate pinning (client-side config) |
| **SC-39** | WebView/native bridge isolation hardening |

---

## Resolvable via Gov't Okta Implementation

| Item | Description |
|------|-------------|
| **IA-2** | Real Okta OIDC + PKCE flow via `expo-auth-session` (needs a real Okta tenant) |
| **AC-7** | Account lockout after N failed attempts (Okta policy config) |
| **AC-2** | Account lifecycle provisioning/deprovisioning (Okta + SCIM) |
| **CAC/PKI** | DoD PKI trust chain integration through Okta (requires DoD PKI cert authority access) |
| **TD-006** | Real auth flow — requires a provisioned Okta tenant with Navy IdP federation |

---

## Resolvable via Gov't API Implementation (MNA, NSIPS, etc.)

| Item | Description |
|------|-------------|
| **TD-005** | Wire real service implementations to Navy APIs (assignments, leave, PCS, career, inbox, user) |
| **TD-007** | RBAC role data — the role definitions come from Claude Code, but the **authoritative role source** needs a backend/API (who is a supervisor vs. sailor) |

---

## NOT Resolvable Through Any of These Three

| Item | Why | What's Needed |
|------|-----|---------------|
| **SRG-APP-000141 / SRG-APP-000514 (FIPS 140-2 validated crypto)** | Claude Code can swap the library, but **FIPS 140-2 validation is a certification process**, not a code change. `react-native-quick-crypto` wraps OpenSSL which *can* be FIPS-capable, but the specific build must be validated and documented. You need to verify the OpenSSL version used is on the NIST CMVP validated modules list for your target platform. | FIPS validation documentation / approved module selection from your ISSM or cybersecurity team |
| **AU-6 (Audit Review, Analysis, and Reporting)** | This requires a **backend system** where security personnel can search, filter, and review audit logs. It's not a Navy API (MNA/NSIPS) — it's a **new backend service** your program would need to build or procure. | A server-side audit log aggregation and review platform (e.g., Splunk, ELK, or a custom DoD-hosted solution) |
| **SC-28 with FIPS key management** | Same FIPS certification concern as above — the encryption code is writable, but the **key management scheme needs approval** from your ISSM to confirm it meets FIPS requirements for your specific deployment. | ISSM/cybersecurity review of the key lifecycle |
| **ATO package itself** | The RMF process (SSP, SAR, POA&M, CONOPS, etc.) requires documentation artifacts, scans (ACAS/SCC), and assessor review that are entirely outside the codebase. | Your AO, ISSM, and SCA team |

---

## Summary

- **~21 items** are fully resolvable through Claude Code (client-side implementation)
- **~5 items** need a real Gov't Okta tenant
- **~2 items** need Gov't API endpoints (MNA/NSIPS)
- **~4 items** require actions outside all three channels — primarily FIPS certification verification, a backend audit review platform, and the ATO documentation package itself

The biggest risk items that fall outside your three channels are the **FIPS validation documentation** and the **audit review backend**. Everything else is either code or configuration work.
