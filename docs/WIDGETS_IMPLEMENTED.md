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
