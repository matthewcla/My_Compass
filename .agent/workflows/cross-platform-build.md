---
description: Cross-platform build verification checklist for iOS and Android
---

# Cross-Platform Build Verification

Run this checklist when making changes that affect native configuration, permissions, or platform-specific rendering.

## Step 1: Native Project Sync
- Run `npx expo prebuild --clean` to regenerate both `ios/` and `android/` from `app.json`
- Verify `app.json` version matches both `ios.buildNumber` and `android/app/build.gradle` `versionCode`/`versionName`

## Step 2: Android Build Verification
// turbo
- Run `npx expo run:android` and confirm the app launches on emulator or device
- Check Metro bundler logs for Android-specific warnings

## Step 3: iOS Build Verification
// turbo
- Run `npx expo run:ios` and confirm the app launches on simulator or device

## Step 4: Platform-Specific Rendering Audit
- Verify `BlurView` / `GlassView` renders acceptably on Android (lower blur intensity may be needed)
- Verify safe area insets are correct on both platforms (edge-to-edge is enabled on Android)
- Verify custom shadows render on Android (may need `elevation` property)

## Step 5: Permissions Parity Check
- Compare `app.json` → `ios.infoPlist` permissions with `android.permissions`
- Ensure every iOS permission has an Android equivalent declared
