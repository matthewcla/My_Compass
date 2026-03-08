# Lock Screen Widget Architecture and Planning

## Overview
This document outlines the architecture and development approach for implementing Lock Screen (and Home Screen) Action Widgets within the My Compass application. It specifically addresses the compliance and security requirements for handling DoD Impact Level 4 (IL4) data and overcoming the limitations of offline application capabilities gated by Okta 2FA.

## The Problem: IL4 Compliance & Okta 2FA Offline Bottleneck
When building standard widgets that display data or require authenticated network requests, several critical roadblocks emerge:
1. **Data at Rest Risk:** Standard App Groups used to share data between React Native and native widgets are unencrypted, violating IL4 data-at-rest encryption policies for PII and CUI.
2. **Lock Screen Visibility:** Displaying CUI/PII on a locked device is a security violation, requiring OS-level `.privacySensitive()` masking.
3. **Session Timeout Sync:** Widgets update independently of the active app lifecycle. If the app session times out, the widget may still persist and display cached IL4 data.
4. **Offline Auth Blockade:** If a widget acts as a deep link into a secure app area, and the app strictly requires an active Okta 2FA session on launch, the widget becomes useless in offline or low-cell environments (e.g., inside a ship or secure concrete building) because the Okta token negotiation sequence cannot complete.

## The Solution: "Secure Dropbox" (Write-Only Offline State)
To make "Action Widgets" (like a **PCS Receipt Scanner** or **Logger**) instantaneous and functional without an active network connection, the application must separate **Data Entry (Writing)** from **Data Access (Reading)**.

### Architecture Flow
1. **The Widget Deep-Link:** The Lock Screen Action Widget triggers a specific custom URL scheme (e.g., `mycompass://offline-scan`). It contains no sensitive data itself, acting purely as a shortcut.
2. **Local Biometric Bypass:** The app intercepts this deep-link on launch. Instead of forcing a full Okta network authentication, it requests **FaceID / TouchID / Local Biometrics** to authorize immediate entry.
3. **Pre-Auth Action UI:** Once local biometrics pass, the app opens **only** the target action view (e.g., the Camera/Scanner UI). It *does not* load the user dashboard, past history, or any existing CUI.
4. **Encrypted Local Outbox:** After the user completes the action (e.g., takes a photo of an order or receipt), the app encrypts the payload using a locally stored key (secured in the Secure Enclave/Keystore during their last successful online Okta login). The encrypted payload is dropped into a local "Outbox" or "Drafts" queue.
5. **Lock-Out:** The user is returned to the lock screen or cleanly exited from the app's secure dropbox layer. Crucially, they cannot view previously scanned receipts or see history without completing a full Okta 2FA login.
6. **Background Sync:** Once the device regains connectivity and the user performs a full Okta 2FA login, the Outbox contents are securely synced to the server environments.

---

## Native Development Steps

Building native widgets within an Expo application requires writing native code for both platforms and utilizing **Expo Config Plugins** to inject those native targets into the iOS and Android projects during the `npx expo prebuild` phase.

### iOS Development (Xcode, Swift, WidgetKit)
Apple strictly requires widgets to be written natively using **SwiftUI** and managed by **WidgetKit**.

1. **Create the App Target:** An iOS App Extension target (Widget Extension) must be added. For Expo, this is handled via an Expo Config Plugin that modifies the `.pbxproj` file to add the secondary target.
2. **Develop the UI in SwiftUI:** The widget view must be built using SwiftUI syntax. For Action Widgets, this is primarily simple, high-visibility UI with embedded `Link` components (`Link(destination: URL(string: "mycompass://offline-scan")!)`) that fire the deep-link intents.
3. **Configure App Groups (If Applicable):** If any non-PII state data represents the widget configuration, an App Group must be defined in the Apple Developer Portal and added to the `app.json` (`ios.entitlements`) so React Native and the WidgetKit extension can share `UserDefaults`.
4. **Provisioning Profiles:** The Widget Extension target requires its own distinctive Bundle Identifier and Provisioning Profile. EAS Build configuration must be updated to build and map both targets simultaneously.
5. **Handle Deep Links in React Native:** The Expo router must catch the incoming deep-link URL triggered by the widget, circumvent the standard auth wall, and route the user to the Biometric-gated Action UI.

### Android Development (Android Studio, Kotlin, AppWidgets)
Android widgets are managed via **AppWidgets**. While Lock Screen widgets are not natively supported in modern Android versions (Android 5.0+ moved away from lock screen widgets outside of notifications and modern Quick Settings, though they function excellently as Home Screen Action Widgets).

1. **Create the AppWidgetProvider:** A native Kotlin class must be created extending `AppWidgetProvider` to dictate the widget's lifecycle (`onUpdate`, `onAppWidgetOptionsChanged`, etc.).
2. **Develop the UI Layout:** Android widgets can be constructed using traditional XML layout files (`RemoteViews`) or utilizing **Jetpack Glance** (the modern Compose-style architecture for building AppWidgets).
3. **PendingIntents for Deep Linking:** The widget layout logic needs to define a `PendingIntent` that launches the React Native `MainActivity` and passes an Intent string or URI data (e.g., `mycompass://offline-scan`) to the app.
4. **Manifest and Resource Configuration:** The Android `AndroidManifest.xml` must register the `AppWidgetProvider` inside a `<receiver>` tag and point to the appropriate configuration XML resources detailing the widget sizes and update intervals.
5. **Automate via Expo Plugin:** These Kotlin and XML files are bundled into an Expo Config Plugin. During `prebuild`, the plugin copies the files directly into the Android source structure (`android/app/src/main/...`) and merges the required manifest changes.
6. **Handle Deep Links in React Native:** Similar to the iOS implementation, the React Native application intercepts the `Linking` event from the Android Intent and displays the "Secure Dropbox" UI.

---

## AI-Assisted Implementation Capabilities (Antigravity)
All native iOS (Swift, WidgetKit) and Android (Kotlin, XML, AppWidgets) coding required for Lock Screen and Home Screen Action Widgets can be fully authored by the AI assistant (Antigravity).

### Generation Workflow:
1. **Native Source Code:** Antigravity generates the `.swift`, `.kt`, and `.xml` layout files necessary to construct the widget interfaces.
2. **Expo Config Plugin:** Antigravity writes a custom Expo Config Plugin (in TypeScript/JavaScript). Since Expo actively regenerates the `ios/` and `android/` folders, this plugin automatically injects the native source files and modifies project configuration files (`AndroidManifest.xml`, `.pbxproj`) during the `npx expo prebuild` lifecycle.
3. **React Native Deep Linking:** Antigravity authors the React Router (or React Navigation) logic required to parse the widget's custom URL scheme, bypass the standard Auth Wall, and execute the Biometric "Secure Dropbox" flow.

### Development & Compilation Constraints
*   **No "Expo Go":** Because adding widget targets requires modifying native iOS and Android modules, the resulting application **will not run** in the standard "Expo Go" client.
*   **Development Builds Required:** The application must be compiled as a Custom Development Build. This requires either compiling locally (`npx expo run:ios` / `npx expo run:android`) with Xcode/Android Studio installed, or compiling in the cloud using EAS (`eas build --profile development`).

---

## Authority to Operate (ATO) Path Impact
Implementing the "Secure Dropbox" (Write-Only Offline State) Action Widget explicitly preserves the system's ATO trajectory and actively mitigates risks that standard widgets introduce. Based on the My Compass ATO Readiness Assessment, the impact is as follows:

### 1. Data at Rest Encryption (SC-28, SRG-APP-000175)
*   **Standard Widget Impact:** Fails compliance. Writing to standard App Groups places unencrypted CUI/PII into the iOS sandbox, violating SC-28.
*   **Secure Dropbox Impact:** **Supports Compliance.** The Action Widget completely circumvents the App Group. Data is only generated *after* FaceID unlock and is immediately encrypted via the local FIPS-validated key management workflow (remediating SC-13/SC-28) before being placed in the Outbox.

### 2. Session Authenticity & Timeout (IA-11, SRG-APP-000190)
*   **Standard Widget Impact:** Fails compliance. Widgets do not respect the mandatory 15-minute idle timeout. Cached data on the lock screen persists indefinitely.
*   **Secure Dropbox Impact:** **Neutral/Supports Compliance.** Because the Action Widget acts purely as a stateless deep-link shortcut, it contains no session data and bypasses the timeout issue entirely. It requires biometric re-authentication upon every tap.

### 3. Access Enforcement (AC-3, AC-11)
*   **Standard Widget Impact:** Fails compliance. CUI/PII displayed on the lock screen violates AC-11 (Session Lock) if the device is locked but the widget is visible.
*   **Secure Dropbox Impact:** **Neutral.** The widget renders visually as a static "Scan" or "Add" button, exposing no data.

### 4. Identification and Authentication (IA-2, SRG-APP-000153)
*   **Standard Widget Impact:** Fails practical implementation. Background widgets cannot reliably negotiate PKI/CAC or Okta 2FA flows without user interaction.
*   **Secure Dropbox Impact:** **Neutral.** It delegates all Okta/Network auth to the background sync process when the user returns online. The local Biometric UI explicitly does not grant access to previously authenticated data, adhering to strict Identification boundaries.

**Conclusion:** The offline "Secure Dropbox" architecture is the *only* ATO-viable path for adding widget functionality to My Compass, as it introduces zero new data-exposure attack vectors.
