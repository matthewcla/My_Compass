# Travel Receipt Logger Widget Architecture

## Overview
This document outlines the architecture and approach for the **Travel Receipt Logger Widget**. This widget provides users with a rapid, offline-capable Action Widget on their device Lock Screen or Home Screen to scan and log PCS/Travel receipts directly into the My Compass "Secure Dropbox" without requiring an active network connection or full Okta 2FA session negotiation.

## Functional Flow
1. **Widget Activation:** User taps the "Log Receipt" widget on their Lock or Home screen.
2. **Biometric Bypass:** The device prompts for FaceID/TouchID. The app intercepts the widget deep-link and opens *only* the camera UI, bypassing the standard Okta authentication wall (the Secure Dropbox pattern).
3. **Image Capture & OCR:** The user captures a photo of the receipt. The application utilizes on-device OCR to instantly parse the image for key data points (Vendor, Date, Amount).
4. **Verification Modal:** The app presents a "Glass Cockpit" designed modal with the extracted data pre-filled. The user verifies and corrects the information, categorizing the expense (e.g., Lodging, Per Diem, Tolls).
5. **Encrypted Storage:** Upon confirmation, the app encrypts the JSON payload and the image using a locally stored, FIPS-validated device key and saves it to a local Outbox.
6. **Session Termination:** The UI closes, returning the user to their device. The data cannot be accessed again without a full online Okta 2FA authentication.
7. **Background Sync:** Upon the next full authenticated session, the app syncs the Outbox contents to the server-side travel claim system.

## OCR Technical Approach
Given the strict IL4 compliance requirements and the mandate that this widget functions offline (e.g., in transit, on ships, or secure facilities), **Cloud-Based OCR APIs (AWS Textract, Azure Document Intelligence) are prohibited.** Transmitting CUI/financial imagery over unauthenticated networks violates the ATO path.

### On-Device OCR Strategy
The solution relies exclusively on native on-device machine learning frameworks:
*   **iOS:** Apple Vision Framework (`VNRecognizeTextRequest`)
*   **Android:** Google ML Kit (configured strictly for on-device processing)

### Data Extraction Heuristics (Parsing)
On-device OCR returns a raw array of detected text strings and bounding boxes. The application will utilize a custom JavaScript regular expression parser (`ReceiptParser.ts`) to identify the required fields:
*   **Amount:** Scan for `$` prefixes, or keywords like `Total`, `Balance Due`, `Amount` followed by decimal formats (`\d+\.\d{2}`).
*   **Date:** Scan for standard datetime formats (`MM/DD/YYYY`, `DD-MMM-YYYY`).
*   **Vendor:** Determine the vendor utilizing spatial heuristics (typically the largest text block located at the uppermost coordinates of the receipt).

---

## Current Capability & Development Gaps
Implementing the Travel Receipt Logger Widget fully requires bridging several existing capability gaps in the current My Compass codebase.

### 1. Native OCR Module Integration
*   **Gap:** The current Expo environment does not have native modules capable of capturing images and passing them directly to Apple Vision / ML Kit without ejecting or writing complex bridging code.
*   **Requirement:** A custom Expo Native Module (C++ / Swift / Kotlin) must be authored to handle the high-performance camera capture and execute the native NLP text recognition workflows on the hardware Neural Engine, returning the string array to the React Native layer.

### 2. Heuristics Parsing Engine
*   **Gap:** Identifying standard text is reliable; extracting structured expense data from a chaotic text array is difficult. Receipts vary wildly in format.
*   **Requirement:** Development of `ReceiptParser.ts`, requiring extensive test-driven development (TDD) against a large corpus of sample DoD lodging, flight, and toll receipts to refine the Regex extraction logic and reduce manual user correction in the validation modal.

### 3. FIPS-Validated Cryptography (Data-at-Rest)
*   **Gap:** As identified in the [ATO Readiness Assessment](../ATO_READINESS.md) (SC-13, SC-28), the application's current data-at-rest encryption relies on `crypto-js`, which is not FIPS 140-2 validated, and the encryption logic is currently stubbed/disabled.
*   **Requirement:** To store the extracted receipt JSON and high-resolution images in the offline "Secure Dropbox" legally, the app must implement a FIPS-validated cryptographic module (e.g., integrating `react-native-aes-gcm-crypto` bounded to Keychain/Keystore hardware backing).

### 4. Background Sync / Dead-Letter Queue Management
*   **Gap:** The app currently lacks a robust, transactional queue for handling offline payloads that must be synced to the Navy servers upon connection restoration.
*   **Requirement:** Implementation of an `OfflineSyncManager` (likely backed by local SQLite/WatermelonDB) that can securely store the encrypted payloads, attempt transmission when Okta 2FA is negotiated, and handle conflict resolution or transmission failures (dead-letter queue) without data loss.

### 5. Config Plugin for Action Widget Deployment
*   **Gap:** The iOS App Extension and Android AppWidget natively require `.pbxproj` and `AndroidManifest.xml` modifications.
*   **Requirement:** An Expo Config Plugin must be written to inject the native Swift and Kotlin widget logic into the build lifecycle (`npx expo prebuild`), as standard custom React Native code cannot render widgets. Additionally, Deep Linking URL schemas must be configured to bypass the standard authentication guards.
