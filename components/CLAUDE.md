# components/ — Component Conventions

> Read the root `CLAUDE.md` first. This file covers component-specific patterns only.

---

## Directory Structure

| Directory | Contents | Examples |
|-----------|----------|---------|
| `ui/` | Generic primitives (buttons, inputs, modals, overlays) | `AliveInput.tsx`, `FilterChip.tsx`, `ContextualFAB.tsx` |
| `wizard/` | Shared wizard step components | `ReviewSign.tsx`, `Step4Checklist.tsx` |
| `pcs/` | PCS feature components | `PCSChecklist.tsx`, `SegmentTimeline.tsx` |
| `pcs/widgets/` | PCS widgets (embedded in UCT) | `HHGWeightGaugeWidget.tsx`, `TravelClaimHUDWidget.tsx` |
| `pcs/wizard/` | PCS wizard steps and status bars | `PCSStep1Dates.tsx`, `PCSWizardStatusBar.tsx` |
| `pcs/archive/` | PCS document archive UI | `DocumentListItem.tsx`, `PDFViewerModal.tsx` |
| `pcs/financials/` | PCS financial visualizations | `EntitlementsMeter.tsx`, `AllowancesCard.tsx` |
| `travel-claim/` | Travel claim wizard components | `ExpenseCard.tsx`, `ReceiptUploader.tsx` |
| `discovery/` | Billet discovery UI | `DiscoveryFilters.tsx`, `DiscoveryHeader.tsx` |
| `navigation/` | Scroll/collapse infrastructure | `ScrollControlContext.tsx` |
| `spotlight/` | Global search overlay | `SpotlightOverlay.tsx` |
| Root level | Shared cross-feature components | `ScreenHeader.tsx`, `CollapsibleScaffold.tsx`, `Skeleton.tsx` |

---

## Component Pattern

```tsx
// 1. Imports (React, RN, external libs, internal @/ imports)
import { View, Text, Pressable } from 'react-native';

// 2. Props interface
interface MyComponentProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

// 3. Named export (never default)
export function MyComponent({ title, subtitle, onPress }: MyComponentProps) {
  return (
    <Pressable onPress={onPress} className="p-4 bg-white dark:bg-slate-800 rounded-xl">
      <Text className="text-base font-semibold text-slate-900 dark:text-white">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</Text>
      )}
    </Pressable>
  );
}
```

**Structure order:** Imports → Interface → Helper functions (outside component) → Component → Selector hooks (if store-connected)

---

## Rules

**NEVER:** `<div>`, `<span>`, or any HTML element
**ALWAYS:** `<View>`, `<Text>`, `<Pressable>`, `<ScrollView>`, `<Image>`

**NEVER:** `.css` files or `styled-components`
**ALWAYS:** `className` with NativeWind Tailwind classes

**NEVER:** Default exports
**ALWAYS:** Named exports

**NEVER:** `TouchableOpacity` (deprecated pattern in this codebase)
**ALWAYS:** `Pressable` with `active:` styles or `ScalePressable` for scale-down feedback

**NEVER:** `FlatList` for long lists
**ALWAYS:** `FlashList` from `@shopify/flash-list` for lists >20 items

**NEVER:** Inline `style={{ }}` objects for static styles
**ALWAYS:** `className`. Exception: dynamic values that cannot be expressed in Tailwind (e.g., computed `width`)

---

## Design Standards

- **Glass Cockpit:** Dense, scannable, critical data above the fold
- **Dark mode:** Required on every component — use `dark:` prefix classes
- **Shadows:** `apple-sm`, `apple-md`, `apple-lg` (defined in `tailwind.config.js`)
- **Haptic feedback:** `expo-haptics` on interactive elements, guarded with `Platform.OS !== 'web'`
- **Skeleton loading:** Use `Skeleton.tsx` pattern, never bare "Loading..." text
- **Full spec:** `docs/DESIGN_STANDARDS.md`

---

## Platform-Specific Components

When behavior must differ by platform, use file extensions:

- `MyComponent.native.tsx` — iOS/Android implementation
- `MyComponent.tsx` or `MyComponent.web.tsx` — Web fallback

Reference: `components/ui/ScannerModal/`

---

## Animation Standards

- **Gesture-driven:** Reanimated 4 worklets for 60fps on UI thread
- **Mount/unmount:** Moti for declarative transitions
- **Spring config:** `damping: 15, stiffness: 150` (default feel)
- **Duration-based:** 200–300ms for micro-interactions, 400–600ms for page transitions
- **Haptics with animation:** `Light` for expand/collapse, `Medium` for navigation, `Warning` for denied tap, `Success` for celebration
- **Full spec:** `docs/DESIGN_STANDARDS.md` Section 4

---

## Widget Pattern

Widgets render in two modes:

- `variant="full"` — Full detail view (standalone screen)
- `variant="widget"` — Compact card view (embedded in UCT TrackNode)

**Rule:** Every widget reads from its Zustand store. Never pass data as props when a store selector exists — this ensures data consistency between widget and full views.
