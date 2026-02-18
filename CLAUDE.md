# CLAUDE.md — My Compass Constitution

> This is the single authoritative instruction file for all AI agents working on this codebase.
> Every rule here is mandatory. When in doubt, re-read Section 1.

---

## 1. Priority Hierarchy

When rules conflict, the higher priority **always wins**. No exceptions.

| Priority | Principle | Meaning |
|----------|-----------|---------|
| **P5** | Security & PII Protection | Never compromise. No shortcuts. No "just for debugging." |
| **P4** | Offline-First | Every feature must work without a network connection. |
| **P3** | Platform Compliance | React Native only. No HTML, no CSS files, no web-only APIs. |
| **P2** | Existing Patterns | Follow established conventions before inventing new ones. |
| **P1** | Simplicity | Fewer abstractions, fewer dependencies, fewer lines of code. |
| **P0** | Speed of Delivery | Ship fast, but never at the cost of P1–P5. |

**Conflict resolution examples:**

- Need a quick feature but it requires network? → Build offline-first anyway. **(P4 > P0)**
- Cleaner code if we add a new library? → Use what we have. **(P2 > P1)**
- Faster to log user data for debugging? → Never log PII. **(P5 > P0)**
- Simpler to use `<div>` for web? → Use `<View>` always. **(P3 > P1)**
- New pattern would be "better"? → Match existing patterns first. **(P2 > P1)**

---

## 2. Identity

- **What:** Universal military personnel management app (iOS, Android, Web) from a single React Native codebase
- **Who:** U.S. Navy sailors — active duty enlisted and officers
- **Where:** Ships, bases, austere environments with unreliable or no connectivity
- **Philosophy:** "Glass Cockpit" — high-density, zero-scroll situational awareness (see `docs/DESIGN_STANDARDS.md`)
- **Current state:** Offline-first with mock data. No live API connections. Pre-ATO.
- **Design surface:** Mobile-first. Web is a deployment target, not the primary design surface.

---

## 3. Tech Stack (Immutable — No Additions Without Explicit Approval)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Framework | React Native via Expo | RN 0.81, SDK 54 | Managed workflow |
| Language | TypeScript | 5.9 strict | No `any` types without justification |
| Navigation | Expo Router | 6 | File-based routing in `app/` |
| Styling | NativeWind | 4 | Tailwind for RN via `className` prop |
| State | Zustand | 5 | Stores in `store/use[Feature]Store.ts` |
| Icons | Lucide-React-Native | — | No other icon libraries |
| Animations | Reanimated 4 + Moti | — | Worklets for 60fps |
| Forms | React Hook Form + Zod | Zod 4 | Schema-first validation |
| Lists | @shopify/flash-list | — | Required for lists >20 items |

### Storage Tiers

| Tier | Technology | Use For | Never Use For |
|------|-----------|---------|---------------|
| **Tier 1** | `expo-secure-store` | Auth tokens, session credentials, PII | — |
| **Tier 2** | `expo-sqlite` (encrypted) | Persistent structured data (leave, PCS, user records) | — |
| **Tier 3** | `AsyncStorage` | UI preferences, theme, non-sensitive cache | Tokens, PII, or any sensitive data |

---

## 4. Constitutional Rules

Every rule uses the format: **NEVER / ALWAYS / WHY**. These are immutable.

### 4.1 No HTML Elements

- **NEVER:** `<div>`, `<span>`, `<h1>`, `<p>`, `<ul>`, `<li>`, `<img>`, `<a>`, `<button>`, `<input>`, `<form>`
- **ALWAYS:** `<View>`, `<Text>`, `<Image>`, `<ScrollView>`, `<Pressable>`, `<Link>` (expo-router), `<TextInput>`
- **WHY:** HTML elements crash on iOS/Android. There is no DOM in React Native.

```tsx
// ❌ WRONG — crashes on native
<div className="flex-1"><span>Hello</span></div>

// ✅ RIGHT
<View className="flex-1"><Text>Hello</Text></View>
```

### 4.2 No CSS Files or Styled-Components

- **NEVER:** Create `.css` files, import `.css`, use `styled-components`, use `emotion`
- **ALWAYS:** Use `className` prop with Tailwind classes via NativeWind
- **EXCEPTION:** `global.css` exists for CSS custom property definitions only

```tsx
// ❌ WRONG
import './styles.css';
const StyledView = styled(View)`background: white;`;

// ✅ RIGHT
<View className="flex-1 bg-white dark:bg-slate-900">
```

### 4.3 No Web-Only APIs

- **NEVER:** `document.*`, `window.*`, `localStorage`, `sessionStorage`, `react-router-dom`, `onClick`
- **ALWAYS:** `Platform.OS` checks, `.native.tsx`/`.web.tsx` file extensions, `onPress`
- **WHY:** These APIs do not exist in the React Native runtime.

### 4.4 Routing is Expo Router Only

- **NEVER:** `react-router-dom`, `<a href>`, direct `react-navigation` calls, manual `navigation.navigate()`
- **ALWAYS:** `expo-router` `<Link>` component, `router.push()`, `router.replace()`, file-based routes in `app/`
- Routes live in the `app/` directory using file-system convention.

### 4.5 PII is Forbidden in Logs

- **NEVER:** `console.log(user)`, `console.log(user.dodId)`, `console.error(JSON.stringify(userData))`
- **ALWAYS:** Use `SecureLogger` from `@/utils/logger` — it auto-redacts SSN, DoD ID, email, and phone patterns
- **PII fields:** SSN, DoD ID, email, phone, full name, home address, emergency contact info
- If you must log a user reference, log only the UUID, never the full object.

```tsx
// ❌ WRONG
console.log('[UserStore] loaded user:', user);

// ✅ RIGHT
import { SecureLogger } from '@/utils/logger';
SecureLogger.info('[UserStore] loaded user', { id: user.id });
```

### 4.6 Secrets are Never Hardcoded

- **NEVER:** `const API_KEY = 'abc123'`, `Authorization: 'Bearer sk-...'`, secrets in comments or test fixtures
- **ALWAYS:** `process.env.EXPO_PUBLIC_*` for public config, environment variables for secrets

### 4.7 Offline-First is Mandatory

- **NEVER:** Assume network is available. Never block UI on a network request. Never show a blank screen because fetch failed.
- **ALWAYS:** Load from local storage first → display cached data → fetch in background → merge and persist.
- Mutations go through the sync queue (`@/services/syncQueue`) so they persist and retry when offline.

```tsx
// ❌ WRONG — blocks on network, blank screen if offline
fetchData: async () => {
  const res = await fetch(url);
  set({ data: await res.json() });
},

// ✅ RIGHT — cache-first, background refresh
fetchData: async () => {
  const cached = await storage.getData('feature');
  if (cached) set({ data: cached });
  try {
    const fresh = await services.feature.getData();
    set({ data: fresh });
    await storage.saveData('feature', fresh);
  } catch { /* cached data still displayed */ }
},
```

### 4.8 Navy Terminology is Required

Use strict Navy terms in all UI copy, variable names, comments, and documentation.

| ✅ Use | ❌ Never Use |
|--------|-------------|
| Leave | Vacation, PTO, Time Off |
| Detailer | Recruiter, HR Rep |
| PRD (Projected Rotation Date) | End Date, Contract End |
| Billet | Position, Job, Role |
| Command | Company, Organization |
| Sailor | Employee, User, Worker (in UI copy) |
| Orders | Transfer Request |
| OBLISERV | Obligation, Contract Extension |
| PCS (Permanent Change of Station) | Transfer, Relocation, Move |
| DLA | Moving Allowance |
| TLA | Temp Housing, Hotel Allowance |
| HHG | Household Goods, Furniture |
| NSIPS | HR System |

### 4.9 Follow Existing Patterns

- **NEVER:** Invent new state management, new component architecture, new styling approach, or new form library
- **ALWAYS:** Search `store/`, `components/`, and `app/` for existing patterns before building anything new
- Before creating a new component, search for a similar one first.
- Before creating a new store, review `store/useLeaveStore.ts` for the canonical pattern.
- Before building a new flow, check `docs/FLOWS_IMPLEMENTED.md` and `docs/FLOWS_NOT_IMPLEMENTED.md`.

### 4.10 Imports Use Path Aliases

- **NEVER:** `import { X } from '../../../components/Y'`
- **ALWAYS:** `import { X } from '@/components/Y'`
- The `@/` alias maps to the project root.

---

## 5. Standard Operating Procedures

### 5.1 Component Pattern

```tsx
// File: components/[feature]/MyComponent.tsx
import { View, Text, Pressable } from 'react-native';

interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Pressable onPress={onAction} className="p-4 bg-white dark:bg-slate-800 rounded-xl">
      <Text className="text-base font-semibold text-slate-900 dark:text-white">
        {title}
      </Text>
    </Pressable>
  );
}
```

- Named exports (never default exports)
- Props interface defined above component
- `className` for all styling, `dark:` prefix for dark mode
- PascalCase filename matching component name

### 5.2 Store Pattern (Zustand)

```tsx
// File: store/use[Feature]Store.ts
import { create } from 'zustand';

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
  fetchData: async () => {
    set({ isLoading: true });
    // 1. Load cache first (offline-first)
    const cached = await storage.getData('feature');
    if (cached) set({ data: cached });
    // 2. Background fetch
    const fresh = await services.feature.getData();
    set({ data: fresh, isLoading: false });
    await storage.saveData('feature', fresh);
  },
  reset: () => set({ data: null, isLoading: false }),
}));

// Selector hooks for granular re-renders
export const useFeatureData = () => useFeatureStore(s => s.data);
export const useFeatureLoading = () => useFeatureStore(s => s.isLoading);
```

- Separate `State` and `Actions` interfaces
- Section comments: `// --- State ---`, `// --- Actions ---`
- Offline-first: load from storage → display → fetch background → persist
- Export selector hooks for granular subscriptions
- See `store/CLAUDE.md` for full store conventions.

### 5.3 Flow Pattern (Wizard)

All multi-step forms use the **continuous-scroll wizard** pattern. Before building a new flow:

1. Identify its type from the **Flow Type Taxonomy** in `docs/DESIGN_STANDARDS.md` §2.2.2
2. Follow the canonical implementation for that type
3. Required elements: `WizardStatusBar`, scroll-tracked sections, auto-save drafts (800ms debounce), exit confirmation modal, success celebration

**Five flow types:** Confirmation, Request, Estimator, Document Generation, Screening.

Reference implementation: `app/leave/request.tsx`

### 5.4 Service Layer Pattern

- All data access goes through typed interfaces in `services/api/interfaces/`
- Mock implementations in `services/api/mock[Feature]Service.ts`
- Registry in `services/api/serviceRegistry.ts` — swap mock for real here
- **NEVER** call mock services directly from stores; always go through the registry
- See `docs/API_INTEGRATION_ROADMAP.md` for the mock-to-real transition plan.

### 5.5 Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Store | `use[Feature]Store.ts` | `useLeaveStore.ts` |
| Hook | `use[Feature].ts` | `useDiffClampScroll.ts` |
| Component | `PascalCase.tsx` | `ScreenHeader.tsx` |
| Type file | `lowercase.ts` | `schema.ts`, `pcs.ts` |
| Service | `mock[Feature]Service.ts` | `mockLeaveService.ts` |
| Interface | `I[Feature]Service.ts` | `IAssignmentService.ts` |
| Route | lowercase / `[param]` | `pcs-wizard/[segmentId]` |

### 5.6 Styling

- Mobile-first layout (`flex-col`), adapt for tablet/web with `md:` breakpoints
- Dark mode via `dark:` prefix and `useColorScheme()` hook
- Theme colors defined as CSS variables in `global.css`, extended in `tailwind.config.js`
- Custom shadows: `apple-sm`, `apple-md`, `apple-lg`
- Haptic feedback on interactive elements via `expo-haptics` with `Platform.OS !== 'web'` guard

---

## 6. Reference Map

Before creating any new component, flow, widget, or tool — check the relevant docs below. The "not implemented" docs contain design specs for planned features; follow those specs rather than designing from scratch.

| Topic | Document | When to Read |
|-------|----------|-------------|
| UI philosophy, flow types, animations, component conventions | `docs/DESIGN_STANDARDS.md` | Before building any UI or flow |
| Security controls, PII protection, crypto status | `docs/SECURITY_POSTURE.md` | Before touching auth, storage, or logging |
| ATO/RMF/STIG compliance gaps | `docs/ATO_READINESS.md` | Before security architecture decisions |
| Mock-to-real API transition plan | `docs/API_INTEGRATION_ROADMAP.md` | Before modifying service layer |
| Known tech debt (P0–P3) | `docs/TECHNICAL_DEBT.md` | Before refactoring or when encountering workarounds |
| Full dependency inventory with risk | `docs/DEPENDENCY_MANIFEST.md` | Before adding or upgrading dependencies |
| Built flows with routes and stores | `docs/FLOWS_IMPLEMENTED.md` | Before building a new flow |
| Planned but unbuilt flows | `docs/FLOWS_NOT_IMPLEMENTED.md` | When scoping new flow work |
| Built widgets (40+) | `docs/WIDGETS_IMPLEMENTED.md` | Before building a new widget |
| Planned but unbuilt widgets | `docs/WIDGETS_NOT_IMPLEMENTED.md` | When scoping new widget work |
| Built tools | `docs/TOOLS_IMPLEMENTED.md` | Before building a new tool |
| Planned but unbuilt tools | `docs/TOOLS_NOT_IMPLEMENTED.md` | When scoping new tool work |

---

## 7. Project Structure

```
app/                    # Expo Router file-based routes (entry point)
  (tabs)/               # Tab groups: (hub), (assignment), (career), (pcs), (admin), (profile), (calendar)
  leave/                # Leave request flow
  pcs-wizard/           # PCS wizard flows
  travel-claim/         # Travel claim flow
  inbox/                # Inbox/messaging
  _layout.tsx           # Root layout (providers, AuthGuard)
  sign-in.tsx           # Auth entry
components/             # Reusable components (see components/CLAUDE.md)
  ui/                   # Generic UI primitives
  wizard/               # Wizard step components
  pcs/                  # PCS feature components
  [feature]/            # Feature-specific component groups
store/                  # Zustand stores (see store/CLAUDE.md)
hooks/                  # Custom React hooks
services/               # Business logic & API clients
  api/                  # REST client, interfaces, mocks, registry
  syncQueue.ts          # Offline mutation queue
  storage.ts            # Unified SQLite + AsyncStorage interface
types/                  # TypeScript types & Zod schemas
config/                 # App configuration (auth, API endpoints)
constants/              # Colors, enums, demo data
utils/                  # Pure utilities (logger, formatting, calculations)
lib/                    # Auth context, encryption, storage hooks
docs/                   # Developer documentation (see Section 6)
```

---

## 8. Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Launch iOS simulator |
| `npm run android` | Launch Android emulator |
| `npm run web` | Launch web dev server |
| `npm run build` | Export web static build |
| `npx jest` | Run tests |
| `npx tsc --noEmit` | Type-check without emitting |

---

## 9. Testing

- **Framework:** Jest with `react-native` preset
- **Location:** `__tests__/` directory and `components/__tests__/`
- **Pattern:** `**/__tests__/**/*.test.ts(x)`
- **Path alias:** `@/*` mapped in `jest.config.js`

## 10. Deployment

- **Web:** Vercel — builds via `expo export --platform web`, outputs to `dist/`
- **Mobile:** Expo managed workflow
- **Deep linking:** `mycompass://` scheme configured in `app.json`
