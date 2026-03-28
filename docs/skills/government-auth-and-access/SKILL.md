---
name: government-auth-and-access
description: Use when implementing authentication, authorization, login flows, session management, route protection, user roles, audit logging, or consent flows in a government or defense application that handles PII or CUI
---

# Government Auth and Access

## Overview

Authenticate with PKI/CAC-capable identity providers, enforce least privilege at every layer, log every security-relevant event, and never trust a session longer than 15 minutes. This skill encodes requirements from NIST SP 800-53 Rev 5 (AC, IA, AU families), DISA Mobile Application SRG (SRG-APP-000153, 000190, 000210, 000225), and OWASP MASVS v2 (MASVS-AUTH).

## When to Use

- Implementing sign-in / sign-out flows
- Adding or modifying route protection / auth guards
- Implementing role-based or attribute-based access control
- Building session timeout or token refresh logic
- Adding audit logging for security events
- Implementing the DoD consent banner
- Building re-authentication flows for sensitive operations

**When NOT to use:** UI-only work behind an existing auth guard with no changes to access control or session behavior.

## Authentication

### Identity Provider Requirements

- **ALWAYS:** Use a DoD PKI/CAC-capable identity provider (Okta with DoD PKI trust chain, EAMS-A, Azure AD with CAC, or equivalent).
- **ALWAYS:** OAuth 2.0 Authorization Code flow with PKCE. PKCE is mandatory — it prevents authorization code interception on mobile.
- **ALWAYS:** Validate tokens against the issuer: verify signature, check expiration (`exp`), validate audience (`aud`), confirm issuer (`iss`).
- **ALWAYS:** Use `expo-auth-session`, `AppAuth`, or equivalent certified OIDC library — do not implement the OAuth flow manually.
- **NEVER:** Implicit grant flow — it exposes tokens in URLs and browser history.
- **NEVER:** Hardcoded or mock tokens in production builds. Use `__DEV__` or environment-based flags to restrict mock auth to development only.
- **NEVER:** Store plaintext credentials (username, password, PIN) anywhere.
- **NEVER:** Custom authentication schemes — use established, audited protocols.

```tsx
// WRONG — mock token with no environment guard
const token = 'mock-access-token-12345';
setSession(token);

// RIGHT — mock auth gated to development only
if (__DEV__ && USE_MOCK_AUTH) {
  const mockToken = 'dev-mock-token';
  setSession(mockToken);
} else {
  const result = await AuthSession.startAsync({
    authUrl: buildOktaAuthUrl({ responseType: 'code', codeChallengeMethod: 'S256' }),
  });
  const token = await exchangeCodeForToken(result.params.code, codeVerifier);
  setSession(token);
}
```

**WHY:** SRG-APP-000153 requires PKI-based authentication for DoD mobile apps. PKCE prevents code interception attacks that are especially relevant on mobile where custom URL schemes can be hijacked.

`[IA-2, IA-5, SRG-APP-000153, MASVS-AUTH-1]`

### Token Storage

- **ALWAYS:** Store tokens in platform-native secure storage (iOS Keychain, Android Keystore).
- **NEVER:** Store tokens in localStorage, AsyncStorage, cookies, or URL parameters.
- **See:** `government-secure-storage` skill, Tier 1 requirements.

`[SC-28, MASVS-STORAGE-1]`

## Session Management

### Token Lifetime

- **ALWAYS:** Maximum access token TTL of 15 minutes. This is a DISA SRG hard requirement.
- **ALWAYS:** Configure token TTL server-side — client cannot extend it.
- **ALWAYS:** Validate token expiration client-side before making API calls. If expired, trigger refresh or re-authentication.

### Idle Timeout

- **ALWAYS:** Implement idle timeout that triggers sign-out after inactivity.
- **ALWAYS:** Show a warning before timeout (5-minute countdown recommended).
- **ALWAYS:** On timeout: clear all session state, tokens, and cached PII. Redirect to sign-in.
- **ALWAYS:** Track activity via touch, scroll, and keyboard events — not just navigation.

```tsx
// Example: idle timeout with warning
const IDLE_LIMIT_MS = 10 * 60 * 1000;     // 10 minutes idle
const WARNING_MS = 5 * 60 * 1000;          // Warn at 5 minutes remaining

function useIdleTimeout(onTimeout: () => void) {
  const lastActivity = useRef(Date.now());

  // Reset on user interaction
  const resetTimer = () => { lastActivity.current = Date.now(); };

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed >= IDLE_LIMIT_MS) {
        onTimeout(); // Sign out, clear state
      } else if (elapsed >= IDLE_LIMIT_MS - WARNING_MS) {
        showTimeoutWarning(IDLE_LIMIT_MS - elapsed);
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, []);

  return { resetTimer };
}
```

### Token Refresh

- **ALWAYS:** Implement token refresh rotation — each refresh token is single-use.
- **ALWAYS:** On refresh failure (expired refresh token, revoked session), redirect to sign-in immediately.
- **ALWAYS:** Refresh proactively before access token expires (e.g., at 80% of TTL).
- **NEVER:** Silently swallow refresh failures — the user must re-authenticate.
- **NEVER:** Reuse refresh tokens — if a refresh token is used twice, the server should revoke the entire session (token replay detection).

### Sign-Out

- **ALWAYS:** On sign-out, clear: access token, refresh token, cached PII, session state, in-memory user data.
- **ALWAYS:** Invalidate the session server-side (call the IdP revocation endpoint).
- **ALWAYS:** Redirect to sign-in screen after clearing state.
- **NEVER:** Leave tokens in secure storage after sign-out.
- **NEVER:** Leave cached PII in the database after sign-out.

`[AC-11, AC-12, IA-11, SRG-APP-000190, MASVS-AUTH-2]`

## Authorization (RBAC / ABAC)

### Enforcement Layers

- **ALWAYS:** Enforce access control at **both** route level and action level.
  - **Route level:** Auth guard checks role/permission before rendering a screen.
  - **Action level:** Service layer checks permission before executing a mutation.
- **ALWAYS:** Derive roles and permissions from JWT claims issued by the IdP — not from client-side state or local storage.
- **ALWAYS:** Fail closed — if role check fails, is ambiguous, or the claims are missing, deny access.
- **NEVER:** Implicit full access for authenticated users. Every route and action requires an explicit permission check.
- **NEVER:** Client-only authorization without corresponding server-side enforcement. Client guards are for UX; server guards are for security.

```tsx
// WRONG — all authenticated users see everything
if (isAuthenticated) return <AdminPanel />;

// RIGHT — role check from JWT claims
const { roles } = useAuthClaims();
if (!roles.includes('ADMIN')) return <AccessDenied />;
return <AdminPanel />;
```

### Principle of Least Privilege

- **ALWAYS:** Components access only the data they need via store selectors — not full store state.
- **ALWAYS:** API calls include only the scopes/permissions the operation requires.
- **ALWAYS:** Default new roles to zero permissions — add explicitly.

`[AC-3, AC-6, MASVS-AUTH-3]`

## Account Protection

- **ALWAYS:** Implement account lockout after a configurable number of failed login attempts (3–5 recommended).
- **ALWAYS:** Notify the user when their account is locked.
- **ALWAYS:** Require administrator action or time-based unlock (15–30 minute cooldown).
- **ALWAYS:** Log all failed authentication attempts (see Audit Logging below).

`[AC-7]`

## DoD System Use Notification (Consent Banner)

- **ALWAYS:** Display the DoD consent banner on every session start, after authentication but before access to any feature.
- **ALWAYS:** Require explicit acknowledgment (button tap) — no auto-dismiss, no timeout-dismiss.
- **NEVER:** Allow bypass, "remember my choice," or skip functionality.
- **ALWAYS:** Track acknowledgment state per session. In-memory tracking is acceptable — the banner must reappear on every fresh session.
- **ALWAYS:** Block all navigation to protected content until consent is acknowledged.

```tsx
// Example: consent gate in auth guard
function AuthGuard({ children }) {
  const { isAuthenticated } = useSession();
  const { consentAcknowledged } = useConsent();

  if (!isAuthenticated) return <Redirect href="/sign-in" />;
  if (!consentAcknowledged) return <Redirect href="/consent" />;
  return children;
}
```

**WHY:** AC-8 and SRG-APP-000225 require a system use notification that users must acknowledge before accessing any DoD system. This is a non-negotiable ATO requirement.

`[AC-8, SRG-APP-000225]`

## Audit Logging

### What to Log

- **ALWAYS:** Authentication events: login success, login failure, logout, token refresh, session timeout.
- **ALWAYS:** Authorization events: access granted, access denied, privilege escalation attempts.
- **ALWAYS:** Data mutations: create, update, delete — with entity type and entity ID.
- **ALWAYS:** Consent acknowledgment events.
- **ALWAYS:** Account lockout events.
- **ALWAYS:** Administrative actions (role changes, user management).

### Audit Record Format

Every audit record must include:

| Field | Description | Example |
|-------|-------------|---------|
| `timestamp` | ISO 8601 UTC | `2026-03-28T14:30:00.000Z` |
| `userId` | Opaque identifier (UUID) — NOT PII | `a1b2c3d4-...` |
| `action` | What was done | `LOGIN`, `UPDATE_PROFILE`, `VIEW_ORDERS` |
| `resource` | What was affected | `leave_request:uuid-123` |
| `outcome` | Result | `SUCCESS`, `FAILURE`, `DENIED` |
| `source` | Client identifier | `ios-app-v1.0.3`, `web-v1.0.3` |
| `metadata` | Additional context (non-PII) | `{ reason: "IDLE_TIMEOUT" }` |

### Implementation Requirements

- **ALWAYS:** Persist audit records locally for offline scenarios — sync to server when connected.
- **ALWAYS:** Use append-only storage for audit records — no updates or deletes.
- **ALWAYS:** Include integrity checks (hash chain or similar) to detect tampering.
- **NEVER:** Include PII in audit records. Use opaque user IDs (UUIDs), not names, emails, or DoD IDs.
- **NEVER:** Allow users to modify or delete their own audit records.
- **NEVER:** Log full request/response bodies — they often contain PII.

```tsx
// Example: audit logging service interface
interface AuditEntry {
  timestamp: string;       // ISO 8601
  userId: string;          // UUID only — no PII
  action: AuditAction;     // Enum: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ACCESS_DENIED, etc.
  resource: string;        // Entity type + ID
  outcome: 'SUCCESS' | 'FAILURE' | 'DENIED';
  source: string;          // Client identifier
  metadata?: Record<string, string>;  // Non-PII context
}

interface IAuditService {
  log(entry: Omit<AuditEntry, 'timestamp'>): Promise<void>;
  getUnsynced(): Promise<AuditEntry[]>;
  markSynced(ids: string[]): Promise<void>;
}
```

`[AU-2, AU-3, AU-8, AU-9, AU-12, SRG-APP-000210]`

## Re-Authentication for Sensitive Operations

- **ALWAYS:** Require re-authentication before: viewing full SSN or DoD ID, modifying financial data, approving/submitting official requests (leave, PCS), changing authentication settings.
- **ALWAYS:** Support biometric re-authentication where available (Face ID, Touch ID, fingerprint) as a convenient alternative to full credential entry.
- **ALWAYS:** Re-authentication should confirm identity, not just check session validity.
- **NEVER:** Use a simple "are you sure?" dialog as a substitute for re-authentication.

```tsx
// WRONG — confirmation dialog is not re-authentication
const confirmDelete = () => Alert.alert('Are you sure?', ...);

// RIGHT — biometric or credential re-authentication
const reauth = await LocalAuthentication.authenticateAsync({
  promptMessage: 'Verify your identity to view full SSN',
  fallbackLabel: 'Use passcode',
});
if (reauth.success) showFullSSN();
```

`[IA-11, IA-6, MASVS-AUTH-2]`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Mock auth tokens without `__DEV__` guard | Gate mock auth behind `__DEV__` or environment flag |
| Session timeout is UI-only (doesn't clear tokens) | On timeout: clear tokens, cached PII, session state, and redirect |
| All authenticated users see all features | Implement RBAC from JWT claims; fail closed on missing roles |
| Audit records include user email or name | Use opaque UUID only — never PII in audit trail |
| Consent banner has "Don't show again" option | Consent must appear every session — no persistence, no bypass |
| Token refresh doesn't handle failure | On refresh failure, force sign-out immediately |
| Client-only authorization with no server check | Client guards are UX; server must independently enforce access |

## Control Reference

| Control | Standard | Requirement |
|---------|----------|-------------|
| AC-3 | NIST 800-53 | Access Enforcement |
| AC-6 | NIST 800-53 | Least Privilege |
| AC-7 | NIST 800-53 | Unsuccessful Login Attempts |
| AC-8 | NIST 800-53 | System Use Notification |
| AC-11 | NIST 800-53 | Session Lock |
| AC-12 | NIST 800-53 | Session Termination |
| AU-2 | NIST 800-53 | Event Logging |
| AU-3 | NIST 800-53 | Content of Audit Records |
| AU-8 | NIST 800-53 | Time Stamps |
| AU-9 | NIST 800-53 | Protection of Audit Information |
| AU-12 | NIST 800-53 | Audit Record Generation |
| IA-2 | NIST 800-53 | Identification and Authentication |
| IA-5 | NIST 800-53 | Authenticator Management |
| IA-6 | NIST 800-53 | Authentication Feedback |
| IA-11 | NIST 800-53 | Re-Authentication |
| SRG-APP-000153 | DISA Mobile SRG | PKI/CAC authentication |
| SRG-APP-000190 | DISA Mobile SRG | Session timeout (15 min max) |
| SRG-APP-000210 | DISA Mobile SRG | Audit trail |
| SRG-APP-000225 | DISA Mobile SRG | DoD banner on startup |
| MASVS-AUTH-1 | OWASP MASVS v2 | Authentication mechanism |
| MASVS-AUTH-2 | OWASP MASVS v2 | Session management |
| MASVS-AUTH-3 | OWASP MASVS v2 | Authorization |
