# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   └── api-server/         # Express API server
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
├── scripts/                # Utility scripts (single workspace package)
│   └── src/                # Individual .ts scripts, run via `pnpm --filter @workspace/scripts run <script>`
├── pnpm-workspace.yaml     # pnpm workspace (artifacts/*, lib/*, lib/integrations/*, scripts)
├── tsconfig.base.json      # Shared TS options (composite, bundler resolution, es2022)
├── tsconfig.json           # Root TS project references
└── package.json            # Root package with hoisted devDeps
```

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references. This means:

- **Always typecheck from the root** — run `pnpm run typecheck` (which runs `tsc --build --emitDeclarationOnly`). This builds the full dependency graph so that cross-package imports resolve correctly. Running `tsc` inside a single package will fail if its dependencies haven't been built yet.
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck; actual JS bundling is handled by esbuild/tsx/vite...etc, not `tsc`.
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array. `tsc --build` uses this to determine build order and skip up-to-date packages.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages that define it
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server. Routes live in `src/routes/` and use `@workspace/api-zod` for request and response validation and `@workspace/db` for persistence.

- Entry: `src/index.ts` — reads `PORT`, starts Express
- App setup: `src/app.ts` — mounts CORS, JSON/urlencoded parsing, routes at `/api`
- Routes: `src/routes/index.ts` mounts sub-routers; `src/routes/health.ts` exposes `GET /health` (full path: `/api/health`)
- Depends on: `@workspace/db`, `@workspace/api-zod`
- `pnpm --filter @workspace/api-server run dev` — run the dev server
- `pnpm --filter @workspace/api-server run build` — production esbuild bundle (`dist/index.cjs`)
- Build bundles an allowlist of deps (express, cors, pg, drizzle-orm, zod, etc.) and externalizes the rest

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL. Exports a Drizzle client instance and schema models.

- `src/index.ts` — creates a `Pool` + Drizzle instance, exports schema
- `src/schema/index.ts` — barrel re-export of all models
- `src/schema/<modelname>.ts` — table definitions with `drizzle-zod` insert schemas (no models definitions exist right now)
- `drizzle.config.ts` — Drizzle Kit config (requires `DATABASE_URL`, automatically provided by Replit)
- Exports: `.` (pool, db, schema), `./schema` (schema only)

Production migrations are handled by Replit when publishing. In development, we just use `pnpm --filter @workspace/db run push`, and we fallback to `pnpm --filter @workspace/db run push-force`.

### `lib/api-spec` (`@workspace/api-spec`)

Owns the OpenAPI 3.1 spec (`openapi.yaml`) and the Orval config (`orval.config.ts`). Running codegen produces output into two sibling packages:

1. `lib/api-client-react/src/generated/` — React Query hooks + fetch client
2. `lib/api-zod/src/generated/` — Zod schemas

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec (e.g. `HealthCheckResponse`). Used by `api-server` for response validation.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec (e.g. `useHealthCheck`, `healthCheck`).

### `scripts` (`@workspace/scripts`)

Utility scripts package. Each script is a `.ts` file in `src/` with a corresponding npm script in `package.json`. Run scripts via `pnpm --filter @workspace/scripts run <script>`. Scripts can import any workspace package (e.g., `@workspace/db`) by adding it as a dependency in `scripts/package.json`.

### `artifacts/mobile` (`@workspace/mobile`)

Expo React Native app — AniHour anime/manga discovery app.

- **Colors**: `#1a1a2e` bg, `#ff6b9d` primary, `#4ecdc4` secondary, `#45b7d1` accent
- **Data**: Jikan API v4 (`https://api.jikan.moe/v4`), no API key required
- **Key files**:
  - `lib/jikan.ts` — all API calls; `filterSFW()` strips Rx/Hentai content client-side; `fetchStudioAnimeHasNext()`, `fetchSeasonArchiveHasNext()` added
  - `lib/content-settings.tsx` — global Anime/Manga + adult mode state
  - `components/ContentToggleBar.tsx` — segmented pill + 18+ toggle shown in every screen header
  - `app/(tabs)/index.tsx` — Home: hero slider (items 0–4) + grid (items 5+, no duplication)
  - `app/(tabs)/top.tsx` — Top anime/manga with sort + type filters (TV/Movie/OVA/ONA/Special for anime; Manga/Manhwa/Manhua/Novel/One-Shot for manga)
  - `app/(tabs)/upcoming.tsx`, `news.tsx`, `search.tsx` — other tabs
  - `app/anime/[id].tsx` — Detail: streaming color-coded badges, broadcast, Characters, Recommendations, tappable genres → genre screen, tappable studios → studio screen
  - `app/genre/[id].tsx` — Genre browse screen (grid/list)
  - `app/studio/[id].tsx` — Studio page: shows studio icon, title count, avg score + paginated 3-col anime grid
  - `app/seasons/index.tsx` — Season Archive: year grid (2000–now) with Winter/Spring/Summer/Fall cards
  - `app/seasons/[year]/[season].tsx` — Season detail: paginated grid of anime for that specific season
- **Dev**: `pnpm --filter @workspace/mobile run dev` (port from `$PORT`)
- **Tab icons**: Uses cross-platform `@expo/vector-icons` (Ionicons + Feather); no iOS-specific SF Symbols or expo-glass-effect
- **Adult mode**: `genres=12&sfw=false` in all API calls; `filterSFW()` + `deduplicateById()` as client-side safety nets
- **Genre map**: `GENRE_MAP` exported from `lib/jikan.ts` (24 genres with IDs); used in genre browser and search screen
- **Search screen**: Popular searches + Season Archive card + Browse by Genre (24 color-coded chips)
