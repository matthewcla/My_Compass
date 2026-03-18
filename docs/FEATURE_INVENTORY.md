# My Compass — Unified Feature Inventory

This document combines the status of all Flows, Tools, and Widgets to provide a single view of feature completeness.

---

## 🌊 Flows (Multi-Screen Journeys)
### Implemented
# Flows Implemented

> **Flow** = A multi-screen sequence the user navigates through to complete a task.

---

## 1. Leave Request Wizard

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → My Admin tab → "Submit Leave" → Leave Wizard |
| **Route** | `/leave/request` (new) · `/leave/[id]` (edit) |
| **Steps** | 4-step continuous-scroll wizard (Intent → Contact → Command → Safety/Review) |
| **Components** | `WizardCard`, `WizardStatusBar`, `LeaveImpactHUD` |
| **Store** | `useLeaveStore` — draft persistence, validation, submission |
| **Status** | ✅ Fully functional with smart defaults, chargeable day calculation, approval chain |

---

## 2. Leave History

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → My Admin tab → "Leave History" |
| **Route** | `/leave/history` |
| **Status** | ✅ List of past leave requests with status badges |

---

## 3. PCS Segment Planning Wizard

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → UCT Phase 3 → "Plan Travel: [Segment]" checklist item |
| **Route** | `/pcs-wizard/[segmentId]` |
| **Steps** | 4-step continuous-scroll wizard (Dates → Mode → Itinerary → Review) |
| **Components** | `PCSStep1Dates`, `PCSStep2Mode`, `PCSStep3Itinerary`, `PCSStep4Review`, `PCSWizardStatusBar` |
| **Store** | `usePCSStore` — segment data updates |
| **Status** | ✅ Fully functional with scroll-based step tracking |

---

## 4. HHG Weight Estimator

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → UCT Phase 2 → "Schedule Household Goods (DPS)" checklist item |
| **Route** | `/pcs-wizard/hhg-estimator` |
| **Components** | `HHGEstimatorScreen` — template-based item picker, swipe-to-delete, weight gauge |
| **Store** | `usePCSStore` — `addHHGItem`, `updateHHGItem`, `removeHHGItem` |
| **Status** | ✅ Fully functional |
| **⚠️ Issue** | Checklist `actionRoute` is `/pcs-wizard/hhg` which may 404 — should be `/pcs-wizard/hhg-estimator` |

---

## 5. Advance Pay / DLA Request

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → UCT Phase 2 → "Submit DLA / Advance Pay Request" checklist item |
| **Route** | `/pcs-wizard/financials/advance-pay` |
| **Components** | `AdvancePayScreen` — DLA calculator, advance pay request generator |
| **Store** | `usePCSStore` — `financials.advancePay` state |
| **Status** | ✅ Fully functional |

---

## 6. PCS Financial Summary

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → "Financials" bottom tab |
| **Route** | `/(tabs)/(pcs)/financials` |
| **Components** | `EntitlementsMeter`, `ObliservBanner`, `SegmentBreakdownList`, `AllowancesCard`, `AdvancePayVisualizer` |
| **Store** | `usePCSStore` — `financials` slice |
| **Status** | ✅ Full read-only summary with "Confirm Financial Plan" action. Links to Travel Claim. |

---

## 7. Travel Claim (DD 1351-2)

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → UCT Phase 4 → "File DD 1351-2 Travel Claim" checklist item |
| **Route** | `/travel-claim/request` (new) · `/travel-claim/[id]` (edit) |
| **Steps** | 5-step continuous-scroll wizard (Trip → Lodging → Travel → Meals → Review) |
| **Components** | `TravelClaimHUD`, `TravelStep1TripDetails`, `TravelStep2Lodging`, `TravelStep3Travel`, `TravelStep4Meals`, `TravelStep5Review`, `ExpenseCard`, `ReceiptUploader` |
| **Store** | `useTravelClaimStore` |
| **Status** | ✅ Fully functional with receipt upload |
| **⚠️ Issue** | Checklist `actionRoute` is `/pcs-wizard/travel-claim` which may 404 — should be `/travel-claim/request` |

---

## 8. Sign In

| Property | Detail |
|----------|--------|
| **User Path** | App launch (unauthenticated) |
| **Route** | `/sign-in` |
| **Status** | ✅ Authentication flow with demo user support |

---

## 9. Inbox Message Detail

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → Inbox tab → tap message |
| **Route** | `/(tabs)/inbox/[id]` |
| **Status** | ✅ Message detail view with read status tracking |

---

## 10. Billet Discovery (Swipe)

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → My Assignment tab → Discovery (swipe interface) |
| **Route** | `/(tabs)/(career)/discovery` |
| **Components** | `BilletSwipeCard`, `SailorSwipeCard`, `DiscoveryEntryWidget` |
| **Store** | `useAssignmentStore` — swipe decisions |
| **Status** | ✅ Tinder-style swipe cards with match scoring |

---

## 11. Gaining Command Check-In

| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 4 → "Complete Gaining Command Check-In" |
| **Route** | `/pcs-wizard/check-in` |
| **Components** | `DepartmentCard` (8 departments: Admin, PSD, Medical, Dental, Supply, Disbursing, Security, Division) |
| **Store** | `usePCSStore` — marks "Complete Gaining Command Check-In" as COMPLETE on submit |
| **Status** | ✅ Type 1 Confirmation flow with department sign-off tracking, progress bar, document reminders, and success overlay |

### Not Implemented
# Flows Not Implemented

> **Flow** = A multi-screen sequence the user navigates through to complete a task.
> Items below are referenced in-app (checklist items, store types, or UI placeholders) but lack a built screen.

---

## ~~1. Profile Confirmation Flow~~ ✅ IMPLEMENTED

| Property | Detail |
|----------|--------|
| **UCT Phase** | 1 — Orders & OBLISERV |
| **Route** | `/pcs-wizard/profile-confirmation` |
| **Header** | `PHASE 1` / Profile Confirmation |
| **Pattern** | 5-step ProfileStatusBar (Service → Contact → Dependents → Housing → Vehicle) with scroll-tracked sections, per-section confirm buttons (green/amber/red tri-state), skip detection on icon tap, and disabled final confirm until all sections acknowledged |
| **Completeness Affordances** | Icon-only coloring (green = complete, amber = partial, red = skipped); connecting lines always neutral gray |

---

## 2. OBLISERV Check Flow

| Property | Detail |
|----------|--------|
| **UCT Phase** | 1 — Orders & OBLISERV |
| **Checklist Item** | "OBLISERV Check" |
| **Current Behavior** | Manual toggle only (no `actionRoute`) |
| **What's Needed** | EAOS vs. report-NLT date comparison, extension/reenlistment guidance, link to NSIPS |
| **Suggested Route** | `/pcs-wizard/obliserv-check` |

---

## 3. Overseas Screening Flow

| Property | Detail |
|----------|--------|
| **UCT Phase** | 1 — Orders & OBLISERV |
| **Checklist Item** | "Overseas Screening" *(conditional — OCONUS orders only)* |
| **Current Behavior** | Manual toggle only (no `actionRoute`) |
| **What's Needed** | Medical, dental, and security screening sub-checklist for OCONUS duty stations |
| **Suggested Route** | `/pcs-wizard/overseas-screening` |

---

## 4. Sea Duty Screening Flow

| Property | Detail |
|----------|--------|
| **UCT Phase** | 1 — Orders & OBLISERV |
| **Checklist Item** | "Sea Duty Screening" *(conditional — sea duty orders only)* |
| **Current Behavior** | Manual toggle only (no `actionRoute`) |
| **What's Needed** | Physical readiness screening checklist for sea duty assignments |
| **Suggested Route** | `/pcs-wizard/sea-duty-screening` |

---

## 5. NSIPS Dependency Data Update Guide

| Property | Detail |
|----------|--------|
| **UCT Phase** | 2 — Logistics & Finances |
| **Checklist Item** | "Update NSIPS Dependency Data (Page 2)" |
| **Current Behavior** | Manual toggle only (no `actionRoute`) |
| **What's Needed** | Guidance screen explaining Page 2 impact on DLA/travel pay, with external link to NSIPS |
| **Suggested Route** | `/pcs-wizard/nsips-guide` |

---

## ~~6. Gaining Command Check-In Flow~~ ✅ IMPLEMENTED

| Property | Detail |
|----------|--------|
| **UCT Phase** | 4 — Check-in & Travel Claim |
| **Checklist Item** | "Complete Gaining Command Check-In" |
| **Route** | `/pcs-wizard/check-in` |
| **Status** | ✅ 8-department confirmation flow with sign-off tracking |

---

## 7. Move Cycle Screen

| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → Move sub-tab |
| **Route** | `/(tabs)/(pcs)/move` |
| **Current State** | Stub — renders "Move Cycle" placeholder text only (16 lines) |
| **What's Needed** | Full move planning UI (timeline, TMO coordination, housing search) |

---

## 8. Pay Status Screen

| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → My Admin tab → Pay Status |
| **Route** | `/(tabs)/(admin)/pay-status` |
| **Current State** | Placeholder or minimal implementation |
| **What's Needed** | Pay statement viewer, LES integration, tax document access |

---

## 9. Surveys Screen

| Property | Detail |
|----------|--------|
| **User Path** | Profile tab → Surveys |
| **Route** | `/(tabs)/(profile)/surveys` |
| **Current State** | Placeholder or minimal implementation |
| **What's Needed** | Survey completion flow for command climate, satisfaction surveys |


---

## 🛠️ Tools (Standalone Applets)
### Implemented
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

### Not Implemented
# Tools Not Implemented

> **Tool** = A full-screen interactive utility the user can visit to accomplish a specific task.
> Items below are either planned, referenced in roadmaps, or have stub screens.

---

## 1. BAH Calculator

| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → Financials or UCT Phase 2 widget link |
| **Purpose** | Look up Basic Allowance for Housing rates by zip code, rank, and dependency status |
| **API Dependency** | DoD BAH rate tables (public data) |
| **Priority** | High — directly impacts housing decisions during PCS |

---

## 2. TMO (Transportation Management Office) Scheduler

| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → Move tab or UCT Phase 2 |
| **Purpose** | Schedule pack-out, delivery, and storage dates with TMO. Currently, the HHG Estimator tracks weight but there's no scheduling interface. |
| **API Dependency** | DPS (Defense Personal Property System) or manual entry |
| **Priority** | High — critical PCS logistics |

---

## 3. Housing Search Aggregator

| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → Move tab |
| **Purpose** | Search available housing near gaining command — aggregates AHRN listings, base housing availability, and local rental markets |
| **API Dependency** | AHRN API (if available), external listing APIs |
| **Priority** | Medium |

---

## 4. PCS Document Vault

| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS tab — accessible from all UCT phases |
| **Purpose** | Secure storage and quick access for orders, endorsements, travel vouchers, and receipts. PDF caching infrastructure exists (`pdfCache.ts`, `cachedOrders` in store) but no dedicated viewer/manager screen. |
| **Existing Foundation** | `pdfCache.ts` utility, `PDFViewerModal` component, `cachedOrders` store state |
| **Priority** | Medium — foundation exists, needs UI shell |

---

## 5. LES (Leave & Earnings Statement) Viewer

| Property | Detail |
|----------|--------|
| **Planned Location** | My Admin → Pay Status |
| **Purpose** | View and analyze monthly pay statements, track allotments, and compare pay periods |
| **API Dependency** | MyPay API or PDF import |
| **Priority** | Medium |

---

## 6. NSIPS Self-Service Portal Link

| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → UCT Phase 2 (from "Update NSIPS Dependency Data" checklist) or Profile tab |
| **Purpose** | Deep-link or guided walkthrough for updating Page 2 dependency data in NSIPS |
| **Note** | Could be a WebView wrapper or external link with instructional overlay |
| **Priority** | Medium |

---

## 7. Advancement Exam Prep Tool

| Property | Detail |
|----------|--------|
| **Planned Location** | Career tab or Calendar event detail |
| **Purpose** | Study material tracker, bibliography checklist, exam date countdown |
| **Priority** | Low — nice-to-have for career management |

---

## ~~8. Check-In Sheet Generator~~ ✅ IMPLEMENTED

| Property | Detail |
|----------|--------|
| **Location** | My PCS → UCT Phase 4 → "Complete Gaining Command Check-In" |
| **Route** | `/pcs-wizard/check-in` |
| **Status** | ✅ 8-department sign-off flow (Admin, PSD, Medical, Dental, Supply, Disbursing, Security, Division) |

---

## 9. Sponsor Finder

| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → UCT Phase 1 or Move tab |
| **Purpose** | Connect with gaining command sponsor for relocation guidance |
| **API Dependency** | Command directory or manual assignment |
| **Priority** | Medium |

---

## 10. Evaluation Tracker

| Property | Detail |
|----------|--------|
| **Planned Location** | Career tab or Profile |
| **Purpose** | Track NAVFIT/EVAL due dates, submission status, and trait averages |
| **Note** | Companion to the NAVFIT-Infinity project |
| **Priority** | Low — separate product domain |


---

## 🧩 Widgets (Dashboard & Contextual Cards)
### Implemented
# Widgets Implemented

> **Widget** = A self-contained UI component that displays data or provides interaction within a screen (not a full-page flow).

---

## Dashboard Widgets

### StatusCard
| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → top of dashboard |
| **File** | `components/dashboard/StatusCard.tsx` |
| **Purpose** | Duty status, watch section, current assignment summary |

### StatsCard
| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → dashboard stats row |
| **File** | `components/dashboard/StatsCard.tsx` |
| **Purpose** | Quick numeric stats (leave balance, days to PRD, etc.) |

### LeaveCard
| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → dashboard |
| **File** | `components/dashboard/LeaveCard.tsx` |
| **Purpose** | Leave balance snapshot with submit action |

### DiscoveryCard
| Property | Detail |
|----------|--------|
| **User Path** | Home Hub → dashboard |
| **File** | `components/dashboard/DiscoveryCard.tsx` |
| **Purpose** | Billet discovery CTA / match preview |

---

## PCS Widgets (UCT Phase-Injected)

### BaseWelcomeKit
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 4 (ACTIVE node) |
| **File** | `components/pcs/widgets/BaseWelcomeKit.tsx` |
| **Purpose** | Gaining command overview card with quarterdeck directions, uniform of the day, and contacts |

### ArrivalBriefingWidget
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 4 (ACTIVE node) |
| **File** | `components/pcs/widgets/ArrivalBriefingWidget.tsx` |
| **Purpose** | 72-hour arrival timeline with day counter and auto-checkmarks linked to Phase 4 checklist items |

### DigitalOrdersWallet
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 3 (ACTIVE node, active travel sub-phase) |
| **File** | `components/pcs/widgets/DigitalOrdersWallet.tsx` |
| **Purpose** | Quick-access digital copy of stamped orders |

### GainingCommandCard
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 4 (ACTIVE node) |
| **File** | `components/pcs/widgets/GainingCommandCard.tsx` |
| **Purpose** | Gaining command contact info, check-in requirements |

### HHGWeightGaugeWidget
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 2 (ACTIVE node) |
| **File** | `components/pcs/widgets/HHGWeightGaugeWidget.tsx` |
| **Purpose** | Visual gauge of estimated HHG weight vs. allowance limit |

### LeaveImpactWidget
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 3 (ACTIVE node) |
| **File** | `components/pcs/widgets/LeaveImpactWidget.tsx` |
| **Purpose** | Travel days, proceed time, and chargeable leave impact (widget variant of LeaveImpactHUD) |

### LiquidationTrackerWidget
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 4 (ACTIVE node) |
| **File** | `components/pcs/widgets/LiquidationTrackerWidget.tsx` |
| **Purpose** | Travel claim submission progress tracker |

### ReceiptScannerWidget
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 3 (ACTIVE node, active travel sub-phase) |
| **File** | `components/pcs/widgets/ReceiptScannerWidget.tsx` |
| **Purpose** | Quick receipt capture CTA for travel expenses |

### TravelClaimHUDWidget
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 4 (ACTIVE node) |
| **File** | `components/pcs/widgets/TravelClaimHUDWidget.tsx` |
| **Purpose** | Travel claim status mini-HUD inside UCT |

### PCSFinancialSnapshot
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → UCT Phase 2 (ACTIVE node) |
| **File** | `components/pcs/widgets/PCSFinancialSnapshot.tsx` |
| **Purpose** | Consolidated DLA + MALT + Per Diem + Advance Pay totals card |

---

## PCS Financial Components

### AllowancesCard
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → Financials tab (full) · UCT Phase 2 (widget variant) |
| **File** | `components/pcs/financials/AllowancesCard.tsx` |
| **Purpose** | DLA, MALT, per diem breakdowns with `variant='widget'` support |

### EntitlementsMeter
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → Financials tab |
| **File** | `components/pcs/financials/EntitlementsMeter.tsx` |
| **Purpose** | Visual meter of total estimated entitlements |

### ObliservBanner
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → Financials tab · UCT Phase 1 |
| **File** | `components/pcs/financials/ObliservBanner.tsx` |
| **Purpose** | OBLISERV status warning/confirmation banner |

### SegmentBreakdownList
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → Financials tab |
| **File** | `components/pcs/financials/SegmentBreakdownList.tsx` |
| **Purpose** | Per-segment travel entitlement breakdown |

### AdvancePayVisualizer
| Property | Detail |
|----------|--------|
| **User Path** | My PCS → Financials tab |
| **File** | `components/pcs/financials/AdvancePayVisualizer.tsx` |
| **Purpose** | Advance pay status and repayment schedule visualization |

---

## PCS Track & Orchestration

### PCSHeroBanner
| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → top of active state |
| **File** | `components/pcs/PCSHeroBanner.tsx` |
| **Purpose** | Destination header, countdown, progress bar, next-action CTA |

### UnifiedContextualTrack
| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → active state body |
| **File** | `components/pcs/track/UnifiedContextualTrack.tsx` |
| **Purpose** | Core UCT orchestrator — groups checklist by phase, injects widgets |

### TrackNode
| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → each UCT phase node |
| **File** | `components/pcs/track/TrackNode.tsx` |
| **Purpose** | Phase node with status icon, expand/collapse, days-until indicator |

### TrackChecklistItem
| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → inside each TrackNode |
| **File** | `components/pcs/track/TrackChecklistItem.tsx` |
| **Purpose** | Individual checklist row with toggle, action route, help tooltip |

### ProfileConfirmationCard
| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → initial setup |
| **File** | `components/pcs/ProfileConfirmationCard.tsx` |
| **Purpose** | Profile data confirmation during PCS initialization |

### SegmentTimeline
| Property | Detail |
|----------|--------|
| **User Path** | My PCS tab → segment overview |
| **File** | `components/pcs/SegmentTimeline.tsx` |
| **Purpose** | Visual timeline of PCS travel segments |

---

## Assignment Widgets

### DiscoveryEntryWidget
| Property | Detail |
|----------|--------|
| **User Path** | My Assignment tab → Discovery entry |
| **File** | `components/assignment/DiscoveryEntryWidget.tsx` |
| **Purpose** | Entry point CTA for billet discovery swipe interface |

### SlateSummaryWidget
| Property | Detail |
|----------|--------|
| **User Path** | My Assignment tab → Slate summary |
| **File** | `components/assignment/SlateSummaryWidget.tsx` |
| **Purpose** | Summary of user's current application slate |

### BilletSwipeCard
| Property | Detail |
|----------|--------|
| **User Path** | Career → Discovery (swipe interface) |
| **File** | `components/BilletSwipeCard.tsx` |
| **Purpose** | Tinder-style billet card with match score, location, details |

### JobCard / JobCardSkeleton
| Property | Detail |
|----------|--------|
| **User Path** | My Assignment tab → billet list views |
| **File** | `components/JobCard.tsx` · `components/JobCardSkeleton.tsx` |
| **Purpose** | Standard billet display card with skeleton loading state |

---

## Cycle / Slating Components

### BenchCard
| Property | Detail |
|----------|--------|
| **User Path** | My Assignment → Cycle tab |
| **File** | `components/cycle/BenchCard.tsx` |
| **Purpose** | Application card on the slating bench |

### ManifestRail
| Property | Detail |
|----------|--------|
| **User Path** | Career → Manifest |
| **File** | `components/cycle/ManifestRail.tsx` |
| **Purpose** | Cycle manifest rail display |

### SlateSlot / SmartBenchPanel
| Property | Detail |
|----------|--------|
| **User Path** | My Assignment → Cycle tab |
| **File** | `components/cycle/SlateSlot.tsx` · `components/cycle/SmartBenchPanel.tsx` |
| **Purpose** | Drag-and-drop slate slot and bench management panel |

---

## Leave & Travel Widgets

### QuickLeaveTicket
| Property | Detail |
|----------|--------|
| **User Path** | Leave screens |
| **File** | `components/leave/QuickLeaveTicket.tsx` |
| **Purpose** | Quick-glance leave request summary ticket |

### LeaveImpactHUD
| Property | Detail |
|----------|--------|
| **User Path** | Leave Wizard → floating HUD |
| **File** | `components/wizard/LeaveImpactHUD.tsx` |
| **Purpose** | Real-time leave balance impact calculator (widget + full variants) |

### TravelClaimHUD
| Property | Detail |
|----------|--------|
| **User Path** | Travel Claim Wizard → floating HUD |
| **File** | `components/travel-claim/TravelClaimHUD.tsx` |
| **Purpose** | Running total and expense summary during claim entry |

### ExpenseCard
| Property | Detail |
|----------|--------|
| **User Path** | Travel Claim Wizard → expense list |
| **File** | `components/travel-claim/ExpenseCard.tsx` |
| **Purpose** | Individual expense line item display |

### ReceiptUploader
| Property | Detail |
|----------|--------|
| **User Path** | Travel Claim Wizard → receipt capture |
| **File** | `components/travel-claim/ReceiptUploader.tsx` |
| **Purpose** | Photo capture and upload for receipts |

---

## Inbox & Messaging

### MessageCard
| Property | Detail |
|----------|--------|
| **User Path** | Inbox tab → message list |
| **File** | `components/inbox/MessageCard.tsx` |
| **Purpose** | Inbox message row with unread indicator, type icon |

---

## Onboarding

### OnboardingCard
| Property | Detail |
|----------|--------|
| **User Path** | First launch onboarding |
| **File** | `components/onboarding/OnboardingCard.tsx` |
| **Purpose** | Swipeable onboarding introduction cards |

### Not Implemented
# Widgets Not Implemented

> **Widget** = A self-contained UI component that displays data within a screen.
> Items below are either referenced in code but render stubs, or are planned features that have no component yet.

---

## PCS Widgets Needed

### Gaining Command Card
| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → UCT Phase 4 (Home Hub) |
| **Purpose** | Consolidated gaining command detail card (address, UIC, key contacts) |
| **Note** | `GainingCommandCard` component exists but was removed from the Home Hub layout in favour of the more compact `BaseWelcomeKit`. Could be re-surfaced in a dedicated command detail screen. |

### Move Planning Timeline Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → Move tab |
| **Purpose** | Visual timeline of move milestones (TMO, pack-out, delivery windows) |
| **Depends On** | Move Cycle flow implementation |

### Housing Search Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → Move tab or UCT Phase 2 |
| **Purpose** | Quick-access housing search links (AHRN, BAH calculator) |

### OBLISERV Status Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → UCT Phase 1 |
| **Purpose** | Visual EAOS vs. report-date comparison with action prompt |
| **Note** | `ObliservBanner` exists but only in Financials context; Phase 1 needs a decision-focused variant |

### Screening Status Dashboard Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | My PCS → UCT Phase 1 (OCONUS/sea duty orders) |
| **Purpose** | Medical, dental, and security screening completion tracker |

---

## Dashboard Widgets Needed

### Upcoming Events Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | Home Hub dashboard |
| **Purpose** | Next 3–5 career events from calendar |
| **Note** | Calendar screen exists but no dashboard summary widget |

### Pay Summary Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | Home Hub dashboard or My Admin |
| **Purpose** | LES summary, next pay date, allotments overview |

### Notification Badge Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | Home Hub → header area |
| **Purpose** | Aggregated unread count across inbox, tasks, and approvals |

---

## Assignment Widgets Needed

### Application Status Tracker Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | My Assignment tab |
| **Purpose** | Visual tracker showing each application's status in the detailing pipeline |

### Detailing Timeline Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | My Assignment → Cycle tab |
| **Purpose** | Current cycle timeline with key dates (slate open, board date, results) |

---

## Profile Widgets Needed

### Career Snapshot Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | Profile tab |
| **Purpose** | Service milestones, time-in-rate, PRD countdown |

### Qualifications / NEC Widget
| Property | Detail |
|----------|--------|
| **Planned Location** | Profile tab |
| **Purpose** | Current NECs, qualifications, and warfare designators |

