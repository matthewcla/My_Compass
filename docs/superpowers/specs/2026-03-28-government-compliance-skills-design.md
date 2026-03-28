# Government Compliance Skills — Design Spec

**Date:** 2026-03-28
**Scope:** 3 reusable skills for government-compliant mobile app development
**Compatibility:** Claude Code, Jules (Google), any agent supporting agentskills.io spec
**Location:** `docs/skills/` (project-level, accessible to all agents)

---

## Purpose

Create three skill files that guide AI coding agents to produce code and designs that meet government security and compliance standards. Skills encode the requirements from NIST SP 800-53 Rev 5 (Moderate), DISA Mobile Application SRG, OWASP MASVS v2 / Mobile Top 10 (2024), and USN Data Governance (VAULTIS).

## Design Decisions

- **Organized by development activity** (not by framework) — matches how developers think
- **Framework-agnostic requirements with pattern examples** — rules state the requirement, examples use React Native/Expo as illustration
- **General guidance, not tied to findings** — skills are durable; review reports track current issues
- **YAML frontmatter per agentskills.io spec** — compatible with Claude Code and Jules
- **NEVER/ALWAYS/WHY format** for rules — scannable, unambiguous
- **Control mapping on every rule** — traceability to NIST, SRG, MASVS for assessors

## Discovery & Loading

- **Claude Code:** Skills referenced in CLAUDE.md Section 6 (Reference Map). Claude Code loads skills via `docs/skills/` path when relevant work is detected.
- **Jules:** Skills referenced in AGENTS.md at project root. Jules discovers skills through AGENTS.md pointers.
- **Other agents:** Any agent that reads Markdown with YAML frontmatter can consume these skills.

---

## Skill 1: `government-secure-storage`

**File:** `docs/skills/government-secure-storage/SKILL.md`

**Triggers:** Implementing encryption, key management, data storage, database schemas, persisting data to disk, offline storage.

### Sections

1. **Overview** — Core principle: all sensitive data at rest must be encrypted with FIPS-validated cryptography, stored in the appropriate tier, with hardware-backed key management.

2. **Data Classification**
   - PII: SSN, DoD ID, name, email, phone, DOB, address, emergency contacts, financial data
   - CUI/FOUO: duty station, leave balances, order details, assignment data
   - Unclassified: billet listings, UI preferences, theme settings
   - Rule: classification determines storage tier and encryption requirements

3. **Storage Tier Requirements**
   - Tier 1 (Hardware-Backed Secure Storage): auth tokens, session credentials, encryption keys
     - ALWAYS: platform-native secure storage (iOS Keychain, Android Keystore)
     - NEVER: localStorage, AsyncStorage, plain files
     - Example: `expo-secure-store`
   - Tier 2 (Encrypted Database): PII, CUI, structured data
     - ALWAYS: encrypted with FIPS-validated AES-256
     - NEVER: unencrypted SQLite, plaintext JSON files
     - Example: `expo-sqlite` with encryption extension
   - Tier 3 (General Storage): UI preferences, non-sensitive cache
     - ALWAYS: verify no PII/CUI before using this tier
     - NEVER: tokens, PII, credentials, sensitive data
     - Example: `AsyncStorage`
   - [SC-28, SRG-APP-000175, MASVS-STORAGE-1]

4. **Encryption Requirements**
   - ALWAYS: FIPS 140-2/140-3 validated cryptographic modules
   - ALWAYS: AES-256-GCM or AES-256-CBC with HMAC for data at rest
   - NEVER: JavaScript-only crypto libraries (crypto-js, sjcl, etc.) — not FIPS-validated
   - NEVER: custom or hand-rolled encryption
   - Approved alternatives: Web Crypto API (SubtleCrypto), react-native-quick-crypto, platform-native crypto
   - [SC-13, SRG-APP-000141, SRG-APP-000514, MASVS-CRYPTO-1]

5. **Key Management**
   - ALWAYS: derive keys from hardware-backed sources (CAC/PKI, platform secure enclave)
   - ALWAYS: store derived keys in platform-native secure storage
   - ALWAYS: use established KDFs (PBKDF2, Argon2) with sufficient iterations
   - NEVER: keys in environment variables exposed to client bundle
   - NEVER: keys in localStorage or AsyncStorage
   - NEVER: deterministic/timestamp-based fallback keys
   - NEVER: hardcoded keys in source code
   - [SC-12, MASVS-CRYPTO-2]

6. **Offline/Sync Queue Storage**
   - ALWAYS: encrypt payloads containing PII/CUI before persisting to queue storage
   - ALWAYS: clear queue entries after successful sync
   - NEVER: store sensitive mutation payloads as plaintext
   - [SC-28, MASVS-STORAGE-1]

7. **Backup & Export**
   - ALWAYS: exclude sensitive data stores from platform backup (iCloud, Google Backup)
   - ALWAYS: mark sensitive files with platform-specific no-backup attributes
   - [MASVS-STORAGE-2]

---

## Skill 2: `government-auth-and-access`

**File:** `docs/skills/government-auth-and-access/SKILL.md`

**Triggers:** Implementing authentication, authorization, login flows, session management, route protection, user roles, audit logging, consent flows.

### Sections

1. **Overview** — Core principle: authenticate with PKI/CAC-capable identity providers, enforce least privilege at every layer, log every security-relevant event, and never trust a session longer than 15 minutes.

2. **Authentication Requirements**
   - ALWAYS: use DoD PKI/CAC-capable identity provider (Okta with DoD PKI trust chain, EAMS-A, etc.)
   - ALWAYS: OAuth 2.0 Authorization Code with PKCE — no implicit grant
   - ALWAYS: validate tokens against issuer (signature, expiration, audience)
   - NEVER: hardcoded or mock tokens in production builds
   - NEVER: store plaintext credentials anywhere
   - NEVER: custom auth schemes — use established protocols
   - [IA-2, IA-5, SRG-APP-000153, MASVS-AUTH-1]

3. **Session Management**
   - ALWAYS: maximum token TTL of 15 minutes (SRG requirement)
   - ALWAYS: implement idle timeout with warning (5-minute warning recommended)
   - ALWAYS: hard sign-out on timeout — clear all session state
   - ALWAYS: implement token refresh rotation (refresh token single-use)
   - ALWAYS: invalidate sessions server-side on sign-out
   - NEVER: trust client-side-only session validation for sensitive operations
   - [AC-11, AC-12, IA-11, SRG-APP-000190, MASVS-AUTH-2]

4. **Authorization (RBAC/ABAC)**
   - ALWAYS: enforce access control at both route level and action level
   - ALWAYS: derive roles/permissions from JWT claims, not client-side state
   - ALWAYS: apply principle of least privilege — components access only what they need
   - ALWAYS: fail closed — deny access if role check fails or is ambiguous
   - NEVER: implicit full access for authenticated users
   - NEVER: client-only authorization without server enforcement
   - [AC-3, AC-6, MASVS-AUTH-3]

5. **Account Protection**
   - ALWAYS: implement account lockout after configurable failed attempts (recommend 3-5)
   - ALWAYS: lockout notification to user
   - ALWAYS: require admin or time-based unlock
   - [AC-7]

6. **DoD System Use Notification**
   - ALWAYS: display DoD consent banner on every session start, post-authentication
   - ALWAYS: require explicit acknowledgment before granting access to any feature
   - NEVER: allow bypass, auto-dismiss, or "remember my choice"
   - ALWAYS: track acknowledgment (in-memory per session is acceptable)
   - [AC-8, SRG-APP-000225]

7. **Audit Logging**
   - ALWAYS: log authentication events (login, logout, failed attempts, token refresh)
   - ALWAYS: log authorization events (access granted, access denied, privilege escalation)
   - ALWAYS: log data mutations (create, update, delete) with entity type and ID
   - ALWAYS: include in every audit record: timestamp (ISO 8601), user ID (not PII), action, resource, outcome (success/failure)
   - ALWAYS: persist audit records locally (for offline) and sync to server when connected
   - ALWAYS: protect audit records from tampering (append-only, integrity checks)
   - NEVER: include PII in audit records — use opaque user IDs only
   - NEVER: allow users to modify or delete their own audit records
   - [AU-2, AU-3, AU-8, AU-9, AU-12, SRG-APP-000210, MASVS-STORAGE-1]

8. **Re-Authentication**
   - ALWAYS: require re-authentication before sensitive operations (viewing full SSN, modifying financial data, approving leave)
   - ALWAYS: support biometric re-authentication where available (Face ID, fingerprint)
   - [IA-11, IA-6, MASVS-AUTH-2]

---

## Skill 3: `government-data-handling`

**File:** `docs/skills/government-data-handling/SKILL.md`

**Triggers:** Working with PII/CUI data, designing data models, implementing logging, building API integrations, handling external data, implementing network communication.

### Sections

1. **Overview** — Core principle: classify every data field, never log PII, validate all external data at the boundary, and enforce VAULTIS principles on every data entity.

2. **PII/CUI Field Inventory**
   - PII (STRICTLY FORBIDDEN IN LOGS): SSN, DoD ID/EDIPI, full name, email, phone, DOB, home address, emergency contact info, financial data (pay grade, base pay, bank info), dependent information
   - CUI/FOUO: duty station, leave balances, order details, assignment data, training records, medical readiness status
   - Unclassified: billet listings (non-person-specific), general Navy policy, UI preferences
   - ALWAYS: annotate PII fields in data models with `@security PII` or equivalent marker
   - ALWAYS: maintain a PII inventory for each data model
   - [MASVS-PRIVACY-1, MP-5]

3. **Logging & PII Redaction**
   - ALWAYS: use a centralized secure logger that auto-redacts PII patterns
   - ALWAYS: redact at minimum: SSN (`\d{3}-\d{2}-\d{4}`), DoD ID (`\d{10}`), email addresses, phone numbers
   - ALWAYS: patch global console methods to route through the secure logger
   - ALWAYS: sanitize Error objects recursively (message and stack may contain PII)
   - ALWAYS: sanitize nested objects — not just top-level strings
   - NEVER: `console.log(user)`, `console.log(JSON.stringify(userData))`, or any direct PII output
   - NEVER: log full request/response bodies that may contain PII
   - ALWAYS: if you must log a user reference, log only an opaque ID (UUID), never the full object
   - Enforce with linting rules (e.g., ESLint no-console with secure logger exception)
   - [SI-11, SRG-APP-000400, MASVS-PRIVACY-3]

4. **Zero Trust for External Data**
   - ALWAYS: validate ALL data from external APIs with schema validation (e.g., Zod) at the service boundary before it enters the application
   - ALWAYS: define expected shapes as schemas — reject data that doesn't conform
   - ALWAYS: treat validation failures as errors, not warnings — don't partially ingest bad data
   - NEVER: trust the shape, type, or content of external API responses
   - NEVER: spread raw API responses into application state without validation
   - Pattern: validate in the service layer, not in stores or components
   - [SI-10, MASVS-CODE-4]

5. **VAULTIS Compliance**
   - **Visible:** every data entity has a typed definition (interface/schema) and a home in the state layer
   - **Accessible:** data is available through typed service interfaces, not buried in implementation details
   - **Understandable:** schemas document data shape; field names are self-describing; Navy terminology used consistently
   - **Linked:** related data uses consistent foreign keys and references across stores/services
   - **Trustworthy:** all external data validated with schemas at the boundary before entering the app
   - **Interoperable:** all data access through standardized service interfaces; data contracts documented
   - **Secure:** storage tiers enforced per classification; Zero Trust assumed for all external data
   - [USN Data Governance Framework]

6. **Network Security**
   - ALWAYS: TLS for all network communication — no plain HTTP
   - ALWAYS: certificate pinning in production builds for known backend servers
   - ALWAYS: timeout on all network requests (30s recommended) with AbortController or equivalent
   - ALWAYS: retry with exponential backoff and jitter for transient failures
   - NEVER: sensitive data in URLs or query parameters — use request body
   - NEVER: disable TLS verification, even in development
   - [AC-17, SC-8, SC-23, SRG-APP-000380, MASVS-NETWORK-1]

7. **Data Minimization & Retention**
   - ALWAYS: request only the fields needed for the current operation
   - ALWAYS: define retention policies — don't cache PII indefinitely
   - ALWAYS: clear cached PII on sign-out
   - ALWAYS: provide data freshness indicators (lastSynced timestamps)
   - NEVER: cache more data than necessary for offline operation
   - [MASVS-PRIVACY-2]

8. **Data Leakage Prevention**
   - ALWAYS: prevent PII from appearing in screenshots/app snapshots (use privacy mode / secure flag)
   - ALWAYS: prevent PII from entering keyboard cache / autocomplete dictionaries
   - ALWAYS: prevent PII from being copied to clipboard without user intent
   - ALWAYS: exclude sensitive data stores from platform backups
   - [SRG-APP-000400, MASVS-PLATFORM-3]

9. **Error Handling**
   - ALWAYS: use error boundaries / global error handlers that show safe error codes, not raw error content
   - NEVER: display raw error messages, stack traces, or API responses to users
   - NEVER: include PII in error messages, toast notifications, or user-facing alerts
   - ALWAYS: sanitize error content before logging
   - [SI-11, MASVS-CODE-3]

---

## Cross-Skill Conventions

- YAML frontmatter with `name` and `description` per agentskills.io spec
- `description` starts with "Use when..." and lists triggering conditions only (no workflow summary)
- NEVER/ALWAYS/WHY format for every rule
- Control references in brackets after each rule group: `[NIST-ID, SRG-ID, MASVS-ID]`
- Pattern examples use React Native/Expo but rules are framework-agnostic
- Cross-references between skills where concerns overlap
- Compatible with Claude Code (via CLAUDE.md reference) and Jules (via AGENTS.md reference)

## File Structure

```
docs/skills/
  government-secure-storage/
    SKILL.md
  government-auth-and-access/
    SKILL.md
  government-data-handling/
    SKILL.md
```

## Agent Discovery

**CLAUDE.md addition** (Section 6 Reference Map):
```
| Government security: storage & encryption | docs/skills/government-secure-storage/SKILL.md | Before implementing storage, encryption, or key management |
| Government security: auth & access | docs/skills/government-auth-and-access/SKILL.md | Before implementing auth, authorization, or audit logging |
| Government security: data handling | docs/skills/government-data-handling/SKILL.md | Before handling PII/CUI, external data, or logging |
```

**AGENTS.md** (project root, for Jules):
```markdown
# Agent Instructions

## Skills
- [Government Secure Storage](docs/skills/government-secure-storage/SKILL.md) — Use when implementing encryption, key management, or data storage
- [Government Auth and Access](docs/skills/government-auth-and-access/SKILL.md) — Use when implementing authentication, authorization, or audit logging
- [Government Data Handling](docs/skills/government-data-handling/SKILL.md) — Use when handling PII/CUI data, logging, or external API integration
```
