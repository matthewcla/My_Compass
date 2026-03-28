---
name: government-secure-storage
description: Use when implementing encryption, key management, data storage, database schemas, persisting data to disk, or offline storage in a government or defense mobile application that handles PII or CUI
---

# Government Secure Storage

## Overview

All sensitive data at rest must be encrypted with FIPS-validated cryptography, stored in the appropriate tier based on classification, with hardware-backed key management. This skill encodes requirements from NIST SP 800-53 Rev 5 (SC-12, SC-13, SC-28), DISA Mobile Application SRG (SRG-APP-000141, 000175, 000514), and OWASP MASVS v2 (MASVS-STORAGE, MASVS-CRYPTO).

## When to Use

- Implementing any feature that persists data to disk
- Choosing where to store a piece of data (which storage tier)
- Adding or modifying database schemas
- Implementing encryption or key derivation
- Building offline/sync queue storage for mutations
- Evaluating a cryptographic library for inclusion

**When NOT to use:** Pure UI work with no data persistence. In-memory-only transient state.

## Data Classification

Before storing any data, classify it. Classification determines the required storage tier and encryption treatment.

| Classification | Examples | Storage Tier | Encryption Required |
|---------------|----------|-------------|-------------------|
| **PII** | SSN, DoD ID/EDIPI, full name, email, phone, DOB, home address, emergency contacts, financial data (pay, bank info), dependent info | Tier 1 or Tier 2 | Yes — FIPS-validated AES-256 |
| **CUI / FOUO** | Duty station, leave balances, order details, assignment data, training records, medical readiness | Tier 2 | Yes — FIPS-validated AES-256 |
| **Unclassified** | Billet listings (non-person-specific), general policy, UI preferences, theme | Tier 3 | No (but verify no PII/CUI leakage) |

**WHY:** Misclassification leads to PII stored unencrypted. When in doubt, classify higher.

## Storage Tier Requirements

### Tier 1 — Hardware-Backed Secure Storage

**Use for:** Auth tokens, session credentials, encryption keys, biometric-derived secrets.

- **ALWAYS:** Use platform-native secure storage (iOS Keychain, Android Keystore).
- **NEVER:** Use localStorage, AsyncStorage, plain files, or SharedPreferences for these items.
- **NEVER:** Store Tier 1 data in a database, even an encrypted one — the key store IS the secure storage.

```tsx
// Example: expo-secure-store (React Native / Expo)
import * as SecureStore from 'expo-secure-store';

// Store
await SecureStore.setItemAsync('auth_token', token);

// Retrieve
const token = await SecureStore.getItemAsync('auth_token');

// Delete on sign-out
await SecureStore.deleteItemAsync('auth_token');
```

**Web fallback:** Web has no hardware-backed equivalent. Use `IndexedDB` with the Web Crypto API for encryption. Accept that web storage is inherently less secure than native — document this as a known risk.

`[SC-28, SRG-APP-000175, MASVS-STORAGE-1]`

### Tier 2 — Encrypted Database

**Use for:** PII, CUI/FOUO, all structured data that contains or references sensitive fields.

- **ALWAYS:** Encrypt the database with FIPS-validated AES-256.
- **ALWAYS:** Derive the encryption key from a Tier 1 source (secure store), not from environment variables or hardcoded values.
- **NEVER:** Store PII/CUI in an unencrypted SQLite database.
- **NEVER:** Disable encryption "temporarily" for development convenience — use a dev key stored in secure storage instead.

```tsx
// Example: expo-sqlite with encryption
import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';

const dbKey = await SecureStore.getItemAsync('db_encryption_key');
const db = await SQLite.openDatabaseAsync('app.db', { encryptionKey: dbKey });
```

`[SC-28, SRG-APP-000175, MASVS-STORAGE-1]`

### Tier 3 — General Storage

**Use for:** UI preferences, theme settings, non-sensitive cached data, feature flags.

- **ALWAYS:** Audit what is stored here — verify no PII or CUI has leaked into this tier.
- **NEVER:** Store tokens, PII, credentials, or CUI in general storage.

```tsx
// Example: AsyncStorage (React Native)
import AsyncStorage from '@react-native-async-storage/async-storage';

await AsyncStorage.setItem('theme', 'dark');      // OK — non-sensitive
await AsyncStorage.setItem('user', userData);      // VIOLATION — PII in Tier 3
```

`[SC-28, MASVS-STORAGE-1]`

## Encryption Requirements

### Approved Cryptographic Approaches

- **ALWAYS:** Use FIPS 140-2 or FIPS 140-3 validated cryptographic modules.
- **ALWAYS:** AES-256-GCM (preferred) or AES-256-CBC with HMAC for data at rest.
- **ALWAYS:** Use the platform's native crypto where available.

| Approach | FIPS Status | Use When |
|----------|------------|----------|
| Web Crypto API (`SubtleCrypto`) | Validated (browser-dependent) | Web targets |
| `react-native-quick-crypto` | Wraps OpenSSL (validated builds available) | React Native |
| Platform native (CommonCrypto / Android JCA) | Validated | Native modules accessible |
| SQLCipher | Validated builds available | SQLite encryption |

### Forbidden Cryptographic Approaches

- **NEVER:** `crypto-js`, `sjcl`, `forge`, or any pure JavaScript crypto library — none are FIPS-validated.
- **NEVER:** Custom/hand-rolled encryption algorithms.
- **NEVER:** MD5 or SHA-1 for any security purpose (integrity, key derivation, etc.).
- **NEVER:** ECB mode for block ciphers.

**WHY:** DISA SRG-APP-000141 and SRG-APP-000514 explicitly require FIPS-validated cryptographic modules. JavaScript-only implementations cannot meet this bar — they run in an unvalidated runtime without hardware acceleration or certified boundaries.

```tsx
// WRONG — crypto-js is not FIPS-validated
import CryptoJS from 'crypto-js';
const encrypted = CryptoJS.AES.encrypt(data, key).toString();

// RIGHT — Web Crypto API (FIPS-validated in major browsers)
const key = await crypto.subtle.importKey('raw', keyBuffer, 'AES-GCM', false, ['encrypt']);
const iv = crypto.getRandomValues(new Uint8Array(12));
const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, dataBuffer);
```

`[SC-13, SRG-APP-000141, SRG-APP-000514, MASVS-CRYPTO-1]`

## Key Management

### Key Derivation

- **ALWAYS:** Derive encryption keys from hardware-backed sources: CAC/PKI credential, platform secure enclave, or biometric-unlocked keystore.
- **ALWAYS:** Use established KDFs with sufficient work factor: PBKDF2 (minimum 600,000 iterations for SHA-256), Argon2id (preferred where available).
- **ALWAYS:** Use unique salts per key derivation — store salts in Tier 1 storage.

### Key Storage

- **ALWAYS:** Store derived keys in platform-native secure storage (Tier 1).
- **NEVER:** Keys in environment variables exposed to client bundle (`EXPO_PUBLIC_*`, `REACT_APP_*`, `NEXT_PUBLIC_*`). These are readable in the compiled application.
- **NEVER:** Keys in `localStorage`, `AsyncStorage`, `SharedPreferences`, or any Tier 3 storage.
- **NEVER:** Deterministic or timestamp-based fallback keys (e.g., `'fallback-key-' + Date.now()`).
- **NEVER:** Hardcoded keys in source code, config files, or comments.

### Key Rotation

- **ALWAYS:** Design for key rotation from day one — store a key version identifier alongside encrypted data.
- **ALWAYS:** Re-encrypt data when rotating keys (migration path required).
- **ALWAYS:** Destroy old keys after successful rotation and re-encryption.

```tsx
// WRONG — key in environment variable visible in client bundle
const key = process.env.EXPO_PUBLIC_ENCRYPTION_KEY;

// WRONG — key in localStorage
const key = localStorage.getItem('encryption_key');

// WRONG — deterministic fallback
const key = 'fallback-key-' + Date.now();

// RIGHT — key derived and stored in secure storage
import * as SecureStore from 'expo-secure-store';
const key = await SecureStore.getItemAsync('derived_encryption_key');
// Key was originally derived via PBKDF2 from CAC/PKI credential
```

`[SC-12, MASVS-CRYPTO-2]`

## Offline / Sync Queue Storage

Mobile government apps often queue mutations for later sync. These queues store data that may contain PII/CUI.

- **ALWAYS:** Encrypt queue payloads containing PII or CUI before persisting to any storage.
- **ALWAYS:** Clear queue entries after successful sync confirmation from server.
- **ALWAYS:** Encrypt error messages stored with failed queue items — they may contain PII from server responses.
- **NEVER:** Store sensitive mutation payloads as plaintext JSON in AsyncStorage or equivalent.

```tsx
// WRONG — plaintext PII in queue storage
await AsyncStorage.setItem(`queue_${id}`, JSON.stringify({
  type: 'UPDATE_PROFILE',
  payload: { ssn: '123-45-6789', phone: '555-0100' }  // PII in plaintext
}));

// RIGHT — encrypt before storing
const encrypted = await encrypt(JSON.stringify(payload), queueEncryptionKey);
await AsyncStorage.setItem(`queue_${id}`, encrypted);
```

`[SC-28, MASVS-STORAGE-1]`

## Backup & Export Protection

- **ALWAYS:** Exclude sensitive data stores from platform backup (iCloud Backup, Google Auto Backup).
- **ALWAYS:** Set platform-specific no-backup attributes on files containing PII/CUI.
- **ALWAYS:** On Android, set `android:allowBackup="false"` or use `<full-backup-content>` rules to exclude sensitive directories.
- **ALWAYS:** On iOS, set the `NSURLIsExcludedFromBackupKey` attribute on sensitive file paths.

`[MASVS-STORAGE-2]`

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Disabling encryption "temporarily for development" | Use a dev key in secure store — never disable the encryption code path |
| Using `crypto-js` because it's easy to install | Replace with Web Crypto API or `react-native-quick-crypto` |
| Storing encryption key in `EXPO_PUBLIC_*` env var | Client bundles expose these — derive from CAC/PKI, store in secure store |
| Putting PII in AsyncStorage "because it's just a cache" | Cache still persists to disk — use Tier 2 encrypted storage |
| Storing encryption key in same database it encrypts | Key must be in Tier 1 (secure store), database is Tier 2 |
| No key rotation design | Add key version ID to encrypted records from the start |

## Control Reference

| Control | Standard | Requirement |
|---------|----------|-------------|
| SC-12 | NIST 800-53 | Cryptographic Key Establishment and Management |
| SC-13 | NIST 800-53 | Cryptographic Protection |
| SC-28 | NIST 800-53 | Protection of Information at Rest |
| SRG-APP-000141 | DISA Mobile SRG | FIPS 140-2 validated cryptography |
| SRG-APP-000175 | DISA Mobile SRG | Encrypt data at rest |
| SRG-APP-000514 | DISA Mobile SRG | FIPS cryptographic modules |
| MASVS-STORAGE-1 | OWASP MASVS v2 | Sensitive data storage |
| MASVS-STORAGE-2 | OWASP MASVS v2 | Data backup protection |
| MASVS-CRYPTO-1 | OWASP MASVS v2 | Use of proven cryptographic primitives |
| MASVS-CRYPTO-2 | OWASP MASVS v2 | Cryptographic key management |
