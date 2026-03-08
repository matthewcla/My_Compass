# My Compass — Backend ATO Readiness Assessment

> **Version:** 1.1 · **Updated:** 2026-02-27 · **Status:** Pre-ATO (Development Phase)
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
