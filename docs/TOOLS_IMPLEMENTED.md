# Tools Implemented

> **Tool** = A full-screen interactive utility the user can visit to accomplish a specific task (distinct from multi-step wizard flows).

---

## 1. Billet Discovery (Swipe Interface)

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → My Assignment tab → Career → Discovery |
| **Route** | `/(tabs)/(career)/discovery` |
| **Components** | `BilletSwipeCard`, `SailorSwipeCard`, `DiscoveryEntryWidget` |
| **Store** | `useAssignmentStore` — swipe decisions persisted to SQLite |
| **Description** | Tinder-style card swipe interface for browsing billets with AI match scores. Swipe right to like, left to pass, up for super-like. Decisions persist across sessions. |

---

## 2. Slating Tool (Cycle Management)

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → My Assignment tab → Cycle |
| **Route** | `/(tabs)/(assignment)/cycle` |
| **Components** | `BenchCard`, `SlateSlot`, `SmartBenchPanel`, `ManifestRail`, `SlateSummaryWidget` |
| **Store** | `useAssignmentStore` — application state management |
| **Description** | Application slate builder. Drag-and-drop billet applications into preference order. Bench panel shows available applications; slate slots show ranked preferences. |

---

## 3. HHG Weight Estimator

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → UCT Phase 2 → "Schedule Household Goods" checklist item |
| **Route** | `/pcs-wizard/hhg-estimator` |
| **Components** | `HHGEstimatorScreen` (446 lines) |
| **Store** | `usePCSStore` — `addHHGItem`, `updateHHGItem`, `removeHHGItem`, `clearHHGItems` |
| **Description** | Interactive weight estimator with common item templates, custom entries, swipe-to-delete, weight gauge vs. allowance limit, and save-to-store persistence. |

---

## 4. Advance Pay Calculator

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → UCT Phase 2 → "Submit DLA / Advance Pay Request" checklist item |
| **Route** | `/pcs-wizard/financials/advance-pay` |
| **Components** | `AdvancePayScreen` (272 lines) |
| **Store** | `usePCSStore` — `financials.advancePay` state |
| **Description** | DLA amount calculator and advance pay (up to 3 months base pay) request generator with repayment schedule preview. |

---

## 5. PCS Dev Panel (Developer Tool)

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → "DEMO SCENARIOS" toggle (dev builds only) |
| **Route** | Inline panel within PCS landing page |
| **Components** | `PCSDevPanel` |
| **Store** | `usePCSStore` — `pcsContextOverride`, `demoPhase` overrides |
| **Description** | Developer-only control panel for overriding PCS states (dormant, active, archive) and UCT phases. Enables rapid testing of all PCS states without real order data. |

---

## 6. Financial Entitlements Dashboard

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → Financials bottom tab |
| **Route** | `/(tabs)/(pcs)/financials` |
| **Components** | `EntitlementsMeter`, `ObliservBanner`, `SegmentBreakdownList`, `AllowancesCard`, `AdvancePayVisualizer` |
| **Store** | `usePCSStore` — full `financials` slice |
| **Description** | Comprehensive entitlements calculator showing DLA, MALT, per diem, advance pay status, and segment-level breakdowns. Includes "Confirm Financial Plan" action and Travel Claim launch button. |

---

## 7. Inbox

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → Inbox tab |
| **Route** | `/(tabs)/inbox` → `/(tabs)/inbox/[id]` |
| **Components** | `MessageCard` |
| **Store** | SQLite-backed message persistence with read status |
| **Description** | Message center showing system notifications, approval requests, and command communications. Supports read/unread tracking, pinning, and message detail view. |

---

## 8. Calendar

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → Calendar tab |
| **Route** | `/(tabs)/(calendar)/calendar` |
| **Store** | Career events from SQLite (`career_events` table) |
| **Description** | Career event calendar showing advancement exams, boards, musters, and key PCS dates. |

---

## 9. Menu Hub

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → Menu (hamburger/grid icon) |
| **Route** | `/(tabs)/(hub)/menu` |
| **Description** | Grid-based command center providing navigation to all app spokes and features. |
