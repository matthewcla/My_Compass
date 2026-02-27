# My Compass — Technical Debt Register (Index)

> **Version:** 1.1 · **Updated:** 2026-02-27 · **Status:** Pre-Production (Offline-First, Mock Data Only)

This register has been split into frontend and backend files for clearer ownership and sprint planning.

---

## Subregisters

| File | Scope | Items |
|------|-------|-------|
| [TECHNICAL_DEBT_FRONTEND.md](TECHNICAL_DEBT_FRONTEND.md) | All issues resolvable within the React Native client — no live backend required | ~~TD-003~~ ✅, TD-001, TD-002, TD-004, TD-007 (FE), TD-008 (FE), TD-009, ~~TD-010~~ ✅, TD-011, TD-012, TD-013, TD-014, TD-015, TD-016, TD-017 |
| [TECHNICAL_DEBT_BACKEND.md](TECHNICAL_DEBT_BACKEND.md) | Issues requiring server infrastructure, identity provider, or live API | TD-005, TD-006, TD-007 (BE), TD-008 (BE), TD-003 (BE) |

---

## Quick Reference — All Items

| ID | Title | Priority | Owner |
|----|-------|----------|-------|
| **TD-001** | Encryption Disabled | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-001-encryption-disabled) |
| **TD-002** | `crypto-js` Not FIPS-Validated | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-002-crypto-js-not-fips-validated) |
| ~~**TD-003**~~ | ~~`@vercel/analytics` Commercial Servers~~ ✅ RESOLVED 2026-02-27 | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-003-vercelanalytics-sends-data-to-commercial-servers) / [Backend](TECHNICAL_DEBT_BACKEND.md#td-003-backend-component-dod-approved-analytics-endpoint) |
| **TD-004** | Encryption Key Management Insecure | P0 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-004-encryption-key-management-insecure) |
| **TD-005** | Service Registry Wired to Mocks Only | P1 | [Backend](TECHNICAL_DEBT_BACKEND.md#td-005-service-registry-wired-to-mocks-only) |
| **TD-006** | No Real Authentication Flow | P1 | [Backend](TECHNICAL_DEBT_BACKEND.md#td-006-no-real-authentication-flow) |
| **TD-007** | No Role-Based Access Control | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-007-frontend-component-no-role-based-access-control--client-enforcement) + [Backend](TECHNICAL_DEBT_BACKEND.md#td-007-backend-component-no-role-based-access-control--server-enforcement) |
| **TD-008** | No Audit Logging | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-008-frontend-component-no-audit-logging--local-persistence) + [Backend](TECHNICAL_DEBT_BACKEND.md#td-008-backend-component-no-audit-logging--server-side-ingestion) |
| **TD-009** | Sync Queue Payloads Unencrypted | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-009-sync-queue-payloads-unencrypted) |
| ~~**TD-010**~~ | ~~`console.log` Instead of SecureLogger~~ ✅ RESOLVED 2026-02-27 | P1 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-010-consolelog-used-instead-of-securelogger-in-stores) |
| **TD-011** | `storage.ts` Monolith (1,517 Lines) | P2 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-011-storagets-monolith-1517-lines) |
| **TD-012** | Mock Data Hardcoded in Stores | P2 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-012-mock-data-hardcoded-in-stores) |
| **TD-013** | No Database Migration System | P2 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-013-no-database-migration-system) |
| **TD-014** | Limited Test Coverage | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-014-limited-test-coverage) |
| **TD-015** | No Performance Benchmarks | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-015-no-performance-benchmarks) |
| **TD-016** | `moti` Animation Library Redundancy | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-016-moti-animation-library-redundancy) |
| **TD-017** | No Per-Screen Error Boundaries | P3 | [Frontend](TECHNICAL_DEBT_FRONTEND.md#td-017-no-per-screen-error-boundaries) |

---

## Priority Definitions

| Priority | Definition | Timeline |
|----------|-----------|----------|
| **P0** | Blocks production deployment or creates security/compliance risk | Before any ATO submission |
| **P1** | Required before connecting to CUI/PII Navy APIs | Before API integration phase |
| **P2** | Should fix for code quality and maintainability | During next refactor cycle |
| **P3** | Nice to have, no immediate risk | As capacity allows |
