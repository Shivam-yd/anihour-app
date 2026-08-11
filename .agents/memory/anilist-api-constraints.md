---
name: AniList API constraints
description: Non-obvious AniList GraphQL and adapter constraints for AniHour.
---

AniList's `rankings` field does not accept an `allTime` argument; request `rankings { rank type allTime }` and filter the returned values in code. AniList `MediaSort` is a single enum variable in the Top query, not a list.

**Why:** Both invalid GraphQL shapes return HTTP 400 and make an entire screen appear as “Failed to load” even though the endpoint itself is reachable.

**How to apply:** When changing the adapter queries, validate the exact GraphQL query against `https://graphql.anilist.co` and preserve the numeric genre mapping used by detail-screen genre navigation. AniList can also rate-limit broad sequential sweeps, so avoid interpreting temporary 429s as per-screen failures.