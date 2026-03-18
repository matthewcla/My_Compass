# My Compass — Technical Debt Register (Index)

> **Version:** 1.1 · **Updated:** 2026-03-17 · **Status:** Prototype (Offline-First, Mock Data Only)

> ⚠️ **Development Status:** This project is currently a **prototype**. Security controls, centralized authentication, and live API integrations represent deferred production requirements, not immediately actionable technical debt.

This register has been split to track both actionable frontend technical debt and deferred backend/security requirements for future API integration.

---

## Subregisters

| File | Scope | Items |
|------|-------|-------|
| [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md) | All issues resolvable within the React Native client — no live backend required | ~~TD-003~~ ✅, TD-001, TD-002, TD-004, TD-007 (FE), TD-008 (FE), TD-009, ~~TD-010~~ ✅, TD-011, TD-012, TD-013, TD-014, TD-015, TD-016, TD-017 |
| [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md) | Issues requiring server infrastructure, identity provider, or live API | TD-005, TD-006, TD-007 (BE), TD-008 (BE), TD-003 (BE) |

---

## Deferred Production Requirements (Security & Backend)

Items in this category represent features deferred to the formal API integration phase.

| ID | Title | Priority | Owner |
|----|-------|----------|-------|
| **REQ-001** | Enable and Configure Encryption | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-001-encryption-disabled) |
| **REQ-002** | FIPS-Validated Cryptography Implementation | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-002-crypto-js-not-fips-validated) |
| ~~**REQ-003**~~ | ~~`@vercel/analytics` Commercial Servers~~ ✅ RESOLVED 2026-02-27 | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-003-vercelanalytics-sends-data-to-commercial-servers) / [Backend](TECHNICAL_DEBT_BACKEND.md#td-003-backend-component-dod-approved-analytics-endpoint) |
| **REQ-004** | Hardware-Backed Key Management | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-004-encryption-key-management-insecure) |
| **REQ-005** | Service Registry Real Implementation | P1 | [Backend](TECHNICAL_DEBT_BACKEND.md#td-005-service-registry-wired-to-mocks-only) |
| **REQ-006** | Real Authentication Flow (IdP Integration) | P1 | [Backend](TECHNICAL_DEBT_BACKEND.md#td-006-no-real-authentication-flow) |
| **REQ-007** | Role-Based Access Control | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-007-frontend-component-no-role-based-access-control--client-enforcement) + [Backend](TECHNICAL_DEBT_BACKEND.md#td-007-backend-component-no-role-based-access-control--server-enforcement) |
| **REQ-008** | Server-Side Audit Logging | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-008-frontend-component-no-audit-logging--local-persistence) + [Backend](TECHNICAL_DEBT_BACKEND.md#td-008-backend-component-no-audit-logging--server-side-ingestion) |
| **REQ-009** | Encrypted Sync Queue Payloads | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-009-sync-queue-payloads-unencrypted) |
| ~~**REQ-010**~~ | ~~`console.log` Instead of SecureLogger~~ ✅ RESOLVED 2026-02-27 | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-010-consolelog-used-instead-of-securelogger-in-stores) |

---

## Actionable Technical Debt (Frontend)

Items in this category represent genuine technical debt in the current React Native implementation.

| ID | Title | Priority | Owner |
|----|-------|----------|-------|
| **TD-011** | `storage.ts` Monolith Refactor (1,517 Lines) | P2 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-011-storagets-monolith-1517-lines) |
| **TD-012** | Abstract Mock Data out of Global Stores | P2 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-012-mock-data-hardcoded-in-stores) |
| **TD-013** | Implement Local Database Migration System | P2 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-013-no-database-migration-system) |
| **TD-014** | Expand Unit and Integration Test Coverage | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-014-limited-test-coverage) |
| **TD-015** | Establish Component Performance Benchmarks | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-015-no-performance-benchmarks) |
| **TD-016** | Consolidate Animation Libraries (`moti` Redundancy) | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-016-moti-animation-library-redundancy) |
| **TD-017** | Implement Per-Screen Error Boundaries | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-017-no-per-screen-error-boundaries) |

---

## Priority Definitions

| Priority | Definition | Timeline |
|----------|-----------|----------|
| **P0** | Blocks production deployment or creates security/compliance risk | Before any ATO submission |
| **P1** | Required before connecting to CUI/PII Navy APIs | Before API integration phase |
| **P2** | Should fix for code quality and maintainability | During next refactor cycle |
| **P3** | Nice to have, no immediate risk | As capacity allows |
