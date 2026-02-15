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

## 6. Gaining Command Check-In Flow

| Property | Detail |
|----------|--------|
| **UCT Phase** | 4 — Check-in & Travel Claim |
| **Checklist Item** | "Complete Gaining Command Check-In" |
| **Current Behavior** | Manual toggle only (no `actionRoute`) |
| **What's Needed** | Interactive check-in sheet with department sign-off tracking (Admin, Medical, Dental, Supply, etc.) |
| **Suggested Route** | `/pcs-wizard/check-in` |

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
