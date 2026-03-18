# My Compass — Dependency Manifest

> **Version:** 1.0 · **Updated:** 2026-02-14 · **Generated from:** `package.json`

This document audits every production dependency for license, risk level, and ATO-readiness. Use this as the basis for a CycloneDX or SPDX SBOM when required.

> **Generate machine-readable SBOM:** `npx @cyclonedx/cyclonedx-npm --output-file sbom.json`

---

## Risk Level Definitions

| Level | Definition |
|-------|-----------|
| ✅ Low | Pure JS/TS, widely audited, no native code, no external network calls |
| 🟡 Moderate | Contains native binary code, or accesses sensitive device APIs |
| 🔴 High | Non-compliant license, transmits data externally, or uses non-FIPS crypto |

---

## Production Dependencies

### Core Framework

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `react` | 19.1.0 | MIT | ✅ Low | |
| `react-dom` | 19.1.0 | MIT | ✅ Low | Web target only |
| `react-native` | 0.81.5 | MIT | ✅ Low | |
| `react-native-web` | ~0.21.0 | MIT | ✅ Low | Web compatibility layer |
| `expo` | ~54.0.33 | MIT | ✅ Low | Managed workflow |
| `tslib` | ^2.8.1 | 0BSD | ✅ Low | TS runtime helper |

### Navigation & Routing

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `expo-router` | ~6.0.23 | MIT | ✅ Low | File-based routing |
| `expo-linking` | ~8.0.11 | MIT | ✅ Low | Deep linking |
| `react-native-screens` | ~4.16.0 | MIT | 🟡 Moderate | Native module — screen management |
| `react-native-safe-area-context` | ~5.6.0 | MIT | 🟡 Moderate | Native module — safe area insets |

### UI & Styling

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `nativewind` | ^4.2.1 | MIT | ✅ Low | Tailwind for RN |
| `tailwindcss` | ^3.4.19 | MIT | ✅ Low | Build-time only |
| `react-native-css-interop` | ^0.2.1 | MIT | ✅ Low | NativeWind dependency |
| `clsx` | ^2.1.1 | MIT | ✅ Low | Class name utility |
| `tailwind-merge` | ^3.4.0 | MIT | ✅ Low | Class merging utility |
| `lucide-react-native` | ^0.562.0 | ISC | ✅ Low | SVG icons |
| `react-native-svg` | 15.12.1 | MIT | 🟡 Moderate | Native SVG renderer |
| `@expo/vector-icons` | ^15.0.3 | MIT | ✅ Low | Icon sets |

### Animation

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `react-native-reanimated` | ~4.1.1 | MIT | 🟡 Moderate | Native module — UI thread animations |
| `react-native-gesture-handler` | ~2.28.0 | MIT | 🟡 Moderate | Native module — gesture system |
| `moti` | ^0.30.0 | MIT | ✅ Low | Reanimated wrapper — consider removing (see TD-016) |

### State & Forms

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `zustand` | ^5.0.10 | MIT | ✅ Low | State management |
| `react-hook-form` | ^7.71.1 | MIT | ✅ Low | Form management |
| `@hookform/resolvers` | ^5.2.2 | MIT | ✅ Low | Zod integration |
| `zod` | ^4.3.5 | MIT | ✅ Low | Schema validation |

### Storage & Persistence

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `@react-native-async-storage/async-storage` | 2.2.0 | MIT | 🟡 Moderate | Native KV store — **not for PII** |
| `expo-sqlite` | ^16.0.10 | MIT | 🟡 Moderate | Native SQLite |
| `expo-secure-store` | ~15.0.8 | MIT | 🟡 Moderate | Keychain/Keystore — approved for tokens |
| `expo-file-system` | ~19.0.21 | MIT | 🟡 Moderate | Native file I/O |

### Crypto

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `crypto-js` | ^4.2.0 | MIT | 🔴 **High** | **Not FIPS 140-2 validated.** Replace with Web Crypto API |
| `@types/crypto-js` | ^4.2.2 | MIT | ✅ Low | Types only — remove with `crypto-js` |
| `react-native-get-random-values` | ~1.11.0 | MIT | 🟡 Moderate | Polyfill for `crypto.getRandomValues()` |

### Device & Media

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `expo-haptics` | ~15.0.8 | MIT | 🟡 Moderate | Haptic feedback |
| `expo-image` | ~3.0.11 | MIT | 🟡 Moderate | Optimized image loading |
| `expo-image-picker` | ~17.0.10 | MIT | 🟡 Moderate | Camera/gallery access |
| `expo-device` | ~8.0.10 | MIT | 🟡 Moderate | Device info |
| `expo-clipboard` | ~8.0.8 | MIT | 🟡 Moderate | Clipboard access |
| `expo-blur` | ~15.0.8 | MIT | 🟡 Moderate | BlurView component |
| `expo-linear-gradient` | ~15.0.8 | MIT | 🟡 Moderate | Gradient views |
| `expo-splash-screen` | ~31.0.13 | MIT | 🟡 Moderate | Splash control |
| `expo-status-bar` | ~3.0.9 | MIT | ✅ Low | Status bar styling |
| `expo-web-browser` | ~15.0.10 | MIT | ✅ Low | In-app browser |
| `expo-sharing` | ~14.0.8 | MIT | 🟡 Moderate | OS share sheet |
| `expo-notifications` | ~0.32.16 | MIT | 🟡 Moderate | Push/local notifications |
| `expo-constants` | ~18.0.13 | MIT | ✅ Low | Build-time constants |
| `expo-font` | ~14.0.11 | MIT | ✅ Low | Custom font loading |

### Camera & ML

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `react-native-vision-camera` | ^4.7.3 | MIT | 🟡 Moderate | Camera access — privacy scrutiny for ATO |
| `react-native-mlkit-ocr` | ^0.3.0 | MIT | 🟡 Moderate | On-device OCR — data stays local |
| `react-native-worklets` | 0.5.1 | MIT | 🟡 Moderate | Camera frame processing |
| `jsqr` | ^1.4.0 | Apache-2.0 | ✅ Low | QR code decoding (pure JS) |

### Document Handling

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `react-native-pdf` | ^7.0.3 | MIT | 🟡 Moderate | Native PDF viewer |
| `react-native-blob-util` | ^0.24.7 | MIT | 🟡 Moderate | File download/upload |

### Permissions

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `react-native-permissions` | ^5.4.4 | MIT | 🟡 Moderate | Unified permission API |

### Calendar

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `react-native-calendars` | ^1.1314.0 | MIT | ✅ Low | Calendar widget |
| `@react-native-community/datetimepicker` | 8.4.4 | MIT | 🟡 Moderate | Native date picker |

### Date Utilities

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `date-fns` | ^4.1.0 | MIT | ✅ Low | Date manipulation |

### Analytics

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| ~~`@vercel/analytics`~~ | ~~^1.6.1~~ | ~~MIT~~ | 🟢 **Resolved** | **Removed 2026-02-27.** Was transmitting telemetry to commercial servers. |

### FlashList

| Package | Version | License | Risk | Notes |
|---------|---------|---------|------|-------|
| `@shopify/flash-list` | ^2.0.2 | MIT | 🟡 Moderate | High-performance list (native module) |

---

## Action Items

### Must Remove Before ATO

| Package | Reason | Replacement |
|---------|--------|-------------|
| ~~`@vercel/analytics`~~ | ~~Commercial telemetry~~ | ~~Self-hosted analytics or remove entirely~~ |

### Must Replace Before ATO

| Package | Reason | Replacement |
|---------|--------|-------------|
| `crypto-js` | Not FIPS 140-2 validated | Web Crypto API (`SubtleCrypto`) or `react-native-quick-crypto` |
| `@types/crypto-js` | Remove with `crypto-js` | N/A |

### Review for ATO

| Package | Concern |
|---------|---------|
| `react-native-vision-camera` | Camera privacy — document that OCR data stays on-device |
| `react-native-mlkit-ocr` | ML model privacy — document that processing is local-only |
| `react-native-blob-util` | File system access — document scope of file operations |

---

## License Summary

| License | Count |
|---------|-------|
| MIT | 48 |
| ISC | 1 |
| Apache-2.0 | 1 |
| 0BSD | 1 |

All licenses are permissive and compatible with DoD use.
