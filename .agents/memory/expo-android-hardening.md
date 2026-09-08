---
name: Expo Android hardening
description: The supported Expo SDK 54 configuration path for Android release security settings.
---

Expo SDK 54 rejects `android.targetSdkVersion` and `android.usesCleartextTraffic` as direct app-config fields. Configure Android API level, R8/minification, resource shrinking, and cleartext policy through `expo-build-properties` instead.

**Why:** Expo Doctor marks direct native fields as invalid, while the build-properties plugin exposes the same controls to native prebuilds without breaking the managed config.

**How to apply:** Keep the app config static and use the Expo build-properties plugin for Android-only release settings.