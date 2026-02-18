---
description: General agent rules and constraints for the My Compass project
---

# My Compass — Agent Rules

## Platform Constraint

My Compass is a **native iOS/Android** React Native app built with Expo. It does **not** run in a web browser.

- ❌ **Do NOT use the browser agent** to test, verify, or interact with the app unless explicitly directed to do so by the user.
- ✅ Verification should be done via terminal logs, code review, or by asking the user to confirm on-device.
