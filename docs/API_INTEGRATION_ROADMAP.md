# My Compass — API Integration Roadmap

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Status:** Pre-Integration (All Services Mocked)

This document describes how the codebase is structured for the transition from mock services to live Navy HR data systems, which systems to connect, and what needs to change.

---

## 1. Current Architecture

### Service Interface Pattern

My Compass uses a **dependency-inversion pattern** — all data access goes through typed interfaces. Mock implementations are injected via a central registry.

```
Store (useXStore) → services.x.method() → IXService interface → mockXService (current)
                                                               → realXService (future)
```

**Registry file:** [serviceRegistry.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/api/serviceRegistry.ts)

```typescript
export const services: ServiceRegistry = {
    assignment: mockAssignmentService,  // → realAssignmentService
    career:     mockCareerService,      // → realCareerService
    user:       mockUserService,        // → realUserService
    pcs:        mockPCSService,         // → realPCSService
    inbox:      mockInboxService,       // → realInboxService
    leave:      mockLeaveService,       // → realLeaveService
};
```

**To swap:** Create `realXService.ts` implementing the same interface, then update the registry. No store or component code changes required.

### Interface Contracts

| Interface | File | Methods |
|-----------|------|---------|
| `IAssignmentService` | `services/api/interfaces/IAssignmentService.ts` | `getBillets`, `getApplications`, `submitApplication`, etc. |
| `ICareerService` | `services/api/interfaces/ICareerService.ts` | `getCareerTimeline`, `getTrainingHistory` |
| `IUserService` | `services/api/interfaces/IUserService.ts` | `getCurrentUser`, `updateProfile` |
| `IPCSService` | `services/api/interfaces/IPCSService.ts` | `getOrders`, `getChecklist`, `updateChecklistItem` |
| `IInboxService` | `services/api/interfaces/IInboxService.ts` | `getMessages`, `markRead`, `archiveMessage` |
| `ILeaveService` | `services/api/interfaces/ILeaveService.ts` | `submitLeaveRequest`, `getLeaveBalance`, `getDrafts` |

### HTTP Client

**File:** [client.ts](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/services/api/client.ts)

Production-ready HTTP client already exists with:
- TLS enforcement, Bearer token injection
- Retry with exponential backoff + jitter
- Timeout with AbortController
- Request/response interceptors
- Typed `ApiResult<T>` responses

---

## 2. Navy Systems Mapping

### Which System Provides What

| Navy System | Data Domain | My Compass Service | Priority |
|-------------|-------------|-------------------|----------|
| **NSIPS** (Navy Standard Integrated Personnel System) | Service records, leave balances, personal data | `IUserService`, `ILeaveService` | P1 — Core |
| **eCRM** (electronic Career Resource Management) | Billet listings, applications, detailer communication | `IAssignmentService` | P1 — Core |
| **MNA** (My Navy Assignment) | Order negotiation, assignment history | `IAssignmentService`, `IPCSService` | P1 — Core |
| **ADE** (Authoritative Data Environment) | Consolidated personnel data | `IUserService` (profile enrichment) | P2 — Enhancement |
| **DPS** (Defense Personal Property System) | HHG shipment tracking | `IPCSService` (HHG widget) | P2 — Enhancement |
| **DTS** (Defense Travel System) | Travel claims, vouchers | Future `ITravelService` | P3 — Future |
| **NFAAS** (Navy Family Accountability & Assessment System) | Dependent data | `IUserService` (dependents) | P3 — Future |

### Data Classification

| Data Type | CUI Category | Handling |
|-----------|-------------|----------|
| DoD ID, SSN | PII | Encrypt at rest, never log, mask in UI |
| Leave balances, duty station | FOUO | Encrypt at rest |
| Billet listings | Unclassified | Standard handling |
| Order details (gaining/losing command) | FOUO | Encrypt at rest |
| Financial data (DLA, advance pay) | PII/FOUO | Encrypt at rest, never log |
| Emergency contact info | PII | Encrypt at rest, never log |

---

## 3. Integration Phases

### Phase A: Authentication (Prerequisite)

**Before any API connection:**

1. Replace mock auth with real Okta OIDC + CAC/PKI
2. Implement PKCE flow via `expo-auth-session`
3. Configure token refresh rotation
4. Update `HttpClient.getAuthToken` to return real JWT
5. Add DoD consent banner (AC-8)

**Verification:** User can authenticate with CAC and receive valid JWT.

### Phase B: Read-Only APIs (Low Risk)

Connect read-only endpoints first — no mutation risk.

| Service | Method | Navy System | What Changes |
|---------|--------|------------|--------------|
| `IUserService` | `getCurrentUser` | NSIPS | Real profile from JWT claims + NSIPS API |
| `IAssignmentService` | `getBillets` | eCRM | Real billet feed |
| `ILeaveService` | `getLeaveBalance` | NSIPS | Real leave accrual data |
| `IInboxService` | `getMessages` | Internal | Message queue from Navy middleware |

**What to build:**
- `realUserService.ts` — map NSIPS response to `User` type
- `realAssignmentService.ts` — map eCRM response to `Billet[]` type
- Environment flag: `EXPO_PUBLIC_USE_MOCK_SERVICES=true|false`

### Phase C: Write APIs (Higher Risk)

Mutations that create or modify records in Navy systems.

| Service | Method | Navy System | Risk |
|---------|--------|------------|------|
| `ILeaveService` | `submitLeaveRequest` | NSIPS | Modifies official leave record |
| `IAssignmentService` | `submitApplication` | eCRM | Creates application in detailer system |
| `IPCSService` | `updateChecklistItem` | Internal | State tracking (may not need Navy API) |

**What to build:**
- Sync queue integration — enqueue mutations when offline
- Optimistic UI updates with rollback on failure
- Confirmation modals before destructive actions
- Audit logging for all write operations

### Phase D: Real-Time Data

| Feature | Technology | Navy System |
|---------|-----------|------------|
| Billet availability updates | WebSocket or SSE | eCRM |
| Leave approval notifications | Push notifications | NSIPS |
| Order status changes | Polling or webhook | MNA |

---

## 4. Environment Configuration

### Proposed Config Structure

```typescript
// config/api.ts (updated)
export const API_CONFIG = {
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://api.dev.mycompass.navy.mil',
    useMockServices: process.env.EXPO_PUBLIC_USE_MOCK_SERVICES === 'true',
    timeout: 30_000,
    maxRetries: 3,
    retryBaseDelay: 1_000,
};
```

### Proposed Registry Update

```typescript
// services/api/serviceRegistry.ts (updated)
import { API_CONFIG } from '@/config/api';

export const services: ServiceRegistry = {
    assignment: API_CONFIG.useMockServices ? mockAssignmentService : realAssignmentService,
    // ... etc
};
```

---

## 5. Offline-First Considerations

The offline sync architecture is already built:

| Component | File | Status |
|-----------|------|--------|
| `SyncQueueService` | `services/syncQueue.ts` | ✅ Implemented |
| `HttpClient` with retry | `services/api/client.ts` | ✅ Implemented |
| SQLite local storage | `services/storage.ts` | ✅ Implemented |
| Optimistic UI pattern | Store actions | ✅ Pattern established |

**When connecting real APIs:**
1. Read operations: Cache results in SQLite, serve from cache when offline
2. Write operations: Enqueue in sync queue, process when connectivity resumes
3. Conflict resolution: Server-wins strategy with user notification

---

## 6. Checklist: Ready to Connect

Before declaring "API-ready," ensure:

- [ ] Replace `crypto-js` with FIPS-validated crypto (TD-002)
- [ ] Re-enable data-at-rest encryption (TD-001)
- [ ] Complete CAC/PKI authentication (TD-006)
- [ ] Implement RBAC (TD-007)
- [ ] Implement audit logging (TD-008)
- [ ] Encrypt sync queue payloads (TD-009)
- [ ] Replace `console.log` with `SecureLogger` in all stores (TD-010)
- [ ] Remove `@vercel/analytics` (TD-003)
- [ ] Add DoD consent banner
- [ ] Add session timeout (15 min)
- [ ] Add certificate pinning for Navy API endpoints
- [ ] Create `real*Service.ts` implementations
- [ ] Add environment-based service resolution
- [ ] Generate SBOM for ATO package
