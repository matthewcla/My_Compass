# services/api/ — API Integration Governance

> Read the root `CLAUDE.md` first. This file covers API-specific patterns, service contract SOPs, and data governance alignment for the service layer.

---

## Service Contract Pattern

All data access follows a dependency-inversion pattern. Stores never know whether they're talking to a mock or real API.

```
Store (useXStore) → services.x.method() → IXService interface → mockXService (current)
                                                                → realXService (future)
```

- **Interfaces:** `services/api/interfaces/I[Feature]Service.ts` — typed contracts
- **Mocks:** `services/api/mock[Feature]Service.ts` — dev implementations
- **Real (future):** `services/api/real[Feature]Service.ts` — same interface, real HTTP via `client.ts`
- **Registry:** `serviceRegistry.ts` — swaps mock ↔ real; stores never import services directly

---

## Existing Service Interfaces

| Interface | File | Domain |
|-----------|------|--------|
| `IAssignmentService` | `interfaces/IAssignmentService.ts` | Billet discovery, applications |
| `ICareerService` | `interfaces/ICareerService.ts` | Career timeline, training |
| `IDPSService` | `interfaces/IDPSService.ts` | DPS (Direct Pay System) |
| `IInboxService` | `interfaces/IInboxService.ts` | Messages, notifications |
| `ILeaveService` | `interfaces/ILeaveService.ts` | Leave requests, balance |
| `IPCSService` | `interfaces/IPCSService.ts` | PCS lifecycle, segments |
| `IUserService` | `interfaces/IUserService.ts` | User profile, auth |

---

## Building Real Service Implementations (SOPs)

When transitioning a service from mock to real:

1. **Create `real[Feature]Service.ts`** implementing the same interface
2. **Validate all responses with Zod** before returning to the store — never trust external API data
3. **Use `client.ts` for all HTTP** — it handles retry, timeout, abort, and auth token injection
4. **Map API response shapes in the service** — transform external shapes to internal types here, not in the store
5. **Return typed errors** — never throw untyped exceptions; use `ApiResult<T>` pattern from `client.ts`
6. **Document the external API contract** at the top of the file (see DSA Documentation below)
7. **Update `serviceRegistry.ts`** to point to the real implementation

```tsx
// File: services/api/realLeaveService.ts
import { apiClient } from './client';
import { LeaveRequestSchema, LeaveBalanceSchema } from '@/types/schema';
import type { ILeaveService } from './interfaces/ILeaveService';

/**
 * @DSA External System: NSIPS (Navy Standard Integrated Personnel System)
 * @DSA Data Elements: Leave balance, leave requests, approval status
 * @DSA Classification: CUI — contains PII (emergency contacts, addresses)
 * @DSA Auth: CAC/PKI via Okta OIDC → Bearer token
 * @DSA Frequency: On-demand (user-initiated), background refresh every 15m
 * @DSA Fallback: Serve cached data from SQLite when unavailable
 */
export const realLeaveService: ILeaveService = {
  getBalance: async (userId) => {
    const result = await apiClient.get(`/leave/balance/${userId}`);
    if (!result.ok) return { ok: false, error: result.error };
    const validated = LeaveBalanceSchema.safeParse(result.data);
    if (!validated.success) {
      SecureLogger.error('[LeaveService] Invalid response shape', { errors: validated.error });
      return { ok: false, error: 'Invalid API response' };
    }
    return { ok: true, data: validated.data };
  },
  // ... other methods
};
```

---

## API Design Standards

For when My Compass exposes its own endpoints or designs API contracts:

- **RESTful naming:** `/api/v1/resource` (plural nouns, not verbs)
- **Version all endpoints:** `/v1/` prefix — never break existing contracts
- **Consistent error shape:** `{ error: string, code: string, details?: unknown }`
- **Pagination:** Cursor-based for lists (`?cursor=abc&limit=20`)
- **Rate limit awareness:** Respect `Retry-After` headers; `client.ts` already retries on 429

---

## Data Sharing Agreement (DSA) Documentation

Per USN Data Governance Framework §3.5, every external API integration should be documented. Use a `@DSA` JSDoc block at the top of each `real*Service.ts` file:

| Field | What to Document |
|-------|-----------------|
| External System | Name and owner (e.g., NSIPS, eCRM, MNA) |
| Data Elements | What data is exchanged |
| Classification | Security classification (CUI, FOUO, Unclassified) |
| Auth Method | How authentication works (CAC/PKI, OAuth, API key) |
| Frequency | Real-time, batch, on-demand, polling interval |
| Fallback | Behavior when the API is unavailable (offline-first pattern) |

This is not a formal DSA — it's developer documentation that maps to the governance framework's required elements so the real DSA can be generated from code.

---

## HTTP Client

**File:** `client.ts`

Production-ready HTTP client with:
- TLS enforcement, Bearer token injection
- Retry with exponential backoff + jitter (retries on 429, 500, 502, 503, 504)
- Timeout with AbortController (30s default)
- Request/response interceptors
- Typed `ApiResult<T>` responses

**NEVER** call `fetch()` directly anywhere in the codebase. Always use `client.ts`.

---

## Anti-Patterns

**NEVER:** Call `fetch()` directly — always use `client.ts`
**ALWAYS:** All HTTP goes through the centralized client

**NEVER:** Trust API responses without Zod validation
**ALWAYS:** Validate external data at the service boundary before passing to stores

**NEVER:** Import mock services directly from stores
**ALWAYS:** Go through `serviceRegistry.ts`

**NEVER:** Put API endpoint URLs in component or store files
**ALWAYS:** Endpoint configuration lives in `config/api.ts`

**NEVER:** Throw untyped errors from service methods
**ALWAYS:** Return typed `ApiResult<T>` with structured error info

**NEVER:** Transform API response shapes in stores
**ALWAYS:** Map external → internal types in the service implementation

---

## Reference

- Root `CLAUDE.md` Rule 4.11 (USN Data Governance Compliance)
- `docs/API_INTEGRATION_ROADMAP.md` — full mock-to-real transition plan
- `docs/USN_DATA_GOVERNANCE_SUMMARY.md` — VAULTIS, Zero Trust, Data Quality reference
- `config/api.ts` — API endpoint configuration
