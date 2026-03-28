# My Compass -- Architecture Review

> **Date:** 2026-03-28
> **Reviewer:** Architecture Review (AI-Assisted)
> **Codebase State:** `main` branch, commit `ba5a8a6`
> **Scope:** Full client-side architecture (no backend exists)

---

## 1. Executive Summary

### Overall Maturity: Development (Late Prototype)

The codebase is a well-structured prototype with strong architectural foundations for offline-first military personnel management. The dependency-inversion pattern for services, the storage facade with repository decomposition, and the Zustand store conventions are mature design decisions. However, several P0 security gaps (disabled encryption, mock auth, unencrypted sync queue) and architectural risks (1,261-line PCS store, `console.log` bypassing SecureLogger, web storage parity gaps) must be resolved before any production or ATO consideration.

### Key Architectural Strengths

- **Clean service abstraction**: Typed interfaces (`I*Service`) with a central registry enable zero-friction mock-to-real API transition. Stores never know what backs the data.
- **Offline-first by design**: Cache-first reads, optimistic writes, and a dedicated sync queue with exponential backoff and dead-letter support are woven into the store pattern.
- **Well-documented governance**: The CLAUDE.md constitution, sub-CLAUDE.md files, and reference docs form a comprehensive decision framework that keeps AI and human contributors aligned.
- **Storage facade refactored**: The formerly monolithic `storage.ts` (TD-011) has been decomposed into `IStorageService` + domain repositories (`UserRepository`, `LeaveRepository`, etc.), with platform-aware selection (SQLite vs. Web vs. Mock).
- **Zod validation at boundaries**: User, Billet, Application, and Leave schemas use Zod for parse-time validation, and the `UserRepository` validates rows via `UserSchema.parse()` on read.
- **Production-ready HTTP client**: `client.ts` implements retry with jittered backoff, timeout via AbortController, interceptors, and typed `ApiResult<T>` -- ready for real API integration.

### Top 5 Structural Risks

1. **CRITICAL -- Encryption fully disabled**: `encryptData`/`decryptData` in `lib/encryption.ts` are no-op passthroughs (lines 50-53, 63-64). All PII (DoD ID, SSN, emergency contacts) stored in SQLite and localStorage is plaintext. This is the single biggest blocker for any DoD deployment.

2. **CRITICAL -- Auth is entirely simulated**: `lib/ctx.tsx` sets a hardcoded `'mock-okta-access-token'` (line 75). No real OIDC, no PKCE, no token validation. Combined with disabled encryption, this means zero security posture.

3. **HIGH -- `usePCSStore.ts` is a 1,261-line monolith**: This store contains PCS lifecycle, segment management, HHG shipments, financial calculations, travel claims, receipt vault, liquidation tracking, PDF caching, and DPS integration. It is the largest and most complex file in the codebase, violating the "one concern per store" principle and making it fragile to edit.

4. **HIGH -- `console.log` bypasses SecureLogger in critical paths**: Despite TD-010 being marked resolved, `console.error` calls remain in `syncQueue.ts` (3 instances), `lib/ctx.tsx` (6 instances logging auth flow details), `services/storage.web.ts` (11+ instances), `services/migrations.ts` (3 instances), `services/repositories/` (6+ instances), and `usePCSStore.ts` (1 instance). The `SecureLogger.patchGlobalConsole()` in `_layout.tsx` line 16 provides a safety net, but code that runs before layout initialization or outside the React tree (service layer) may bypass it.

5. **HIGH -- Web storage is a second-class citizen**: `storage.web.ts` implements PCS orders and documents as no-ops (lines 336-345 -- empty function bodies). The web version uses `localStorage` with `crypto-js` encryption (itself disabled), while native uses SQLite with repository decomposition. Feature parity is incomplete.

---

## 2. System Architecture Evaluation

### 2.1 Application Layer

**Expo Router file-based routing**: Well-organized with tab groups matching the app's spoke model (`(hub)`, `(assignment)`, `(career)`, `(pcs)`, `(admin)`, `(profile)`, `(calendar)`). Typed routes are enabled via `experiments.typedRoutes` in `app.json:74`.

**Provider hierarchy** (`app/_layout.tsx`):
```
GestureHandlerRootView > SafeAreaProvider > SessionProvider > InnerLayout
```

This is correct -- gesture handler must be outermost, session context wraps the layout. The `InnerLayout` component handles four initialization gates: fonts, database, layout readiness, and session loading. The splash screen orchestration at lines 122-127 waits for all four before hiding, with a 5-second safety timeout (line 111).

**Strengths:**
- Error boundary exported at module level (line 33) via `AppErrorBoundary` -- satisfies SI-11.
- Session timeout with idle detection (`useIdleTimeout` at line 64) active only when authenticated and past consent.
- Touch responder capture on root View (line 147) resets idle timer on any interaction.
- Database init has cancellation support (line 84) to prevent stale state.

**Weaknesses:**
- `usePCSStore.getState().initializeOrdersCache()` is called directly in the init effect (line 96) outside the async chain -- it runs in parallel with storage init but does not await completion. If it depends on `storage.init()`, this is a race condition.
- `registerForPushNotificationsAsync()` is called on every splash hide (line 125), not just once on first auth. This should be guarded.
- The `InnerLayout` function is 110+ lines and handles splash orchestration, idle timeout, theme, keyboard toolbar, and session timeout -- it would benefit from extraction.

**Auth guard chain** (`components/navigation/AuthGuard.tsx`):
Three-state routing: unauthenticated -> sign-in, authenticated without consent -> consent, authenticated with consent -> tabs. Demo mode bypasses consent (line 38). The guard correctly runs as a `useEffect` reacting to session, segments, and consent state. The `protectedGroups` whitelist at lines 20-31 is explicit, which is safer than a blacklist, but new route groups must be manually added here.

**Error boundary strategy**: Single global boundary (`AppErrorBoundary`). No per-screen boundaries exist (acknowledged as TD-017). A crash in any widget or screen unmounts the entire app.

### 2.2 State Management Layer

**Store inventory**: 16 store files in `store/`, including a duplicate file `useBottomSheetStore 2.ts` (18 lines, identical content -- should be deleted).

**Pattern consistency**: Most stores follow the documented convention (separate State/Actions interfaces, section comments, selector hooks). Notable deviations:

| Store | Lines | Convention Compliance | Notes |
|-------|------:|----------------------|-------|
| `useLeaveStore` | ~614 | Good | Canonical pattern; missing selector hooks |
| `useAssignmentStore` | ~842 | Good | Write-behind buffer is a sophisticated optimization |
| `usePCSStore` | ~1,261 | Poor | Monolith; mixes 7+ concerns; uses `persist` middleware |
| `useUserStore` | ~202 | Good | Clean, good selector hooks |
| `useInboxStore` | ~100 | Fair | Actions mixed into State interface |
| `useCareerStore` | ~67 | Fair | Actions mixed into State interface |
| `useTravelClaimStore` | ~545 | Good | Deprecated; logic moved to PCS store |
| `useDemoStore` | ~310 | Fair | Heavy cross-store coupling via `require()` |
| `usePCSArchiveStore` | ~403 | Good | Clean pattern with selector hooks |
| `useAdminStore` | ~446 | Good | Bridge pattern to aggregate leave requests |
| `useUIStore` | ~36 | Good | Minimal; uses persist for theme only |
| `useHeaderStore` | ~134 | Fair | Module-level mutable variables (lines 33-35) |
| `useProfileTimelineStore` | ~294 | Good | Pure computation; no persistence needed |
| `useBottomSheetStore` | ~18 | Good | Minimal |
| `useSyncQueueStore` | ~39 | Good | Event-driven subscribe pattern |

**Data flow patterns**: Stores correctly implement cache-first reads (load from storage, display, then background refresh). The `useInboxStore` and `useCareerStore` implement a cache duration check (5 minutes) to avoid redundant fetches. The `useAssignmentStore` implements a write-behind buffer (`pendingSwipes` at line 216) that batches decision persistence every 2 seconds or every 5 swipes -- a thoughtful optimization for rapid swiping.

**Cross-store dependencies**: The `useDemoStore` is the most coupled store, using `require()` to lazily import `usePCSStore` in three places (lines 115, 207, 224) and `usePCSArchiveStore` in one (line 248). This avoids circular import crashes but creates hidden runtime dependencies. `useAdminStore` reads from `useLeaveStore` via `getState()` to bridge leave requests. `usePCSStore` reads from `useUserStore` and `useDemoStore` via `getState()` helpers. These cross-store reads are done outside React's render cycle (via `getState()`), which is correct for Zustand.

**Selector hook patterns**: `useUserStore` exports 13 granular selector hooks (lines 179-201) -- excellent for preventing re-renders. However, `useLeaveStore` exports zero selector hooks, and `useAssignmentStore` exports `selectManifestItems` as a standalone function rather than a hook. This inconsistency means some consumers may subscribe to the entire store.

**Store size distribution**: `usePCSStore` at 1,261 lines is 3x larger than the next biggest store (`useAssignmentStore` at 842). It manages active orders, checklist, financials (advance pay, DLA, OBLISERV, HHG, moving costs, liquidation), receipts, travel claims, segment planning, PDF caching, and multi-shipment HHG -- all in one file with `persist` middleware.

### 2.3 Service Layer

**Interface abstraction quality**: Seven service interfaces in `services/api/interfaces/` define clean, typed contracts. They use `ApiResult<T>` and `PaginatedApiResult<T>` consistently. The interfaces are minimal -- `ICareerService` has one method, `ILeaveService` has three -- which keeps them focused.

**Registry pattern**: `serviceRegistry.ts` is a simple object literal mapping service names to mock implementations. It exports a typed `ServiceRegistry` interface. The swap mechanism is straightforward: replace `mockXService` with `realXService`. However, there is no runtime toggle (e.g., `IS_MOCK_MODE` environment variable) -- the switch requires a code change and rebuild.

**Mock-to-real transition readiness**: HIGH. The `HttpClient` in `client.ts` is production-grade with retry, timeout, abort, interceptors, and typed error responses. The `@DSA` documentation pattern in `services/api/CLAUDE.md` provides a template for documenting external API contracts. The `API_INTEGRATION_ROADMAP.md` maps each Navy system to a service interface. The gap is that `IDPSService` is defined but not included in the `ServiceRegistry` interface or `serviceRegistry.ts` (it has a mock service but is not wired through the registry).

**Error handling and result types**: The `ApiResult<T>` discriminated union (`types/api.ts`) is well-designed with structured error codes, retryability flags, and optional retry-after durations. Type guard functions `isApiSuccess()` and `isPaginatedSuccess()` are provided. Mock services return this format, so the transition to real services will be seamless.

### 2.4 Storage Layer

**Three-tier model**:
- Tier 1 (`expo-secure-store`): Used in `useStorageState.ts` for session token only. No other sensitive data uses SecureStore.
- Tier 2 (`expo-sqlite`): User records, billets, applications, leave, PCS orders, documents. WAL journal mode enabled (`DatabaseManager.ts:56`). Repository pattern with platform selection.
- Tier 3 (`AsyncStorage`): Sync queue, UI preferences, demo state, travel claims, PCS archive, PCS store (via Zustand `persist`).

**SQLite schema and migration strategy**: Tables are defined in `types/schema.ts` via `initializeSQLiteTables()`. Migrations in `services/migrations.ts` use a version table (`schema_version`) and 7 migrations. The runner (line 134) has a critical design flaw: it runs ALL migrations every time and catches "already exists" errors to skip applied ones (lines 157-179). This means the `schema_version` table is never actually consulted -- the version is written but not read. The migration runner lacks `down()` rollback capability, and the `DatabaseManager.init()` calls `initializeSQLiteTables()` which creates tables unconditionally, potentially conflicting with migration-created tables.

**Storage facade assessment**: The formerly monolithic `storage.ts` has been successfully refactored into:
- `storage.interface.ts`: `IStorageService` with 25 methods across 8 domains
- `storage.ts`: Facade delegating to 8 repositories via `.bind()`
- `services/repositories/`: 8 domain-specific repository files
- `services/db/DatabaseManager.ts`: Centralized DB connection, write queue, transactions

This is a significant improvement. The `DatabaseManager.enqueueWrite()` (line 37) implements a sequential write queue to prevent concurrent SQLite writes. The `withWriteTransaction()` method uses `withExclusiveTransactionAsync` on native and `withTransactionAsync` on web.

**Platform-specific storage handling**: The `UserRepository.ts` demonstrates the platform selection pattern: `SQLiteUserRepository` (native), `WebUserRepository` (localStorage), `MockUserRepository` (in-memory), selected at module load based on `Platform.OS` and `EXPO_PUBLIC_USE_MOCKS`. However, `storage.web.ts` still exists as a separate monolithic web implementation (348 lines) that is apparently not used by the new facade pattern -- `storage.ts` delegates to repositories that handle platform selection internally. `storage.web.ts` may be dead code.

**Zod validation on read**: `UserRepository.mapRowToUser()` uses `UserSchema.parse()` (line 79), which is excellent for data integrity. However, this validation is only confirmed in the UserRepository. Other repositories should be checked for consistent Zod validation on read.

### 2.5 Network Layer

**HTTP client design** (`services/api/client.ts`): The `HttpClient` class is well-engineered:
- Configurable via `HttpClientConfig` with sensible defaults from `config/api.ts`
- Auth token injection via async `getAuthToken` callback (line 160)
- Combined abort signals for timeout and caller cancellation (line 184)
- Status-code-aware retry: only 429, 500, 502, 503, 504 (line 29)
- Jittered exponential backoff capped at 30 seconds (line 53)
- Request/response interceptor pipelines
- Structured error responses with `retryable` and `retryAfterMs` fields

**Weakness**: The `httpClient` singleton (line 266) is created without a `getAuthToken` callback. Unless a request interceptor is added later to inject auth, the default instance will never send auth tokens. The mock phase masks this -- real API integration will need to configure this.

**Offline sync queue** (`services/syncQueue.ts`): Solid implementation with:
- Incremental persistence (dirty-tracking per operation, not full queue writes)
- Chunked AsyncStorage writes (50 items per batch) to avoid Android IPC limits
- Legacy data migration from single-blob to incremental format
- Dead-letter queue for permanently failed operations
- Retry with exponential backoff capped at 60 seconds
- Debounced persistence (500ms) to batch rapid enqueues
- Hydration resets in-flight operations to pending on app restart

**Conflict resolution approach**: Currently absent. The codebase uses optimistic updates (e.g., `useLeaveStore.submitRequest` creates a temp ID, then swaps to server ID on success). However, there is no last-write-wins, vector clock, or merge strategy for when offline edits conflict with server state. This is acceptable for the mock phase but will need addressing before real API integration, particularly for leave requests that could be approved/denied server-side while the client is offline.

---

## 3. Design Pattern Assessment

### Offline-First Architecture vs. DoD DIL Requirements

The app largely satisfies DIL requirements at the design level:
- **Reads**: Cache-first pattern in stores loads from SQLite before attempting network.
- **Writes**: Optimistic local updates + sync queue for background retry.
- **UI**: Never blocks on network; cached data always displayed.
- **Sync queue**: Exponential backoff with dead-letter support handles extended disconnection.

**Gap**: The sync queue stores payloads in AsyncStorage (Tier 3, unencrypted). For real mutations containing CUI/PII, this violates data-at-rest requirements (acknowledged as TD-009). Additionally, no mechanism exists to inform the user about stale data age -- stores track `lastSyncTimestamp` but no UI component displays data freshness warnings.

### Data Flow Traceability (VAULTIS Alignment)

| Principle | Assessment |
|-----------|------------|
| **Visible** | Good -- every entity has a typed definition in `types/` and a Zustand store |
| **Accessible** | Good -- typed service interfaces in `services/api/interfaces/` |
| **Understandable** | Good -- Zod schemas document data shape; field names are self-describing |
| **Linked** | Fair -- foreign keys are implicit (e.g., `userId` strings) rather than enforced |
| **Trustworthy** | Partial -- Zod validation exists at UserRepository read boundary; not confirmed across all repositories |
| **Interoperable** | Good -- standardized service interfaces with typed results |
| **Secure** | Poor -- encryption disabled, auth simulated, sync queue unencrypted |

### Separation of Concerns

Generally good with one major exception:
- **Services**: Clean separation of interface, mock, and registry.
- **Storage**: Successfully decomposed into repositories.
- **Stores**: Most are single-concern. `usePCSStore` is the glaring exception -- it conflates 7+ domains.
- **Types**: Zod schemas in `types/` are the source of truth for data shape.
- **Business logic**: JTR calculations in `utils/jtr.ts`, HHG weight in `utils/hhg.ts`, travel claim calculations in `utils/travelClaimCalculations.ts` -- correctly placed in utilities, not in stores.

### Error Handling Strategy

The codebase uses a mixed strategy:
- **Service layer**: `ApiResult<T>` discriminated union -- consistent and typed.
- **Store layer**: `try/catch` with `SecureLogger.error()` and graceful degradation (set `isLoading: false`, preserve cached data).
- **Storage layer**: `DataIntegrityError` custom error class; graceful healing in web storage (parse failures return null/empty).
- **UI layer**: Global error boundary (`AppErrorBoundary`); no per-screen boundaries.
- **Gap**: No centralized error reporting service. Errors are logged locally but have no path to a server for monitoring.

---

## 4. Scalability & Maintainability Risks

### `usePCSStore` Monolith

At 1,261 lines, this store manages:
1. Active PCS order lifecycle
2. Checklist generation and status tracking
3. Financial calculations (MALT, per diem, DLA)
4. Advance pay management
5. OBLISERV determination
6. HHG multi-shipment management
7. Moving cost breakdowns
8. Receipt vault (add/remove/update)
9. Travel claim settlement
10. Liquidation tracking
11. PDF caching (with file system operations)
12. Segment planning and commitment

This violates the "one store per feature domain" principle and makes it the highest-risk file for merge conflicts and regression bugs. It also uses `persist` middleware with AsyncStorage, meaning the entire serialized state (including complex nested objects) is written on every change.

### Store Proliferation

16 stores is reasonable for the app's scope, but the demo/real split creates implicit coupling. `useDemoStore` uses `require()` for lazy imports of `usePCSStore` and `usePCSArchiveStore`, creating runtime dependencies invisible to static analysis. A circular dependency between `useTravelClaimStore.createPCSClaimFromOrder` and `usePCSStore` is handled via dynamic `import()` (line 465 of useTravelClaimStore).

### Mock Data Coupling

Several stores embed mock data or demo logic directly:
- `useAssignmentStore.fetchBillets()` seeds MOCK_BILLETS into SQLite if empty (line 361)
- `useLeaveStore.fetchLeaveData()` constructs demo balance inline when `isDemoMode` is true (lines 121-138)
- `useUserStore` initializes with `MOCK_USER` from `data/mockProfile.json` (line 58-63)
- `usePCSStore.initializeOrders()` reads from `useDemoStore` to determine the active user (line 279)
- `useAdminStore` contains 150+ lines of seed data (lines 86-275)

This coupling means that removing demo mode for production requires touching multiple stores.

### Migration Strategy Gaps

The migration runner in `services/migrations.ts` has a fundamental flaw: it never reads the current schema version from the database. It runs every migration and relies on catching "already exists" SQL errors (line 168) to skip applied ones. This means:
1. All 7 migrations run on every app launch (with error suppression)
2. No way to know the actual applied version without running all migrations
3. No rollback capability
4. If a migration partially succeeds (e.g., first statement succeeds, second fails), the system cannot detect the inconsistent state

Additionally, `DatabaseManager.init()` calls `initializeSQLiteTables()` from `types/schema.ts`, which creates tables with `CREATE TABLE IF NOT EXISTS`. This table creation path is separate from the migration system, creating two sources of truth for the database schema.

### Component Organization

The `components/` directory is well-organized by feature (`pcs/`, `wizard/`, `travel-claim/`, `discovery/`, `navigation/`) with shared primitives in `ui/`. The widget pattern (full vs. widget variants) is documented and consistent.

---

## 5. Dependency Risk Assessment

### Total Dependency Surface

- **Production dependencies**: 55 packages
- **Dev dependencies**: 7 packages

### Supply Chain Risk

The dependency list is largely composed of well-maintained Expo SDK packages and React Native ecosystem libraries. No dependency pinning strategy is evident beyond Expo's `~` (compatible) version ranges.

### High-Risk or Unmaintained Packages

| Package | Risk | Notes |
|---------|------|-------|
| `crypto-js` | **Critical** | Not FIPS 140-2 validated; actively used in encryption.ts (though disabled). Must be replaced before ATO. Acknowledged as TD-002. |
| `react-native-pdf` | Medium | v7.0.3; depends on native PDF rendering; limited maintainer activity |
| `react-native-blob-util` | Medium | Native bridge for file operations; complex native dependencies |
| `jsqr` | Low | QR code scanning; small, stable library |
| `react-native-vision-camera` | Medium | v4.7.3; active but complex native dependency; frame processors stubbed |
| `react-native-calendars` | Low | v1.1314.0; stable but large version number suggests frequent releases |

### `crypto-js` as Architectural Debt

`crypto-js` appears in three locations:
1. `package.json` dependency (line 22)
2. `@types/crypto-js` dev dependency (line 19 -- actually in production deps, which is a minor issue)
3. `tsconfig.json` types array (line 10)
4. `lib/encryption.ts` import (line 1)

Despite encryption being disabled, `crypto-js` is imported and its key generation is used (`CryptoJS.lib.WordArray.random` at encryption.ts:24). The `react-native-get-random-values` polyfill is also imported (line 2) to support this. Removing `crypto-js` requires replacing the key generation and implementing encryption via Web Crypto API or `react-native-quick-crypto`.

### Bundle Size Concerns

Notable large dependencies:
- `react-native-vision-camera` + `react-native-worklets`: Camera/frame processing pipeline; significant native code
- `react-native-calendars`: Full calendar component library
- `expo-image`: Modern image component (replacement for Image)
- `moti`: Wraps Reanimated; adds ~30KB (acknowledged as TD-016)

The `@types/crypto-js` package is listed in `dependencies` rather than `devDependencies` (package.json line 19), which means it ships in production builds unnecessarily.

---

## 6. Findings Table

### ARCH-001: Encryption Disabled -- All Data at Rest is Plaintext

| Field | Content |
|-------|---------|
| **ID** | ARCH-001 |
| **Title** | Encryption disabled -- all data at rest is plaintext |
| **Severity** | Critical |
| **Description** | `encryptData()` and `decryptData()` in `lib/encryption.ts` are no-op passthroughs (lines 50-53, 63-64). All PII/CUI stored in SQLite (user records with DoD ID, emergency contacts, leave requests with addresses) and localStorage (web) is unencrypted. This violates DISA STIG SRG-APP-000429 and NIST SC-28. |
| **Evidence** | `lib/encryption.ts:50-53` -- `return data;` with commented-out AES logic |
| **Remediation** | 1. Replace `crypto-js` with Web Crypto API (`SubtleCrypto`) for AES-256-GCM. 2. Re-enable encryption in both functions. 3. Implement migration path from unencrypted to encrypted data. 4. Derive encryption key from user credential via PBKDF2 (see ARCH-002). |
| **Effort** | L |
| **Dependencies** | Client-only (ARCH-002 prerequisite) |

### ARCH-002: Insecure Encryption Key Management

| Field | Content |
|-------|---------|
| **ID** | ARCH-002 |
| **Title** | Encryption key stored in localStorage / env var / timestamp fallback |
| **Severity** | Critical |
| **Description** | `lib/encryption.ts` key derivation (lines 10-38) has three insecure fallbacks: (1) `EXPO_PUBLIC_*` env vars are embedded in the client bundle, (2) localStorage key on web is accessible to any script, (3) `'fallback-session-key-' + timestamp` is predictable. Even when encryption is re-enabled, the key management makes it ineffective. |
| **Evidence** | `lib/encryption.ts:12-13` (env var), `lib/encryption.ts:19` (localStorage), `lib/encryption.ts:38` (timestamp fallback) |
| **Remediation** | Derive key from CAC/PKI credential via PBKDF2. Store derived key in `expo-secure-store` (native) or IndexedDB with Web Crypto (web). Never use `EXPO_PUBLIC_*` for key material. |
| **Effort** | L |
| **Dependencies** | Backend required (CAC/PKI integration) |

### ARCH-003: Authentication Fully Simulated

| Field | Content |
|-------|---------|
| **ID** | ARCH-003 |
| **Title** | Mock authentication with hardcoded token |
| **Severity** | Critical |
| **Description** | `lib/ctx.tsx:75` sets `session` to `'mock-okta-access-token'`. No OIDC discovery, no PKCE, no token validation, no refresh rotation. The `config/auth.ts` contains placeholder values (`'https://dev-navy-mock.okta.com'`, `'my-compass-client'`). |
| **Evidence** | `lib/ctx.tsx:75` -- `const mockAccessToken = 'mock-okta-access-token'`; `config/auth.ts:9-15` |
| **Remediation** | Implement `expo-auth-session` with PKCE flow against a real Okta tenant. Store tokens in `expo-secure-store`. Implement refresh token rotation. Wire `HttpClient.getAuthToken` callback. |
| **Effort** | L |
| **Dependencies** | Backend required (Okta tenant provisioning) |

### ARCH-004: Sync Queue Payloads Stored Unencrypted in AsyncStorage

| Field | Content |
|-------|---------|
| **ID** | ARCH-004 |
| **Title** | Sync queue payloads unencrypted in AsyncStorage |
| **Severity** | High |
| **Description** | `services/syncQueue.ts` persists mutation payloads (which will contain PII when connected to real APIs -- e.g., leave requests with emergency contacts, addresses) as plain JSON in AsyncStorage. AsyncStorage is Tier 3 (non-sensitive cache), but sync queue payloads will contain Tier 1/2 data. |
| **Evidence** | `services/syncQueue.ts:200-201` -- `multiSetPairs.push([key, JSON.stringify(op)])` |
| **Remediation** | Migrate sync queue storage from AsyncStorage to encrypted SQLite (Tier 2). Alternatively, encrypt payloads before `AsyncStorage.setItem` using the fixed encryption module. |
| **Effort** | M |
| **Dependencies** | Client-only (depends on ARCH-001) |

### ARCH-005: `usePCSStore` Monolith (1,261 Lines, 12+ Concerns)

| Field | Content |
|-------|---------|
| **ID** | ARCH-005 |
| **Title** | PCS store monolith violates single-responsibility principle |
| **Severity** | High |
| **Description** | `store/usePCSStore.ts` manages active orders, checklist, 6 financial sub-domains (advance pay, DLA, OBLISERV, HHG, moving costs, liquidation), receipts, travel claims, segment planning, and PDF caching in a single file with `persist` middleware. Any edit risks unintended side effects. The entire serialized state blob is written to AsyncStorage on every change. |
| **Evidence** | `store/usePCSStore.ts` -- 1,261 lines; interface declares 25+ actions |
| **Remediation** | Split into: `usePCSOrderStore` (order + segments), `usePCSFinancialsStore` (DLA, advance pay, OBLISERV, HHG, moving costs), `usePCSChecklistStore` (checklist items), `usePCSReceiptStore` (receipt vault), `usePCSLiquidationStore` (liquidation tracking). Each can have its own `persist` partition. |
| **Effort** | L |
| **Dependencies** | Client-only |

### ARCH-006: `console.log` Bypasses SecureLogger in Service Layer

| Field | Content |
|-------|---------|
| **ID** | ARCH-006 |
| **Title** | `console.log/error/warn` used instead of SecureLogger in services and auth |
| **Severity** | High |
| **Description** | TD-010 (SecureLogger migration) is marked resolved, but `console.*` calls remain in: `syncQueue.ts` (3), `lib/ctx.tsx` (6 -- including auth config logging), `storage.web.ts` (11+), `migrations.ts` (3), `repositories/` (6+), `notifications.ts` (3), `usePCSStore.ts` (1). The `ctx.tsx` calls at lines 63-66 log the Okta issuer, client ID, and redirect URI on every sign-in attempt. While `SecureLogger.patchGlobalConsole()` provides a runtime safety net, it only works after `_layout.tsx` initializes -- service code that runs earlier bypasses it. |
| **Evidence** | `lib/ctx.tsx:63-66` -- logs auth config; `services/syncQueue.ts:219,252,307`; `services/storage.web.ts:49,80,148,...` |
| **Remediation** | Replace all remaining `console.*` calls with `SecureLogger.*`. Remove auth config logging from `ctx.tsx`. Add an ESLint rule (`no-console`) to prevent regression. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-007: Web Storage Feature Parity Gaps

| Field | Content |
|-------|---------|
| **ID** | ARCH-007 |
| **Title** | Web storage has no-op implementations for PCS features |
| **Severity** | High |
| **Description** | `services/storage.web.ts` implements PCS orders and documents as empty function bodies (lines 336-345). Any web user attempting PCS archive features will silently lose data. Additionally, `storage.web.ts` appears to be dead code now that the repository pattern handles platform selection internally -- but this needs verification. |
| **Evidence** | `services/storage.web.ts:336-345` -- `async saveHistoricalPCSOrder(_order): Promise<void> { }` |
| **Remediation** | 1. Verify whether `storage.web.ts` is still used or if repositories have fully replaced it. If dead code, remove it. 2. If still used, implement PCS operations using localStorage (or IndexedDB for larger datasets). |
| **Effort** | M |
| **Dependencies** | Client-only |

### ARCH-008: Migration Runner Never Reads Schema Version

| Field | Content |
|-------|---------|
| **ID** | ARCH-008 |
| **Title** | Database migration runner does not check applied version |
| **Severity** | High |
| **Description** | `services/migrations.ts:157-179` runs all migrations on every app launch and suppresses "already exists" errors. The `schema_version` table is written to (line 185) but never read. This means: (1) every migration SQL executes on every launch, (2) partial migration failures cannot be detected, (3) the version table provides false confidence. |
| **Evidence** | `services/migrations.ts:155-156` -- `let highestApplied = 0; for (const migration of migrations) {` -- no version check |
| **Remediation** | Read the current version from `schema_version` before running migrations. Only execute migrations with `version > currentVersion`. Use a transaction per migration so failures are atomic. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-009: Dual Schema Definition Paths (Tables + Migrations)

| Field | Content |
|-------|---------|
| **ID** | ARCH-009 |
| **Title** | SQLite tables defined in both `schema.ts` and `migrations.ts` |
| **Severity** | Medium |
| **Description** | `DatabaseManager.init()` calls `initializeSQLiteTables()` from `types/schema.ts` which creates all tables with `CREATE TABLE IF NOT EXISTS`. Separately, `migrations.ts` also creates tables and adds columns. These are two independent sources of truth for the database schema. If `schema.ts` is updated without a corresponding migration, existing users get the old schema; if a migration adds a column not in `schema.ts`, new installs get inconsistent state. |
| **Evidence** | `services/db/DatabaseManager.ts:57` -- `await initializeSQLiteTables(db)`; `services/migrations.ts:62-122` -- creates tables |
| **Remediation** | Make migrations the single source of truth. `initializeSQLiteTables()` should only create the `schema_version` table; all domain tables should be created via migration v1. |
| **Effort** | M |
| **Dependencies** | Client-only |

### ARCH-010: `httpClient` Singleton Has No Auth Token Provider

| Field | Content |
|-------|---------|
| **ID** | ARCH-010 |
| **Title** | Default HTTP client instance created without `getAuthToken` |
| **Severity** | Medium |
| **Description** | `services/api/client.ts:266` creates `export const httpClient = new HttpClient()` with no `getAuthToken` callback configured. When real API integration begins, this singleton will not inject auth tokens unless reconfigured. The mock phase masks this because mock services do not use the HTTP client. |
| **Evidence** | `services/api/client.ts:266` -- `export const httpClient = new HttpClient()` (no config) |
| **Remediation** | Configure the singleton with a `getAuthToken` callback that retrieves the session token from `expo-secure-store`. This can be deferred to Phase A of API integration but should be documented as a prerequisite. |
| **Effort** | S |
| **Dependencies** | Backend required (real auth tokens) |

### ARCH-011: `IDPSService` Not Wired in Service Registry

| Field | Content |
|-------|---------|
| **ID** | ARCH-011 |
| **Title** | DPS service interface exists but is not in the registry |
| **Severity** | Medium |
| **Description** | `services/api/interfaces/IDPSService.ts` defines 7 methods for the Defense Personal Property System (HHG shipments). A `mockDPSService` is imported and wired in `serviceRegistry.ts`. However, `IDPSService` is not exported from `services/api/interfaces/index.ts` (line 1-7 only export 6 interfaces). |
| **Evidence** | `services/api/interfaces/index.ts` -- `IDPSService` missing from re-exports |
| **Remediation** | Add `export type { IDPSService } from './IDPSService'` to the index file. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-012: Duplicate Store File

| Field | Content |
|-------|---------|
| **ID** | ARCH-012 |
| **Title** | Duplicate file `useBottomSheetStore 2.ts` in store directory |
| **Severity** | Low |
| **Description** | `store/useBottomSheetStore 2.ts` (18 lines) is identical to `store/useBottomSheetStore.ts`. It appears to be an accidental copy (note the space in the filename, suggesting a Finder duplicate). |
| **Evidence** | `store/useBottomSheetStore 2.ts` -- 18 lines, identical content |
| **Remediation** | Delete `store/useBottomSheetStore 2.ts`. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-013: UUID Generation Duplicated Across 5 Files

| Field | Content |
|-------|---------|
| **ID** | ARCH-013 |
| **Title** | UUID v4 generator copy-pasted across multiple stores |
| **Severity** | Low |
| **Description** | The same `generateUUID()` function using `Math.random()` is defined in: `useLeaveStore.ts:23-29`, `useAssignmentStore.ts:26-32`, `usePCSStore.ts:28-34`, `useTravelClaimStore.ts:46-52`, `usePCSArchiveStore.ts:28-33`. This uses `Math.random()` which is not cryptographically secure and produces statistically weaker UUIDs than `crypto.randomUUID()`. |
| **Evidence** | 5 identical `generateUUID` functions across store files |
| **Remediation** | Extract to `utils/uuid.ts`. Use `crypto.randomUUID()` (available via `react-native-get-random-values` polyfill already in dependencies) for better entropy. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-014: `useInboxStore` and `useCareerStore` Mix State and Actions in Single Interface

| Field | Content |
|-------|---------|
| **ID** | ARCH-014 |
| **Title** | Some stores do not separate State and Actions interfaces |
| **Severity** | Low |
| **Description** | `useInboxStore` and `useCareerStore` define a single combined interface (`InboxState`, `CareerState`) that includes both data fields and action methods, deviating from the documented convention of separate `State` and `Actions` interfaces. |
| **Evidence** | `store/useInboxStore.ts:15-21` -- `fetchMessages` in `InboxState` interface; `store/useCareerStore.ts:8-12` |
| **Remediation** | Split into `InboxState` + `InboxActions` and `CareerState` + `CareerActions` per the store convention. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-015: `useHeaderStore` Uses Module-Level Mutable Variables

| Field | Content |
|-------|---------|
| **ID** | ARCH-015 |
| **Title** | Header store manages global search handlers via module-level variables |
| **Severity** | Low |
| **Description** | `store/useHeaderStore.ts` declares three module-level `let` variables (lines 33-35) for global search blur, submit, and dismiss handlers. These are set via store actions but live outside the Zustand state, making them invisible to React's reactivity system and impossible to serialize. |
| **Evidence** | `store/useHeaderStore.ts:33-35` -- `let globalSearchBlurHandler`, `let globalSearchSubmitHandler`, `let globalSearchDismissHandler` |
| **Remediation** | Move handler registration into a React context or store these callbacks within the Zustand state (using `subscribeWithSelector` if reactivity is needed). |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-016: `@types/crypto-js` in Production Dependencies

| Field | Content |
|-------|---------|
| **ID** | ARCH-016 |
| **Title** | Type declaration package in production dependencies |
| **Severity** | Low |
| **Description** | `@types/crypto-js` is listed in `dependencies` (package.json line 19) rather than `devDependencies`. Type declarations should not ship in production builds. |
| **Evidence** | `package.json:19` -- `"@types/crypto-js": "^4.2.2"` in `dependencies` |
| **Remediation** | Move to `devDependencies`. Will be moot when `crypto-js` is replaced (ARCH-001). |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-017: PCS Store Uses `console.error` Instead of SecureLogger

| Field | Content |
|-------|---------|
| **ID** | ARCH-017 |
| **Title** | PCS store uses `console.error` bypassing SecureLogger |
| **Severity** | Medium |
| **Description** | `usePCSStore.ts:260` uses `console.error('[PCSStore] Failed to fetch active order:', result.error.message)` directly. While the error message itself may not contain PII, this establishes a pattern that bypasses the SecureLogger redaction pipeline. |
| **Evidence** | `store/usePCSStore.ts:260` |
| **Remediation** | Replace with `SecureLogger.error('[PCSStore] Failed to fetch active order:', result.error.message)`. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-018: No Role-Based Access Control

| Field | Content |
|-------|---------|
| **ID** | ARCH-018 |
| **Title** | All authenticated users have full access to all routes and actions |
| **Severity** | High |
| **Description** | No `role` field exists on the User type. No route-level or action-level authorization checks exist. The `AuthGuard` only checks authentication and consent, not authorization. In a production deployment, a Sailor could access Supervisor-only approval actions. |
| **Evidence** | `components/navigation/AuthGuard.tsx` -- no role checks; `types/user.ts` -- no `role` field in `UserSchema` |
| **Remediation** | Add `role` field to `UserSchema`. Implement route guards in tab layouts. Add action-level checks in store mutations (e.g., leave approval requires Supervisor role). |
| **Effort** | L |
| **Dependencies** | Backend required (role claims in JWT) |

### ARCH-019: `usePCSStore.initializeOrders` Race Condition

| Field | Content |
|-------|---------|
| **ID** | ARCH-019 |
| **Title** | PCS orders cache initialization may race with storage init |
| **Severity** | Medium |
| **Description** | In `app/_layout.tsx:96`, `usePCSStore.getState().initializeOrdersCache()` is called synchronously inside the `useEffect` that also starts `storage.init()`. The `initializeOrdersCache` method reads from AsyncStorage/filesystem, which may not require SQLite, but if it depends on storage being initialized, this is a race condition. |
| **Evidence** | `app/_layout.tsx:96` -- called outside the `initStorage` async function |
| **Remediation** | Move `initializeOrdersCache()` inside the `initStorage` function, after `storage.init()` completes, or verify it has no dependency on SQLite. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-020: No Audit Logging

| Field | Content |
|-------|---------|
| **ID** | ARCH-020 |
| **Title** | No persistent audit trail for user actions |
| **Severity** | High |
| **Description** | No `AuditLogService` exists. User actions (login, data access, form submissions, authorization failures) are not recorded in a structured, persistent format. This is required for NIST AC-6, AU-2, AU-3. Acknowledged as TD-008. |
| **Evidence** | No `services/auditLog.ts` file exists; no audit-related code in any store |
| **Remediation** | Create `AuditLogService` in `services/auditLog.ts`. Record structured events to encrypted SQLite (append-only). Queue for background sync via `syncQueue.ts`. |
| **Effort** | M |
| **Dependencies** | Client-only for local persistence; Backend required for server ingestion |

### ARCH-021: `useLeaveStore` Has No Selector Hooks

| Field | Content |
|-------|---------|
| **ID** | ARCH-021 |
| **Title** | Leave store missing granular selector hooks |
| **Severity** | Low |
| **Description** | `useLeaveStore` is the canonical reference store per `store/CLAUDE.md`, yet it exports zero selector hooks. Components consuming leave data must subscribe to the entire store or write inline selectors, risking unnecessary re-renders. Compare with `useUserStore` which exports 13 selector hooks. |
| **Evidence** | `store/useLeaveStore.ts` -- no `export const useLeaveBalance = ...` etc. |
| **Remediation** | Add selector hooks: `useLeaveBalance`, `useLeaveRequests`, `useLeaveLoading`, `useUserDefaults`. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-022: `useDemoStore` Cross-Store Coupling via `require()`

| Field | Content |
|-------|---------|
| **ID** | ARCH-022 |
| **Title** | Demo store uses `require()` for lazy cross-store imports |
| **Severity** | Medium |
| **Description** | `useDemoStore` uses `require('./usePCSStore')` in 3 places (lines 115, 207, 224) and `require('./usePCSArchiveStore')` in 1 place (line 248). While this avoids circular import crashes, it creates runtime dependencies invisible to TypeScript's type system and bundler tree-shaking. The `require()` calls are also untyped. |
| **Evidence** | `store/useDemoStore.ts:115,207,224,248` |
| **Remediation** | Extract demo-specific PCS operations into a `services/demoOrchestrator.ts` that imports both stores, keeping the demo store focused on state. Alternatively, use dynamic `import()` which preserves types. |
| **Effort** | M |
| **Dependencies** | Client-only |

### ARCH-023: No Conflict Resolution Strategy for Offline Mutations

| Field | Content |
|-------|---------|
| **ID** | ARCH-023 |
| **Title** | No conflict resolution for offline-to-server reconciliation |
| **Severity** | Medium |
| **Description** | The sync queue retries failed mutations but has no strategy for when server state diverges from local state during offline periods. For example, a leave request approved server-side while the user is offline and edits it locally will create a conflict. The `localModifiedAt` field exists on `SyncMetadata` but no comparison logic exists. |
| **Evidence** | `types/schema.ts:28` -- `localModifiedAt` defined but unused for conflict detection; `services/syncQueue.ts` -- no merge/conflict logic |
| **Remediation** | Define a conflict resolution policy per entity type (e.g., server-wins for approval status, client-wins for draft edits). Implement `lastModified` comparison in the sync executor. Add UI for displaying conflict notifications. |
| **Effort** | L |
| **Dependencies** | Backend required (server must provide `lastModified` timestamps) |

### ARCH-024: `ctx.tsx` Logs Auth Configuration Details

| Field | Content |
|-------|---------|
| **ID** | ARCH-024 |
| **Title** | Auth flow logs Okta issuer, client ID, and redirect URI |
| **Severity** | Medium |
| **Description** | `lib/ctx.tsx:63-66` logs the Okta issuer URL, client ID, and redirect URI on every sign-in attempt using `console.log`. While these are not PII, they are security-relevant configuration that should not appear in production logs. |
| **Evidence** | `lib/ctx.tsx:63-66` |
| **Remediation** | Remove auth config logging or guard with `__DEV__` check. Use `SecureLogger` for any remaining auth-related logging. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-025: Zustand `persist` Stores Lack Consistent Versioning

| Field | Content |
|-------|---------|
| **ID** | ARCH-025 |
| **Title** | Persisted stores have inconsistent migration patterns |
| **Severity** | Medium |
| **Description** | Four stores use `persist` middleware: `usePCSStore`, `useTravelClaimStore`, `useDemoStore`, `useUIStore`, `usePCSArchiveStore`. While `useTravelClaimStore` and `useDemoStore` implement proper `version` + `migrate` functions, `usePCSStore` uses `persist` but its migration behavior was not confirmed in the read portion. If the PCS store's persisted schema changes without a migration, users will experience caching crashes on update. |
| **Evidence** | `store/usePCSStore.ts:212` uses `persist`; `store/useTravelClaimStore.ts:525-534` has proper migration |
| **Remediation** | Audit all persisted stores to ensure they have `version`, `migrate`, and `partialize` configured. Add this to the store convention documentation. |
| **Effort** | S |
| **Dependencies** | Client-only |

### ARCH-026: `useAssignmentStore.fetchBillets` Uses `require()` for Demo Store

| Field | Content |
|-------|---------|
| **ID** | ARCH-026 |
| **Title** | Assignment store uses `require()` for conditional demo filtering |
| **Severity** | Low |
| **Description** | `store/useAssignmentStore.ts:371` uses `const { useDemoStore } = require('@/store/useDemoStore')` inside `fetchBillets()`. This loses type safety and is inconsistent with the top-level import of `useDemoStore` used elsewhere in other stores. |
| **Evidence** | `store/useAssignmentStore.ts:371` |
| **Remediation** | Import `useDemoStore` at the top of the file as a regular import, consistent with other stores. |
| **Effort** | S |
| **Dependencies** | Client-only |
