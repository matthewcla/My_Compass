# CLAUDE.md — My Compass

## Project Overview

My Compass is a **universal military personnel management app** (iOS, Android, Web) built with a single React Native codebase. It serves U.S. Navy sailors with assignment management, leave requests, career planning, and communications — all designed for **offline-first** use aboard ships and in austere environments.

## Tech Stack (Strict — No Deviations)

- **Framework:** React Native 0.81 via Expo SDK 54, TypeScript 5.9 (strict)
- **Navigation:** Expo Router 6 (file-based routing in `app/`)
- **Styling:** NativeWind 4 (Tailwind CSS for React Native) — no CSS files
- **State:** Zustand 5 — stores in `store/use[Feature]Store.ts`
- **Icons:** Lucide-React-Native — no other icon libraries
- **Animations:** React Native Reanimated 4 + Moti
- **Forms:** React Hook Form + Zod 4 validation
- **Storage:** expo-sqlite (persistent), AsyncStorage (non-sensitive KV), expo-secure-store (tokens/PII)
- **Lists:** @shopify/flash-list for performant long lists

## Commands

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server |
| `npm run ios` | Launch iOS simulator |
| `npm run android` | Launch Android emulator |
| `npm run web` | Launch web dev server |
| `npm run build` | Export web static build |
| `npx jest` | Run tests |
| `npx tsc --noEmit` | Type-check without emitting |

## Project Structure

```
app/                    # Expo Router file-based routes (entry point)
  (tabs)/               # Tab navigator groups: (hub), (assignment), (career), (pcs), (admin), (profile), (calendar), inbox
  leave/                # Leave request flow
  sign-in.tsx           # Auth entry
  _layout.tsx           # Root layout (providers, AuthGuard)
components/             # Reusable React Native components
  ui/                   # Generic UI primitives
  spotlight/            # Spotlight search overlay
  [feature]/            # Feature-specific components
store/                  # Zustand stores (use[Feature]Store.ts)
hooks/                  # Custom React hooks (use[Feature].ts)
services/               # Business logic, API clients, storage
  api/                  # REST API client & typed endpoints
  storage.ts            # SQLite + AsyncStorage unified interface
types/                  # TypeScript types & Zod schemas
config/                 # App configuration (auth, etc.)
constants/              # Color definitions, enums
utils/                  # Pure utility functions (logger, formatting)
lib/                    # Auth context, encryption, storage hooks
scripts/                # Dev scripts, benchmarks, mocks
```

## Critical Rules

### No HTML — Native Only
- **NEVER** use `<div>`, `<span>`, `<h1>`, `<ul>`, `<li>`, `<img>`, `<a>` — they crash on iOS/Android
- **ALWAYS** use `<View>`, `<Text>`, `<Image>`, `<ScrollView>`, `<Pressable>`, `<Link>` (from expo-router)

### No CSS Files
- **NEVER** create `.css` files or use styled-components
- **ALWAYS** style via `className` prop with Tailwind classes (NativeWind)
- Exception: `global.css` defines CSS custom properties for theming

### No Web-Only APIs
- **NEVER** use `document.*`, `window.*`, `react-router-dom`
- Use `Platform.OS` checks or `.native.tsx` / `.web.tsx` file extensions when platform-specific code is needed

### Imports
- Use `@/` path alias for all project imports (e.g., `@/components`, `@/store`, `@/types`)

## Security & PII (CRITICAL)

- **Zero Trust:** Network is hostile. Trust no inputs. Enforce HTTPS/TLS.
- **PII is FORBIDDEN in logs:** SSN, DoD ID, Email, Phone — never in `console.log/warn/error`
  - Use `SecureLogger` from `@/utils/logger` which auto-redacts PII patterns
- **Auth tokens:** expo-secure-store (native) or encrypted cookies (web) — NEVER plain AsyncStorage
- **Data at rest:** SQLite (encrypted) or SecureStore for sensitive data
- **Secrets:** Always `process.env`, never hardcoded

## Conventions

### Naming
- **Stores:** `use[Feature]Store.ts` (e.g., `useLeaveStore.ts`)
- **Hooks:** `use[Feature].ts` (e.g., `useDiffClampScroll.ts`)
- **Components:** PascalCase `.tsx` (e.g., `ScreenHeader.tsx`)
- **Types/Services/Utils:** lowercase `.ts` (e.g., `storage.ts`, `schema.ts`)

### Component Pattern
```tsx
import { View, Text } from 'react-native';
import { useSomeStore } from '@/store/useSomeStore';

interface Props { /* typed props */ }

export function MyComponent({ prop }: Props) {
  const data = useSomeStore(s => s.data);
  return (
    <View className="flex-1 bg-white dark:bg-black">
      <Text className="text-lg font-semibold">{data}</Text>
    </View>
  );
}
```

### Store Pattern (Zustand)
```tsx
export const useFeatureStore = create<State>((set, get) => ({
  data: null,
  isLoading: false,
  fetchData: async () => {
    set({ isLoading: true });
    // ... fetch logic
    set({ data, isLoading: false });
  },
}));
// Export selector hooks for granular subscriptions
export const useFeatureData = () => useFeatureStore(s => s.data);
```

### Styling
- Mobile-first layout (`flex-col`), adapt for tablet/web with `md:` breakpoints
- Dark mode via `dark:` prefix and `useColorScheme()` hook
- Theme colors defined as CSS variables in `global.css`
- Custom shadows: `apple-sm`, `apple-md`, `apple-lg`
- Haptic feedback on interactive elements via `expo-haptics` with `Platform.OS` guard

### Navy Terminology
Use strict Navy terms throughout the codebase:
- "Leave" (not Vacation/PTO)
- "Detailer" (not Recruiter)
- "PRD" — Projected Rotation Date (not End Date)
- "Billet" (not Position/Job)
- "Command" (not Company/Organization)

## Testing

- **Framework:** Jest with `react-native` preset
- **Test location:** `__tests__/` directory and `components/__tests__/`
- **Pattern:** `**/__tests__/**/*.test.ts(x)`
- **Path alias:** `@/*` mapped in jest.config.js

## Deployment

- **Web:** Vercel — builds via `expo export --platform web`, outputs to `dist/`
- **Mobile:** Expo managed workflow
- **Deep linking:** `mycompass://` scheme configured in app.json
