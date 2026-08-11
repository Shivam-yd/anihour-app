---
name: Search request ordering
description: The search screen's request lifecycle and stale-result constraint.
---

Search results must be guarded by a request generation so a slower previous search cannot overwrite results after the user changes filters, switches anime/manga, or clears the input.

**Why:** AniList requests can complete out of order, especially near rate limits or on mobile connections, producing results that do not match the visible query/filter state.

**How to apply:** Invalidate the active generation whenever search context changes or the input is cleared, and only update loading/error/results state for the latest generation.