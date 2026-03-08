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
| **AC-2** | Account Management | ⚠️ Stubbed | [Backend](ATO_READINESS_BACKEND.md#ac-2-account-management) |
| **AC-3** | Access Enforcement | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#ac-3-access-enforcement-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#ac-3-access-enforcement-shared--backend-component) |
| **AC-6** | Least Privilege | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#ac-6-least-privilege-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#ac-6-least-privilege-shared--backend-component) |
| **AC-7** | Unsuccessful Login Attempts | ❌ Not Implemented | [Backend](ATO_READINESS_BACKEND.md#ac-7-unsuccessful-login-attempts) |
| **AC-8** | System Use Notification (DoD Banner) | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#ac-8-system-use-notification) |
| **AC-11** | Session Lock | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#ac-11-session-lock) |
| **AC-17** | Remote Access (TLS) | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#ac-17-remote-access-shared--frontend-component) |
| **AU-2** | Audit Events | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#au-2-audit-events-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#au-2-audit-events-shared--backend-component) |
| **AU-3** | Content of Audit Records | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#au-3-content-of-audit-records-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#au-3-content-of-audit-records-shared--backend-component) |
| **AU-6** | Audit Review, Analysis, and Reporting | ❌ Not Implemented | [Backend](ATO_READINESS_BACKEND.md#au-6-audit-review-analysis-and-reporting) |
| **AU-9** | Protection of Audit Information | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#au-9-protection-of-audit-information-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#au-9-protection-of-audit-information-shared--backend-component) |
| **IA-2** | Identification and Authentication | ⚠️ Stubbed | [Frontend](ATO_READINESS_FRONTEND.md#ia-2-identification-and-authentication-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#ia-2-identification-and-authentication-shared--backend-component) |
| **IA-5** | Authenticator Management | ⚠️ Stubbed | [Frontend](ATO_READINESS_FRONTEND.md#ia-5-authenticator-management-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#ia-5-authenticator-management-shared--backend-component) |
| **IA-6** | Authenticator Feedback | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#ia-6-authenticator-feedback) |
| **IA-8** | Auth — Non-Organizational Users | ❌ N/A | [Backend](ATO_READINESS_BACKEND.md#ia-8-identification-and-authentication-non-organizational-users) |
| **IA-11** | Re-Authentication | ⚠️ Partial | [Frontend](ATO_READINESS_FRONTEND.md#ia-11-re-authentication-shared--frontend-component) ✅ + [Backend](ATO_READINESS_BACKEND.md#ia-11-re-authentication-shared--backend-component) ❌ |
| **SC-8** | Transmission Confidentiality | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#sc-8-transmission-confidentiality-and-integrity-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#sc-8-transmission-confidentiality-and-integrity-shared--backend-component) |
| **SC-12** | Cryptographic Key Management | ⚠️ Stubbed | [Frontend](ATO_READINESS_FRONTEND.md#sc-12-cryptographic-key-establishment-and-management) |
| **SC-13** | Cryptographic Protection | ⚠️ Stubbed | [Frontend](ATO_READINESS_FRONTEND.md#sc-13-cryptographic-protection) |
| **SC-23** | Session Authenticity | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#sc-23-session-authenticity) |
| **SC-28** | Confidentiality at Rest | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#sc-28-confidentiality-of-information-at-rest) |
| **SC-39** | Process Isolation | ❌ Not Implemented | [Frontend](ATO_READINESS_FRONTEND.md#sc-39-process-isolation-shared--frontend-component) + [Backend](ATO_READINESS_BACKEND.md#sc-39-process-isolation-shared--backend-component) |
| **SI-2** | Flaw Remediation | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#si-2-flaw-remediation) |
| **SI-3** | Malicious Code Protection | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#si-3-malicious-code-protection) |
| **SI-10** | Information Input Validation | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#si-10-information-input-validation) |
| **SI-11** | Error Handling | ✅ Implemented | [Frontend](ATO_READINESS_FRONTEND.md#si-11-error-handling) |

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
