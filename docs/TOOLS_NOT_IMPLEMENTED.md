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
