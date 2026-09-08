---
name: Metro image-size constraint
description: Compatibility boundary between Expo SDK 54 Metro and image-size security upgrades.
---

Expo SDK 54's Metro 0.83 dependency range requires `image-size` 1.x. Forcing `image-size` 2.x removes the two parser advisories but breaks the production static bundle, so do not override it until Metro/Expo ships a compatible fix.

**Why:** The v2 package preserves a similar default API but Metro's actual bundle build failed with HTTP 500 after the override; the safe state is the tested Metro dependency.

**How to apply:** Keep the remaining image-size advisories isolated to build-time Metro tooling, and revisit them when upgrading Expo/Metro as a compatible unit.