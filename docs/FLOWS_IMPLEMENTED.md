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
