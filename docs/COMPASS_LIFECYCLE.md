# My Compass — Sailor Lifecycle

> **Version:** 1.0 · **Updated:** 2026-02-16 · **Status:** Active

This document defines the full lifecycle that My Compass supports — from a sailor's accession into the Navy through separation or retirement (DD-214). It is the canonical reference for how the app adapts its features, surface area, and focus based on where the sailor is in their career.

---

## Overview

My Compass is a **continuous companion**, not a one-time tool. A sailor's experience is cyclical: they receive orders, execute a PCS, settle into a new command, and eventually begin the process again. The lifecycle below captures every stage of that cycle and maps it to the app surfaces that activate, deactivate, or transform at each transition.

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SAILOR CAREER LIFECYCLE                       │
│                                                                     │
│  ┌──────────┐   ┌─────────┐   ┌─────────────┐   ┌──────────┐      │
│  │ DISCOVERY │──▶│ ON-RAMP │──▶│ NEGOTIATION │──▶│ SELECTION│      │
│  └──────────┘   └─────────┘   └─────────────┘   └──────────┘      │
│       ▲                                               │            │
│       │                                               ▼            │
│       │                                      ┌────────────────┐    │
│       │                                      │ ORDERS         │    │
│       │                                      │ PROCESSING     │    │
│       │                                      └────────────────┘    │
│       │                                               │            │
│       │                                               ▼            │
│       │                                      ┌────────────────┐    │
│       │                                      │ ORDERS         │    │
│       │                                      │ RELEASED       │    │
│       │                                      └────────────────┘    │
│       │                                               │            │
│       │                                               ▼            │
│       │   ┌────────────┐   ┌────────────────────────────────┐      │
│       │   │  CHECK-IN  │◀──│     MY PCS (UCT Phases 1–4)    │      │
│       │   └────────────┘   └────────────────────────────────┘      │
│       │         │                                                   │
│       └─────────┘  (cycle restarts)                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase Definitions

The lifecycle is divided into two domains:

1. **My Assignments** — Career planning and orders acquisition (phases 1–6)
2. **My PCS** — Move execution and settling in (UCT Phases 1–4 + command onboarding)

### Domain 1: My Assignments

These phases are modeled in code as the `AssignmentPhase` union type.

> **Source:** [`types/pcs.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/types/pcs.ts) · **Store:** `useDemoStore.assignmentPhaseOverride`

| # | Phase | Code Key | Duration / Trigger | Description |
|---|-------|----------|-------------------|-------------|
| 1 | **Discovery** | `DISCOVERY` | > 3 months before MNA cycle opens | Passive billet exploration. The sailor browses available billets, builds a preferences profile, and refines their career strategy. The app surfaces the **Billet Discovery** (swipe) tool, RSCA projections, and career funnel analytics. |
| 2 | **On-Ramp** | `ON_RAMP` | 3 months → MNA cycle opening | Active preparation. CNPC markets opportunities to the sailor; the sailor narrows their preferences and learns how to maximize the orders negotiation process. The app shifts from open-ended browsing to focused coaching: preference rankings, detailer talking points, and billet comparison tools. |
| 3 | **Negotiation** | `NEGOTIATION` | MNA selection cycle is open | The sailor's official MNA (Marketplace for Naval Assignments) window. They submit their ranked choices and communicate with their detailer. The app tracks submission status, deadline countdowns, and negotiation correspondence. |
| 4 | **Selection** | `SELECTION` | Sailor is selected for orders | Orders have been matched. The app presents the gaining command, projected report date, and any conditional requirements. If the selected orders require service obligation beyond the sailor's EAOS, the **OBLISERV requirement** is surfaced here — the sailor must reenlist or extend before orders can proceed. The app surfaces the OBLISERV Extension flow (NAVPERS 1070/621) and tracks reenlistment eligibility as a gate within this phase. |
| 5 | **Orders Processing** | `ORDERS_PROCESSING` | Orders enter the approval pipeline | The sailor's orders are being routed through the approval chain. The app provides a status tracker showing the current approval stage and estimated release date. |
| 6 | **Orders Released** | `ORDERS_RELEASED` | Official orders are in hand | The sailor holds signed orders. This is the **transition point** — My Assignments yields focus to **My PCS**. The `ORDERS_RELEASED` phase automatically activates PCS features in the Dev Panel. |

### Domain 2: My PCS (Unified Contextual Track)

Once orders are released, the sailor enters the PCS execution pipeline. My PCS is governed by the **Unified Contextual Track (UCT)** — a 4-phase accordion that guides the sailor from screening through travel claim settlement.

> **Source:** [`constants/UCTPhases.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/constants/UCTPhases.ts) · **Store:** `usePCSStore`

| UCT Phase | Title | Description | Key App Surfaces |
|-----------|-------|-------------|------------------|
| **Phase 1** | Member Screening | Verify orders, confirm OBLISERV, complete medical/dental/security screenings | Profile Confirmation flow, Overseas Screening, Sea Duty Screening |
| **Phase 2** | Logistics & Finances | Pre-departure logistics: HHG shipment, advance pay, DLA, TMO scheduling | HHG Estimator, Advance Pay, Financial Summary, HHG Move Planner |
| **Phase 3** | Transit & Leave | En-route travel. The sailor moves from origin through intermediate stops to the gaining command | PCS Segment Planner, Receipt Capture, Leave Impact tracker |
| **Phase 4** | Check-in & Travel Claim | Arrive on-station, complete gaining command check-in, file DD 1351-2 travel claim | Gaining Command Check-In flow, Travel Claim flow, Liquidation tracker |

#### PCS Sub-Stages (within the UCT)

The user's context provided additional granularity within the PCS pipeline:

| Sub-Stage | Maps to UCT | Description |
|-----------|-------------|-------------|
| **Plan Move** | Phase 2 | Sailor plans HHG shipment, books TMO, arranges travel |
| **Execute Move (En-route)** | Phase 3 | Sailor is in transit — origin → intermediate stops → ultimate duty station |
| **Arrive On-Station** | Phase 4 (pre-check-in) | Sailor has arrived but has not yet reported to the gaining command |
| **Check-In to Command** | Phase 4 (post-check-in) | Command onboarding: 8-department check-in (Admin, PSD, Medical, Dental, Supply, Disbursing, Security, Division) |

---

## Lifecycle → App Surface Mapping

This table shows which implemented widgets and features are active or dormant at each lifecycle stage. Grouped by domain.

> ✅ = Active/Primary · ⚪ = Dormant/Hidden

### Dashboard Widgets

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| StatusCard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| StatsCard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LeaveCard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| DiscoveryCard | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |

### Assignment & Cycle Widgets

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| DiscoveryEntryWidget | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| BilletSwipeCard | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| JobCard | ✅ | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| SlateSummaryWidget | ⚪ | ⚪ | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| BenchCard | ⚪ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| SlateSlot / SmartBenchPanel | ⚪ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| ManifestRail | ⚪ | ⚪ | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |

### PCS Track & Orchestration

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| PCSHeroBanner | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ | ✅ |
| UnifiedContextualTrack | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ | ✅ |
| TrackNode | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ | ✅ |
| TrackChecklistItem | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ | ✅ |
| ProfileConfirmationCard | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| SegmentTimeline | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ |

### PCS UCT-Injected Widgets

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| ObliservBanner *(conditional)* | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | ✅ | ⚪ | ⚪ | ⚪ |
| HHGWeightGaugeWidget | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | ⚪ |
| PCSFinancialSnapshot | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ | ⚪ |
| LeaveImpactWidget | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ |
| ReceiptScannerWidget | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ |
| DigitalOrdersWallet | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ⚪ |
| BaseWelcomeKit | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| ArrivalBriefingWidget | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| GainingCommandCard | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| TravelClaimHUDWidget | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| LiquidationTrackerWidget | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |

### PCS Financial Components

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| AllowancesCard | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ |
| EntitlementsMeter | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ |
| SegmentBreakdownList | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ |
| AdvancePayVisualizer | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ | ✅ |

### Leave & Travel Widgets

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| QuickLeaveTicket | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| LeaveImpactHUD | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| TravelClaimHUD | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| ExpenseCard | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ |
| ReceiptUploader | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ✅ | ✅ |

### Inbox & Onboarding

| Widget | Discovery | On-Ramp | Negotiation | Selection | Processing | PCS Ph1 | PCS Ph2 | PCS Ph3 | PCS Ph4 |
|--------|-----------|---------|-------------|-----------|------------|---------|---------|---------|---------|
| MessageCard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| OnboardingCard | ✅ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |

---

## Transition Rules

These rules govern how the app transitions between lifecycle stages.

### Assignment → PCS Handoff

```
ORDERS_RELEASED  →  PCS Phase 1 (automatic)
```

When `assignmentPhaseOverride` is set to `ORDERS_RELEASED`, PCS features activate automatically. In production, this transition will be triggered by an API event from the orders management system.

### PCS Completion → Assignment Reset

```
PCS Phase 4 COMPLETE  →  DISCOVERY (cycle restarts)
```

After the sailor completes all Phase 4 checklist items (command check-in + travel claim), the PCS order is archived to the **Digital Sea Bag** (`usePCSArchiveStore`) and the sailor re-enters Discovery for their next assignment cycle.

### OBLISERV Requirement (within Selection)

OBLISERV is **not a separate phase** — it is a conditional gate within the `SELECTION` phase. If the selected orders require service obligation beyond the sailor's current EAOS (End of Active Obligated Service), the sailor must reenlist or extend before orders can advance to `ORDERS_PROCESSING`. The app evaluates this automatically by comparing `EAOS` against `reportNLT`.

---

## Code References

| Concept | File | Notes |
|---------|------|-------|
| `AssignmentPhase` type | [`types/pcs.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/types/pcs.ts#L6-L12) | Union of 6 assignment phases |
| UCT phase config | [`constants/UCTPhases.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/constants/UCTPhases.ts) | 4 PCS phases with titles and descriptions |
| Assignment phase labels | [`components/pcs/PCSDevPanel.tsx`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/components/pcs/PCSDevPanel.tsx#L30-L38) | Display labels for dev panel |
| Phase override store | [`store/useDemoStore.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/store/useDemoStore.ts) | `assignmentPhaseOverride` state |
| PCS state management | [`store/usePCSStore.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/store/usePCSStore.ts) | UCT phase tracking, checklist, segments |
| PCS archive | [`store/usePCSArchiveStore.ts`](file:///Users/matthewclark/Documents/_PERS/My_Compass/My_Compass/store/usePCSArchiveStore.ts) | Digital Sea Bag — historical orders |

---

## Agent Implementation Notes

When building features that are lifecycle-aware:

1. **Check the active `AssignmentPhase`** before rendering assignment-domain widgets. Features outside the current phase should be hidden, not disabled.
2. **UCT phase gating is handled by `TrackNode`** — nodes in `LOCKED` state reject interaction with a shake animation + haptic warning.
3. **The lifecycle is circular.** After PCS Phase 4 completion, the system must cleanly archive the current PCS data and reset to Discovery. Never assume a sailor only PCSes once.
4. **OBLISERV is a requirement, not a phase.** It is a conditional gate within `SELECTION` — check the `EAOS` against the `reportNLT` date to determine if extension is needed. Do not model it as a separate lifecycle step.
5. **"Orders Released" is the bridge.** It lives in the Assignment domain but triggers PCS activation. This transition must be atomic — both domains must update in a single store action to prevent UI flickering.
