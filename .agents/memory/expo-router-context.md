---
name: Expo Router navigation context
description: Avoiding navigation-context startup crashes after upgrading Expo Router.
---

Use Expo Router's exported navigation hooks in the SDK 57 app instead of standalone React Navigation hooks. Preserve tab reselect-to-scroll behavior when migrating.

**Why:** Router owns a separate navigation context; standalone hooks can throw despite being rendered inside the app's tab navigator. Successful bundles and typechecks do not catch this runtime mismatch.

**How to apply:** Check context-based imports whenever changing SDK/Router versions, and verify startup past the splash plus tab navigation against real API responses.
