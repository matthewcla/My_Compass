---
name: government-data-handling
description: Use when working with PII or CUI data, designing data models, implementing logging, building API integrations, handling data from external systems, or implementing network communication in a government or defense application
---

# Government Data Handling

## Overview

Classify every data field by sensitivity, never log PII, validate all external data at the boundary, and enforce VAULTIS principles on every data entity. This skill encodes requirements from NIST SP 800-53 Rev 5 (SI, SC families), DISA Mobile Application SRG (SRG-APP-000380, 000400), OWASP MASVS v2 (MASVS-PRIVACY, MASVS-NETWORK, MASVS-CODE), and the USN Data Governance Framework (VAULTIS).

## When to Use

- Designing or modifying data models / schemas
- Implementing logging in any part of the application
- Integrating with external APIs or Navy systems
- Handling PII fields (SSN, DoD ID, name, email, phone, etc.)
- Building network communication layers
- Implementing error handling that may surface data
- Reviewing data flow for compliance

**When NOT to use:** Pure styling, animation, or layout work with no data handling.

## PII / CUI Field Inventory

Know what you're handling. Every field that enters the application must be classified.

### PII — Strictly Forbidden in Logs

| Field | Why It's PII | Risk If Exposed |
|-------|-------------|----------------|
| SSN | Unique national identifier | Identity theft |
| DoD ID / EDIPI | Unique military identifier | Impersonation, system access |
| Full name | Directly identifies individual | Privacy violation |
| Email address | Directly identifies individual | Phishing, privacy violation |
| Phone number | Identifies / locates individual | Privacy violation |
| Date of birth | Combined with name = identity | Identity theft |
| Home address | Locates individual / family | Physical security risk |
| Emergency contact info | Identifies third parties | Third-party privacy violation |
| Financial data | Pay grade, base pay, bank info | Financial fraud |
| Dependent information | Identifies family members | Third-party privacy, targeting |

### CUI / FOUO

Duty station, leave balances, order details, assignment data, training records, medical readiness status. Must be encrypted at rest (see `government-secure-storage`) but does not require the same log redaction as PII.

### Unclassified

Billet listings (non-person-specific), general Navy policy, UI preferences, theme settings. Standard handling — no special protection required.

### Data Model Annotations

- **ALWAYS:** Annotate PII fields in data models with `@security PII` (JSDoc), comments, or equivalent markers in your language/framework.
- **ALWAYS:** Maintain a PII inventory for each data model — reviewable during audits.
- **ALWAYS:** When creating a new field, explicitly decide and document its classification.

```tsx
// Example: annotated schema (TypeScript + Zod)
const UserSchema = z.object({
  id: z.string().uuid(),                           // Not PII — opaque identifier

  /** @security PII — STRICTLY FORBIDDEN IN LOGS */
  dodId: z.string().optional(),

  /** @security PII — STRICTLY FORBIDDEN IN LOGS */
  displayName: z.string(),

  /** @security PII — STRICTLY FORBIDDEN IN LOGS */
  email: z.string().email().optional(),

  /** @security PII — STRICTLY FORBIDDEN IN LOGS */
  phone: z.string().optional(),

  /** @security PII — STRICTLY FORBIDDEN IN LOGS */
  dob: z.string().optional(),

  rank: z.string(),                                 // CUI/FOUO — encrypt at rest
  dutyStation: z.string().optional(),               // CUI/FOUO — encrypt at rest
  preferredTheme: z.enum(['light', 'dark']),        // Unclassified
});
```

`[MASVS-PRIVACY-1, MP-5]`

## Logging & PII Redaction

### Secure Logger Requirements

- **ALWAYS:** Use a centralized secure logger that auto-redacts PII patterns before output.
- **ALWAYS:** Patch global console methods (`console.log`, `.info`, `.warn`, `.error`) to route through the secure logger at application startup.
- **ALWAYS:** Enforce with linting rules (e.g., ESLint `no-console` with an exception for the secure logger module).

### Minimum Redaction Patterns

| Pattern | Regex | Redacts |
|---------|-------|---------|
| SSN | `\b\d{3}-\d{2}-\d{4}\b` | `123-45-6789` |
| DoD ID / EDIPI | `\b\d{10}\b` | 10-digit identifiers |
| Email | `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}` | Email addresses |
| Phone | `\b\d{3}[-.]?\d{3}[-.]?\d{4}\b` | Phone numbers |

### Deep Sanitization

- **ALWAYS:** Sanitize nested objects recursively — not just top-level strings.
- **ALWAYS:** Sanitize `Error` objects: `.message` and `.stack` may contain PII from failed API calls.
- **ALWAYS:** Sanitize arrays of objects.
- **NEVER:** Pass PII-containing objects directly to any logger, even if the logger "should" redact them — defense in depth.

### Logging Rules

- **NEVER:** `console.log(user)`, `console.log(JSON.stringify(userData))`, or any output that includes a full user/person object.
- **NEVER:** Log full request or response bodies — they often contain PII.
- **NEVER:** Log form field values that may contain PII.
- **ALWAYS:** If you must log a user reference, log only the opaque UUID.
- **ALWAYS:** Use structured logging with safe fields: `SecureLogger.info('[Store] loaded user', { id: user.id })`.

```tsx
// WRONG — logs entire user object including PII
console.log('[UserStore] loaded user:', user);

// WRONG — bypasses secure logger
console.log('[LeaveStore] contact:', request.emergencyContact);

// RIGHT — opaque ID only, through secure logger
SecureLogger.info('[UserStore] loaded user', { id: user.id });

// RIGHT — no PII in log context
SecureLogger.info('[LeaveStore] request submitted', { requestId: request.id, type: request.leaveType });
```

`[SI-11, SRG-APP-000400, MASVS-PRIVACY-3]`

## Zero Trust for External Data

All data from external APIs, backend services, or Navy systems is untrusted until validated.

### Schema Validation at the Boundary

- **ALWAYS:** Validate ALL external API responses with schema validation (Zod, Joi, Yup, or equivalent) at the service layer boundary before the data enters application state.
- **ALWAYS:** Define expected response shapes as schemas — reject data that doesn't conform.
- **ALWAYS:** Treat validation failures as errors, not warnings. Do not partially ingest invalid data.
- **NEVER:** Trust the shape, type, or content of external API responses.
- **NEVER:** Spread raw API responses directly into application state (`set({ ...response.data })`).
- **NEVER:** Use `as` type assertions on API responses — validate, don't assert.

```tsx
// WRONG — trusts API response shape
const response = await fetch('/api/user');
const user = await response.json() as User;  // Type assertion, no validation
set({ user });

// WRONG — partially ingests, ignores validation errors
const result = UserSchema.safeParse(response.data);
set({ user: result.data ?? response.data });  // Falls back to unvalidated data

// RIGHT — validates at service boundary, rejects invalid
const response = await httpClient.get('/api/user');
const result = UserSchema.safeParse(response.data);
if (!result.success) {
  throw new ValidationError('Invalid user data from API', result.error);
}
return { success: true, data: result.data };
```

### Validation Location

- **ALWAYS:** Validate in the **service layer** — not in stores, components, or middleware.
- **WHY:** The service layer is the boundary between your application and the outside world. Validating here means no unvalidated data can enter the application through any code path.

`[SI-10, MASVS-CODE-4]`

## VAULTIS Compliance

Every data entity in a government application must satisfy the seven VAULTIS principles from the USN Data Governance Framework.

| Principle | Requirement | How to Satisfy |
|-----------|-------------|----------------|
| **Visible** | Every data entity can be located and identified | Typed definitions (interfaces/schemas) in a dedicated types directory; each entity has a named home in the state layer |
| **Accessible** | Data can be retrieved through known interfaces | Typed service interfaces for all data access; no data buried in implementation details |
| **Understandable** | Data shape and meaning are clear | Self-describing field names; schema validation documents shape; domain terminology used consistently |
| **Linked** | Related data is connected | Consistent foreign keys across stores/services; relationships are explicit, not implicit |
| **Trustworthy** | Data can be relied upon for decisions | All external data validated with schemas at boundary; data provenance is traceable |
| **Interoperable** | Data works across systems | Standardized service interfaces; documented data contracts (DSA); consistent serialization formats |
| **Secure** | Data is protected from unauthorized use | Storage tiers enforced per classification; Zero Trust for external data; least privilege access |

### Applying VAULTIS

When creating a new data entity, verify:

1. Does it have a typed schema/interface? (Visible)
2. Is it accessible through a service interface, not a direct implementation import? (Accessible)
3. Are field names self-describing? Would a new developer understand them? (Understandable)
4. Are foreign keys to related entities consistent and explicit? (Linked)
5. Is external data for this entity validated at the boundary? (Trustworthy)
6. Does the service interface follow the project's standard contract pattern? (Interoperable)
7. Is it stored in the correct tier for its classification? (Secure)

`[USN Data Governance Framework]`

## Network Security

### Transport Security

- **ALWAYS:** TLS 1.2+ for all network communication. No plain HTTP, not even for "non-sensitive" endpoints.
- **ALWAYS:** Certificate pinning in production builds for known backend servers. Pin the leaf or intermediate certificate.
- **ALWAYS:** Timeout on all network requests (30 seconds recommended) with an abort mechanism.
- **ALWAYS:** Retry with exponential backoff and jitter for transient failures (429, 500, 502, 503, 504).
- **NEVER:** Disable TLS certificate verification, even in development. Use properly signed dev certificates instead.
- **NEVER:** Send sensitive data in URLs or query parameters — they appear in server logs, proxy logs, and browser history. Use request body instead.

```tsx
// WRONG — PII in query parameter
const response = await fetch(`/api/user?ssn=${ssn}`);

// RIGHT — PII in request body over TLS
const response = await fetch('/api/user', {
  method: 'POST',
  body: JSON.stringify({ ssn }),
  headers: { 'Content-Type': 'application/json' },
});
```

### Certificate Pinning

- **ALWAYS:** Pin against the server's leaf or intermediate certificate, not the root CA.
- **ALWAYS:** Include a backup pin (next rotation certificate) to avoid bricking the app on cert rotation.
- **ALWAYS:** Implement a pin failure reporting mechanism so operations knows when pins are about to expire.

`[AC-17, SC-8, SC-23, SRG-APP-000380, MASVS-NETWORK-1]`

## Data Minimization & Retention

- **ALWAYS:** Request only the fields needed for the current operation. Don't fetch entire records when you need one field.
- **ALWAYS:** Define retention policies — PII should not be cached indefinitely.
- **ALWAYS:** Clear all cached PII on sign-out (see `government-auth-and-access` skill).
- **ALWAYS:** Provide data freshness indicators (`lastSynced` timestamps) so users and systems know how current the data is.
- **NEVER:** Cache more data than necessary for offline operation.
- **NEVER:** Retain PII after the user's session ends or the data's purpose is fulfilled.

`[MASVS-PRIVACY-2]`

## Data Leakage Prevention

### Screenshots & App Snapshots

- **ALWAYS:** Prevent PII from appearing in app screenshots / task switcher snapshots.
- On iOS: use `UIApplicationProtectedDataWillBecomeUnavailable` or overlay views in `applicationWillResignActive`.
- On Android: set `FLAG_SECURE` on windows displaying PII.
- Consider a configurable privacy mode that blanks sensitive fields.

### Keyboard & Clipboard

- **ALWAYS:** Disable autocomplete and keyboard learning on PII input fields.
- **ALWAYS:** On sensitive text inputs, set `secureTextEntry`, `autoComplete="off"`, `textContentType="none"` (or platform equivalents).
- **ALWAYS:** Warn users before copying PII to clipboard, if your app supports copy.

### Backups

- **ALWAYS:** Exclude data stores containing PII from platform backups (iCloud, Google Auto Backup).
- **See:** `government-secure-storage` skill, Backup & Export Protection section.

`[SRG-APP-000400, MASVS-PLATFORM-3]`

## Error Handling

### User-Facing Errors

- **ALWAYS:** Use error boundaries / global error handlers that show safe, generic error messages with support reference codes.
- **NEVER:** Display raw error messages, stack traces, API response bodies, or SQL errors to users.
- **NEVER:** Include PII in error messages, toast notifications, or user-facing alerts.

### Error Logging

- **ALWAYS:** Sanitize error content through the secure logger before persisting or transmitting.
- **ALWAYS:** Strip server-side error details that may contain PII before logging client-side.
- **NEVER:** Log full error response bodies from APIs — extract only the error code and safe message.

```tsx
// WRONG — raw error displayed to user
catch (error) {
  Alert.alert('Error', error.message);  // May contain PII from server
}

// WRONG — full error body logged
catch (error) {
  console.error('API failed:', error.response.data);  // PII in response body
}

// RIGHT — safe error code shown, sanitized logging
catch (error) {
  const errorCode = `ERR-${Date.now()}`;
  Alert.alert('Something went wrong', `Reference: ${errorCode}. Contact support.`);
  SecureLogger.error('[Service] API call failed', {
    errorCode,
    status: error.response?.status,
    apiErrorCode: error.response?.data?.code,  // Safe server error code, not message
  });
}
```

`[SI-11, MASVS-CODE-3]`

## Data Sharing Agreements (DSA)

When integrating with external Navy systems (NSIPS, eCRM, MNA, DPS, etc.), document the data exchange formally.

### DSA Documentation (in service layer)

For each external system integration, document via JSDoc or equivalent:

- **External System:** Name and system of record
- **Data Elements:** Specific fields exchanged (not "all user data")
- **Classification:** CUI, FOUO, PII, Unclassified per field
- **Auth Method:** CAC/PKI, OAuth, API key, etc.
- **Frequency:** Real-time, batch, polling interval
- **Fallback:** Offline behavior (cache-first, queue mutations, degrade gracefully)

```tsx
/**
 * @DSA NSIPS Integration
 * @system NSIPS (Navy Standard Integrated Personnel System)
 * @data dodId (PII), rank (CUI), leaveBalance (CUI), dutyStation (CUI)
 * @classification CUI — encrypt at rest, validate at boundary
 * @auth CAC/PKI via Okta OIDC relay
 * @frequency On-demand with 15-minute cache TTL
 * @fallback Cache-first read; queue writes for sync
 */
```

`[USN Data Governance Framework — Interoperable, Data Sharing Agreements]`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Logging full user objects "for debugging" | Log only opaque UUIDs via secure logger |
| Trusting API response without validation | Validate with schema at service boundary — reject invalid |
| PII in URL query parameters | Move to request body over TLS |
| `as User` type assertion on API data | Use schema `.parse()` — validate, don't assert |
| No `@security` annotations on PII fields | Annotate every PII field in every schema |
| Displaying raw API errors to users | Show generic message + reference code |
| Autocomplete enabled on SSN input | Set `autoComplete="off"`, `textContentType="none"` |
| Caching user data after sign-out | Clear all PII from all storage tiers on sign-out |
| Fetching entire user record when only name is needed | Request minimum required fields |

## Control Reference

| Control | Standard | Requirement |
|---------|----------|-------------|
| AC-17 | NIST 800-53 | Remote Access (TLS) |
| SC-8 | NIST 800-53 | Transmission Confidentiality and Integrity |
| SC-23 | NIST 800-53 | Session Authenticity |
| SI-10 | NIST 800-53 | Information Input Validation |
| SI-11 | NIST 800-53 | Error Handling |
| MP-5 | NIST 800-53 | Media Transport |
| SRG-APP-000380 | DISA Mobile SRG | Certificate pinning |
| SRG-APP-000400 | DISA Mobile SRG | Data leakage prevention |
| MASVS-PRIVACY-1 | OWASP MASVS v2 | PII inventory and handling |
| MASVS-PRIVACY-2 | OWASP MASVS v2 | Data minimization |
| MASVS-PRIVACY-3 | OWASP MASVS v2 | Privacy protection in logs |
| MASVS-NETWORK-1 | OWASP MASVS v2 | Transport security |
| MASVS-CODE-3 | OWASP MASVS v2 | Safe error handling |
| MASVS-CODE-4 | OWASP MASVS v2 | Input validation |
| MASVS-PLATFORM-3 | OWASP MASVS v2 | Data leakage prevention |
