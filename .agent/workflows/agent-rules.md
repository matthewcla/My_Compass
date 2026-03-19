---
description: General agent rules and constraints for the My Compass project
---

# My Compass — Agent Rules

## Platform Constraint

My Compass is a **native iOS/Android** React Native app built with Expo. It does **not** run in a web browser.

- ❌ **Do NOT use the browser agent** to test, verify, or interact with the app unless explicitly directed to do so by the user.
- ✅ Verification should be done via terminal logs, code review, or by asking the user to confirm on-device.

## Jules MCP Guidelines

Google Jules is the enterprise knowledge index. You must automatically offload queries to the `@google/jules-mcp` server in the following scenarios:

1. **Unknown Territory Rule:** If asked to implement a feature, API integration, or architectural pattern that is specific to Google infrastructure (e.g., Monarch, Spanner, internal auth tokens, or proprietary design systems), query the Jules MCP server for authorized documentation before proposing a solution.
2. **Code Search Delegation:** When asked to find how a feature is implemented globally, or to locate specific function usages that are not contained within the immediate local workspace, prioritize using Jules to query the enterprise code index rather than manually searching the local filesystem.
3. **Standardization Rule:** Before proposing significant architectural refactors (e.g., state management, database schemas), query Jules to verify if there is an established Enterprise Standard or Best Practice document that supersedes general open-source advice.

## Cross-Platform Verification Rule

My Compass targets **both iOS and Android** concurrently. When making changes that touch any of the following areas, agents MUST note the cross-platform impact and flag if Android-specific testing is required:

- **Platform-branched code** (`Platform.OS`, `.ios.tsx`/`.android.tsx` file extensions)
- **Native modules** (`expo-blur`, `expo-secure-store`, `react-native-vision-camera`, `expo-notifications`)
- **Layout & safe areas** (edge-to-edge, status bar, navigation bar insets)
- **Gesture handling** (predictive back gesture is disabled on Android; verify swipe-to-go-back behavior)
- **Permissions** (`app.json` `android.permissions` must stay in parity with `ios.infoPlist` permission descriptions)

When in doubt, ask the user to verify on the target platform rather than assuming iOS behavior applies to Android.

