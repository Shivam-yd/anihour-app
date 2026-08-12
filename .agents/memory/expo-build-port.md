---
name: Expo build port
description: Port separation required when building the mobile artifact in this workspace.
---

The static Expo build must run Metro on a configurable port separate from the mockup server; use `METRO_PORT` or the build default rather than assuming port 8081.

**Why:** The mockup-sandbox workflow uses port 8081, and Expo's interactive port fallback causes the non-interactive production build to time out.

**How to apply:** Keep the build script's health checks, bundle downloads, manifest requests, and asset URL parsing on the same dedicated Metro port.