# store/ — Zustand Store Conventions

> Read the root `CLAUDE.md` first. This file covers store-specific patterns only.

---

## File Naming

- Pattern: `use[Feature]Store.ts`
- One store per feature domain
- One file per store (no multi-store files)

---

## Store Architecture

### Interface Separation

Every store separates State and Actions into distinct interfaces:

```tsx
interface FeatureState {
  data: SomeType | null;
  isLoading: boolean;
}

interface FeatureActions {
  fetchData: () => Promise<void>;
  reset: () => void;
}

export const useFeatureStore = create<FeatureState & FeatureActions>((set, get) => ({
  // --- State ---
  data: null,
  isLoading: false,

  // --- Actions ---
  fetchData: async () => { /* ... */ },
  reset: () => set({ data: null, isLoading: false }),
}));
```

### Section Comments

Use `// --- Section ---` banners to separate State and Actions within the store body.

### Selector Hooks

Export granular selector hooks below the store to prevent unnecessary re-renders:

```tsx
export const useFeatureData = () => useFeatureStore(s => s.data);
export const useFeatureLoading = () => useFeatureStore(s => s.isLoading);
```

---

## Offline-First Pattern

Every store that fetches data must follow this sequence:

1. Load from `storage` (SQLite/AsyncStorage) first and set state immediately
2. Fetch from API in background via the service registry
3. Merge fresh data into state
4. Persist fresh data back to storage

Every store that mutates data must:

1. Update local state optimistically
2. Persist to storage
3. Enqueue mutation to sync queue (`@/services/syncQueue`)

Reference: `services/syncQueue.ts`

---

## Anti-Patterns

**NEVER:** Import and call mock services directly
**ALWAYS:** Use the service registry (`services/api/serviceRegistry.ts`)

**NEVER:** Use `console.log` in stores
**ALWAYS:** Use `SecureLogger` from `@/utils/logger`

**NEVER:** Store auth tokens or raw PII in Zustand state
**ALWAYS:** Tokens in `expo-secure-store`, PII fields marked with `@security` JSDoc

**NEVER:** Create a new store without checking if an existing one covers the domain
**ALWAYS:** Check this directory first; extend existing stores when appropriate

---

## Data Governance (USN Framework Alignment)

Per the USN Data Governance Framework and root `CLAUDE.md` Rule 4.11:

### Validate Before Persisting

Every store that writes data to storage must validate with Zod before persisting:

```tsx
import { FeatureSchema } from '@/types/schema';

// In store action:
const validated = FeatureSchema.safeParse(data);
if (validated.success) {
  await storage.saveData('feature', validated.data);
} else {
  SecureLogger.warn('[FeatureStore] Invalid data, not persisting', { errors: validated.error });
}
```

### Single Source of Truth

Each data domain has **one** authoritative store. Never create a second store for the same entity. If you need cross-domain data, read from the authoritative store via selectors.

### Transformation Discipline

Data transformations belong in `utils/` or `services/`, not inline in store actions. Store actions orchestrate — they call transformation functions, they don't contain business logic. This keeps data lineage traceable.

### Sync Queue is the Only Path

All offline mutations go through `services/syncQueue.ts`. Never build ad-hoc retry logic in store actions.

### Staleness Awareness

When hydrating from cache, consider tracking data freshness:

```tsx
interface FeatureState {
  data: SomeType | null;
  lastSynced: number | null; // timestamp of last successful fetch
  isLoading: boolean;
}
```

This supports the VAULTIS "Timeliness" dimension — consumers can assess how fresh the data is.

---

## Existing Stores

| Store | Domain | Key Patterns |
|-------|--------|-------------|
| `useLeaveStore` | Leave requests, drafts, balance | Draft persistence, quick-draft generation, submission flow |
| `useAssignmentStore` | Billet discovery, applications, slating | Pagination, filter state, swipe decisions |
| `usePCSStore` | PCS lifecycle, segments, HHG | UCT phase management, segment CRUD |
| `useUserStore` | User profile, auth state | Auth flow, privacy mode toggle |
| `useInboxStore` | Messages, notifications | Read/unread tracking, categories |
| `useCareerStore` | Career timeline, training | Event caching |
| `useTravelClaimStore` | Travel claim wizard | Expense tracking, receipt uploads |
| `useSyncQueueStore` | Offline mutation queue | Event-based subscribe pattern |
| `useUIStore` | Global UI state (modals, drawers) | Transient state only |
| `useDemoStore` | Demo/sandbox mode | Feature flags |
| `useHeaderStore` | Header collapse state | Shared animation values |
| `useSpotlightStore` | Search overlay state | Search indexing |
| `usePCSArchiveStore` | Past PCS moves | Document archive |

**Canonical example:** `useLeaveStore.ts` — review this store before creating any new store.
