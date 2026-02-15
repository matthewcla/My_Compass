# My Compass — Design Standards

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Status:** Active

This document defines the design philosophy, interaction patterns, and coding conventions that govern the My Compass user interface. All developers and AI agents must follow these standards when creating or modifying UI components.

---

## 1. Design Philosophy

### 1.1 Glass Cockpit

The app's layout philosophy mirrors an aircraft cockpit — **high-density, zero-scroll situational awareness**. Every screen should give the user an immediate snapshot of their operational state without requiring interaction.

**Principles:**
- Critical data is always visible above the fold
- Sticky headers persist navigational context (never auto-hide headers that contain instruments like search or status)
- Cards are dense and scannable — prefer single-line stats over paragraphs
- Dark mode uses deep gradients (`navy-blue: #0A1628`) with gold accent indicators (`navy-gold: #C9A227`)

**Anti-patterns:**
- ❌ Full-screen modals that hide context
- ❌ "Loading…" spinners without skeleton content
- ❌ Accordion-only layouts that hide critical info behind taps (exception: UCT completed phases)

### 1.2 Progressive Disclosure

Information is revealed in layers. The Sailor should never see 40 items at once.

- **Layer 1:** Phase status (1 glowing active node)
- **Layer 2:** Checklist items within the active phase (3–5 items)
- **Layer 3:** Detailed wizards launched from checklist items via `actionRoute`

---

## 2. Core UI Patterns

### 2.1 Unified Contextual Track (UCT)

The UCT is the primary interface for PCS lifecycle management. It replaces the legacy flat checklist with a **vertical, state-driven accordion**.

**Structure:**
```
UnifiedContextualTrack
├── TrackNode (Phase 1: "Orders & OBLISERV")     → COMPLETED | ACTIVE | LOCKED
├── TrackNode (Phase 2: "Logistics & Finances")  → COMPLETED | ACTIVE | LOCKED
├── TrackNode (Phase 3: "Transit & Leave")       → COMPLETED | ACTIVE | LOCKED
└── TrackNode (Phase 4: "Check-in & Claim")      → COMPLETED | ACTIVE | LOCKED
```

**Node States:**

| State | Visual | Behavior |
|-------|--------|----------|
| `COMPLETED` | Green check, 60% opacity | Collapsed, tap to expand read-only receipt |
| `ACTIVE` | Blue icon, full opacity, elevated card | Auto-expanded, shows widgets + checklist |
| `LOCKED` | Gray padlock, 50% opacity | Hidden content, shake + haptic on tap |

**Widget injection:** Widgets render **inside** their TrackNode, not above the timeline. The active phase contextually displays relevant widgets.

**Reference:** [TIMELINE.md](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/TIMELINE.md) (full UCT spec)

### 2.2 Tactical Wizard (Flow Pattern)

All multi-step forms follow the **single-page continuous-scroll wizard** pattern established by the Leave Flow.

**Canonical implementation:** [request.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/app/leave/request.tsx)

**Required elements:**
1. **Sticky header** with `WizardStatusBar` showing step progress
2. **Scroll-tracked sections** using `onLayout` + `handleScroll` to auto-detect active step
3. **Embedded step components** receiving `embedded={true}` prop
4. **Floating footer** with contextual HUD data + submit/exit buttons
5. **Auto-save drafts** via 800ms debounced store persistence
6. **Exit confirmation modal** (Save Draft / Discard / Cancel) with BlurView
7. **Success celebration** — full-screen overlay with CheckCircle animation, auto-navigate after 2.5s

**Any new PCS form** (DLA Request, NSIPS Update, Travel Claim) must replicate this pattern exactly.

#### 2.2.1 Flow Header Standard

Every flow screen must display a **two-line header** above the status bar (or above the content if no status bar exists):

1. **Subtitle** — `fontSize: 11`, `fontWeight: 600`, `letterSpacing: 1.5`, uppercase, secondary color (`text-slate-400 dark:text-gray-500`)
   - For PCS flows: use `PHASE N` (e.g., `PHASE 1`, `PHASE 2`)
   - For admin flows: use flow category (e.g., `ADMIN FLOW`)
2. **Title** — `fontSize: 20`, `fontWeight: 800`, `letterSpacing: -0.5`, primary color (`text-slate-900 dark:text-white`)
   - Human-readable flow name (e.g., `Profile Confirmation`, `HHG Estimator`, `Leave Request`)

**Current flow registry:**

| Screen | Subtitle | Title | Phase |
|--------|----------|-------|-------|
| Profile Confirmation | `PHASE 1` | Profile Confirmation | 1 |
| Advance Basic Pay | `PHASE 2` | Advance Basic Pay | 2 |
| HHG Estimator | `PHASE 2` | HHG Estimator | 2 |
| PCS Travel Plan | `PHASE 3` | PCS Travel Plan | 3 |
| Travel Claim | `PHASE 4` | Travel Claim | 4 |
| Leave Request | `ADMIN FLOW` | Leave Request | — |

**Implementation example:**
```tsx
<Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1.5 }}
      className="text-slate-400 dark:text-gray-500 ml-8 mb-0">
    PHASE 2
</Text>
<Text style={{ fontSize: 20, fontWeight: '800', letterSpacing: -0.5 }}
      className="text-slate-900 dark:text-white ml-8 mb-1">
    HHG Estimator
</Text>
```

### 2.3 Smart Stack (Widget Pattern)

Widgets are small, glanceable components that can render in two modes:
- `variant="full"` — Full detail view (standalone screen)
- `variant="widget"` — Compact, card-sized view (embedded in UCT TrackNode)

**Implementation rule:** Every widget must read from its Zustand store, ensuring data consistency between widget and full views. Never pass data as props when a store selector exists.

---

## 3. Visual Design System

### 3.1 Color Palette

All colors defined in [global.css](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/global.css) and [tailwind.config.js](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/tailwind.config.js).

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `navy-blue` | `#0A1628` | `#0A1628` | Headers, premium backgrounds |
| `navy-gold` | `#C9A227` | `#C9A227` | Accent indicators, active states |
| `background` | `#FFFFFF` | `#000000` | Page background |
| `card-background` | `#FFFFFF` | Slate 800 | Card surfaces |
| `system-blue` | `#007AFF` | `#0A84FF` | Interactive elements, links |
| `label-primary` | `#000000` | `#FFFFFF` | Primary text |
| `label-secondary` | `#3C3C43` | `#EBEBF5` | Secondary/subtitle text |

**Utility classes** in `global.css`:
- `.bg-card` → White / Slate 900
- `.text-primary` → Slate 900 / Slate 50
- `.border-subtle` → Slate 100 / Slate 800

### 3.2 Typography

- **Headers:** `font-black` (900 weight) for titles, `font-bold` (700) for section headers
- **Body:** `font-medium` (500) for labels, `font-normal` (400) for descriptions
- **Micro-text:** `text-[10px]` or `text-[11px]` with `tracking-[1.5px]` uppercase for labels (e.g., "UCT PHASE", "LEAVE FLOW")

### 3.3 Shadows

Custom Apple-style shadows registered in `tailwind.config.js`:
- `apple-sm` — Subtle elevation for cards
- `apple-md` — Medium elevation for floating elements
- `apple-lg` — High elevation for modals and overlays

### 3.4 Glass Card Style

For elevated content containers (e.g., active TrackNode content):
```
className="bg-white/95 dark:bg-slate-800/90 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
```

---

## 4. Animation Standards

### 4.1 Layout Animations

All layout shifts use Reanimated 4's layout animations:
```tsx
<Animated.View layout={Layout.springify().damping(15)}>
```

### 4.2 Enter/Exit

- **Enter:** `FadeIn.duration(400)` for content areas, `FadeIn.delay(150)` for staggered children
- **Exit:** `FadeOut.duration(200)` for dismissed content
- **Zoom:** `ZoomIn` for success/celebration overlays

### 4.3 Micro-interactions

- **Shake (locked tap):** `withSequence(-10, 10, -5, 0)` at 50ms intervals via `withTiming`
- **Spring config:** `damping: 15` for most layout springs
- **No `LayoutAnimation.configureNext()`** — always use Reanimated

### 4.4 Haptic Feedback

Always guard with `Platform.OS !== 'web'`.
- `Haptics.impactAsync(Light)` — Expand/collapse, toggle
- `Haptics.impactAsync(Medium)` — Navigation, confirm action
- `Haptics.notificationAsync(Warning)` — Locked/denied tap
- `Haptics.notificationAsync(Success)` — Completion celebration

---

## 5. Navy Terminology (Mandatory)

| ✅ Use | ❌ Never Use |
|--------|-------------|
| Leave | Vacation, PTO, Time Off |
| Detailer | Recruiter, HR Rep |
| PRD | End Date, Contract End |
| Billet | Position, Job, Role |
| Command | Company, Organization |
| Sailor | Employee, User, Worker |
| Orders | Transfer Request |
| OBLISERV | Obligation, Contract Extension |
| DLA | Moving Allowance |
| TLA | Temp Housing, Hotel Allowance |
| HHG | Household Goods, Furniture |
| NSIPS | HR System |

---

## 6. Component Conventions

### 6.1 File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase `.tsx` | `TrackNode.tsx` |
| Stores | `use[Feature]Store.ts` | `usePCSStore.ts` |
| Hooks | `use[Feature].ts` | `useDiffClampScroll.ts` |
| Types | lowercase `.ts` | `pcs.ts`, `user.ts` |
| Services | lowercase `.ts` | `storage.ts`, `client.ts` |

### 6.2 Styling Rules

- **NEVER** create `.css` files (exception: `global.css` for theme tokens)
- **ALWAYS** use `className` prop with Tailwind classes via NativeWind
- **Dark mode:** Use `dark:` prefix classes or `useColorScheme()` for programmatic color
- **Platform guards:** `Platform.OS` checks for native-only features

### 6.3 Component Structure

```tsx
// 1. Imports (React, RN, external libs, internal @/ imports)
// 2. Interface/Types
// 3. Helper functions (outside component)
// 4. Component (named export, not default)
// 5. Selector hooks (for store-connected components)
```

### 6.4 No HTML Elements

| ❌ HTML | ✅ React Native |
|---------|----------------|
| `<div>` | `<View>` |
| `<span>`, `<p>`, `<h1>` | `<Text>` |
| `<img>` | `<Image>` (expo-image) |
| `<a>` | `<Link>` (expo-router) |
| `<button>` | `<Pressable>` |
| `<ul>`, `<li>` | `<FlatList>` or `<FlashList>` |
| `<input>` | `<TextInput>` |
