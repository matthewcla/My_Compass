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

**Flow registry:** See [§2.2.2 Flow Type Registry](#flow-type-registry) below for the complete listing with flow-type classification.

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

#### 2.2.2 Flow Type Taxonomy

Every flow in My Compass belongs to one of the following **five types**. Each type has a distinct purpose, UI pattern, and set of required design elements. When building a new flow, identify its type first and follow the corresponding standard.

---

##### Type 1: Confirmation Flow

**Purpose:** Review and confirm pre-existing data section-by-section up-or-down. No data entry — only verification.

**Reference:** [profile-confirmation.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/app/pcs-wizard/profile-confirmation.tsx)

**Required Design Elements:**
1. **Multi-step status bar** with icon-per-section (e.g., `ProfileStatusBar`) — `React.memo` wrapped
2. **Tri-state icons:** `confirmed_complete` (green) · `confirmed_partial` (amber) · `skipped` (red) · `unvisited` (gray baseline)
3. **Scroll-tracked sections** with `onLayout` coordinate capture + `handleScroll` active-step detection
4. **Per-section "Confirm Section" button** — if complete → auto-scroll to next section; if incomplete → `Alert` and stay
5. **Bidirectional skip/revert logic** — forward scroll marks unvisited as skipped; backward scroll reverts skipped (after target) to unvisited; sections before target retain their state
6. **Programmatic scroll guard** (`isProgrammaticScroll` ref) to suppress `handleScroll` during icon-tap animated scrolls
7. **Footer with completion counter** (e.g., `✓ 3/5 Sections`) — final action disabled until all sections acknowledged
8. **Read-only data display** — fields are shown, not editable inline (edits happen in source screens)

**Examples:** Profile Confirmation

---

##### Type 2: Request Flow

**Purpose:** Multi-step wizard for submitting a formal request or claim. Requires data entry, validation, and submission.

**Reference:** [leave/request.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/app/leave/request.tsx)

**Required Design Elements:**
1. **`WizardStatusBar`** with sequential step progress (step icons or numbered dots)
2. **Embedded step components** receiving `embedded={true}` prop for contextual rendering
3. **Auto-save drafts** via 800ms debounced store persistence
4. **Exit confirmation modal** (Save Draft / Discard / Cancel) using `BlurView` overlay
5. **Validation per step** — block forward navigation on invalid data; surface field-level errors inline
6. **Floating HUD footer** with contextual data + primary action (Submit / Next)
7. **Success celebration** — full-screen overlay with `CheckCircle` animation, auto-navigate after 2.5s
8. **Signature ritual** (when applicable) — `SignatureButton` component for formal acknowledgment

**Examples:** Leave Request, Travel Claim

---

##### Type 3: Estimator Flow

**Purpose:** Calculator-style flow that accepts inputs and produces financial or logistical estimates. No formal submission — results are informational or feed into downstream flows.

**Reference:** [pcs-wizard/[segmentId]/index.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/app/pcs-wizard/[segmentId]/index.tsx)

**Required Design Elements:**
1. **Input sections** with clear labels and units (e.g., weight in lbs, distance in miles)
2. **Real-time calculation** — results update as inputs change (no "Calculate" button)
3. **Result card** — prominent, visually distinct display of the estimate (use `GlassView` or elevated card)
4. **Breakdown view** — itemized line items showing how the total was derived
5. **Store persistence** — estimates save to Zustand store for use by downstream flows
6. **Warning indicators** — visual alerts when inputs exceed limits (e.g., over weight allowance)

**Examples:** HHG Estimator, Advance Basic Pay

---

##### Type 4: Document Generation Flow

**Purpose:** Capture specific data fields required to populate an official military form (NAVPERS, DD, SF, etc.). The flow maps user inputs to form fields and produces a reviewable document.

**Required Design Elements:**
1. **Background prerequisite check** — the triggering condition (e.g., OBLISERV required) must be computed automatically in the store, not by the user
2. **Form-field mapping header** — clearly display which official form is being populated (e.g., "NAVPERS 1070/621 — Agreement to Extend Enlistment")
3. **Pre-populated fields** — auto-fill any data already in user/PCS stores; only prompt for missing fields
4. **Section-by-section data capture** — group fields by form section with clear labels matching the official form
5. **Review & Sign step** — summary of all captured data in form layout before submission
6. **Signature ritual** — `SignatureButton` for formal digital acknowledgment
7. **PDF preview/export** (future) — generate the completed form for download or submission

**Examples:** OBLISERV Extension (NAVPERS 1070/621), Reenlistment Contract (NAVPERS 1070/601)

---

##### Type 5: Screening Flow

**Purpose:** Compliance checklist for eligibility requirements. Each item is independently completable with status tracking.

**Required Design Elements:**
1. **Sub-checklist** — each screening requirement is an independently toggleable item
2. **Category grouping** — items grouped by domain (Medical, Dental, Security, etc.)
3. **External link integration** — items may link to external systems (NSIPS, AHLTA, etc.) via `Linking.openURL`
4. **Status rollup** — overall screening status derived from individual item completion
5. **Conditional visibility** — flow only appears in checklist when applicable (e.g., OCONUS orders, sea duty)
6. **Completion auto-marks** the parent checklist item when all sub-items are done

**Examples:** Overseas Screening, Sea Duty Screening

---

##### Flow Type Registry

| Screen | Subtitle | Title | Phase | Flow Type |
|--------|----------|-------|-------|-----------|
| Profile Confirmation | `PHASE 1` | Profile Confirmation | 1 | Confirmation |
| OBLISERV Extension | `PHASE 1` | OBLISERV Check | 1 | Document Generation |
| Overseas Screening | `PHASE 1` | Overseas Screening | 1 | Screening |
| Sea Duty Screening | `PHASE 1` | Sea Duty Screening | 1 | Screening |
| Advance Basic Pay | `PHASE 2` | Advance Basic Pay | 2 | Estimator |
| HHG Estimator | `PHASE 2` | HHG Estimator | 2 | Estimator |
| PCS Travel Plan | `PHASE 3` | PCS Travel Plan | 3 | Request |
| Travel Claim | `PHASE 4` | Travel Claim | 4 | Request |
| Gaining Command Check-In | `PHASE 4` | Check-In | 4 | Confirmation |
| Leave Request | `ADMIN FLOW` | Leave Request | — | Request |

#### 2.2.3 Flow Close Control Standard

Every flow must provide a **single close/back control** using the `ChevronLeft` icon (`<`), positioned in the **top-right corner of the flow header**, implemented as a `Pressable` with `rounded-full` hit target.

**Standard:**
- **Icon:** `ChevronLeft` from `lucide-react-native`, size `24`
- **Placement:** Top-right of the flow header, aligned with the subtitle/title row
- **Action:** Calls `router.back()` or triggers exit confirmation modal (for flows with draft state)
- **Style:** `p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800`

**Anti-patterns:**
- ❌ `X` icon for flow dismissal — never use
- ❌ Close/exit buttons in footers — footers are for primary actions only
- ❌ Multiple close affordances on the same screen

**Reference implementation:** [obliserv-request.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/app/pcs-wizard/obliserv-request.tsx) (lines 164–169)

```tsx
<Pressable
    onPress={() => router.back()}
    className="p-2 rounded-full active:bg-slate-100 dark:active:bg-slate-800"
>
    <ChevronLeft size={24} color={isDark ? '#e2e8f0' : '#1e293b'} />
</Pressable>
```

#### 2.2.4 Flow Header Container Padding Standard

Every flow header (the sticky container holding the subtitle/title row and, when present, the navigation/status bar) must use **consistent padding** to ensure uniform vertical rhythm across all flows.

**Required values (matching canonical Leave Flow):**

| Token | Value | Where |
|---|---|---|
| Container horizontal padding | `px-4` (16px) | Outer `Animated.View` or header `View` |
| Container vertical padding | `py-2` (8px top + 8px bottom) | Outer `Animated.View` or header `View` |
| Title row → nav bar gap | `mb-1` (4px) | On the title row `View` (only when a status/nav bar follows) |

**Anti-patterns:**
- ❌ `pb-4` or `paddingBottom: 12+` — over-padded; use `py-2` (8px)
- ❌ `mt-2` + `mb-4` on the title row — use `mb-1` only (spacing comes from container `py-2`)
- ❌ Omitting `paddingBottom` entirely — causes the nav bar to stick flush to the container edge

**Conforming flows:** `leave/request.tsx`, `travel-claim/request.tsx`, `[segmentId]/index.tsx`
**Reference implementation:** [leave/request.tsx](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/app/leave/request.tsx) (lines 426–457)

```tsx
<Animated.View
    entering={FadeInDown.delay(100).springify()}
    className="bg-white/95 dark:bg-slate-900/95 sticky top-0 z-10 px-4 py-2"
>
    <View className="flex-row items-start justify-between mb-1">
        {/* subtitle + title */}
    </View>
    <WizardStatusBar ... />
</Animated.View>
```

#### 2.2.5 Touch Target Standard

All interactive elements must meet **Apple HIG minimum touch target dimensions** (44pt × 44pt). This is a non-negotiable accessibility and usability requirement.

**Required minimums:**

| Element | Min Height | Min Width | Implementation |
|---------|-----------|-----------|----------------|
| Buttons, toggles, switches | 44pt | 44pt | `style={{ minHeight: 44 }}` or `py-3` equivalent |
| Editable input rows | 56pt (row) | Full width | `Pressable` wrapper + `style={{ minHeight: 56 }}` |
| Input wells (text fields) | 44pt | 44pt | `py-2.5 px-3` + `style={{ minHeight: 44 }}` |
| Icon-only actions | 44pt | 44pt | `p-2.5` with hit-slop or `p-3` |

**Input Row Pattern — Full-Row Tap-to-Focus:**

Every row containing a `TextInput` must be wrapped in a `Pressable` that calls `inputRef.focus()` on press. The user should be able to tap **anywhere on the row** to activate the input — not just the small text field.

```tsx
const inputRefs = useRef<Record<string, TextInput | null>>({});

<Pressable
    onPress={() => inputRefs.current[field.key]?.focus()}
    className="rounded-xl border border-zinc-700/40 bg-zinc-800/30 px-4 active:bg-zinc-800/60"
    style={{ minHeight: 56 }}
>
    {/* Label on left, input well on right */}
    <View className="flex-row items-center justify-between py-3">
        <Text>Label</Text>
        <View className="bg-zinc-900 border border-zinc-600/50 rounded-lg px-3 py-2.5"
              style={{ minHeight: 44 }}>
            <TextInput
                ref={(r) => { inputRefs.current[field.key] = r; }}
                className="text-base font-bold text-white"
            />
        </View>
    </View>
</Pressable>
```

**Font size for editable values:** Use `text-base` (16px) minimum for dollar amounts and numeric inputs — never `text-sm` (14px) or smaller. This ensures readability and signals editability.

**Anti-patterns:**
- ❌ `py-1.5` or `py-1` on interactive elements — too small, fails 44pt minimum
- ❌ `TextInput` without a `Pressable` row wrapper — forces precise tapping on small target
- ❌ `text-sm` for editable dollar values — reads as static text, not an input
- ❌ Input fields visually identical to static text — must have a visible well (background, border, or underline)
- ❌ `w-16` or `w-20` fixed-width inputs without `minWidth` — may clip large values

**Conforming components:** `MovingCostProjection`, `AdvancePayVisualizer`

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
