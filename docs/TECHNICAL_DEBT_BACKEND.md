# My Compass — Backend Technical Debt Register

> **Version:** 1.1 · **Updated:** 2026-02-27 · **Status:** Pre-Production (Offline-First, Mock Data Only)
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
