import { ContentType } from "./content-settings";
export type { ContentType };

// ─── AniList GraphQL API ─────────────────────────────────────────────────────
// Drop-in replacement for the previous Jikan REST API.
// All exported types and function signatures are identical so no screen
// code needs to change.
// ─────────────────────────────────────────────────────────────────────────────

const ANILIST_API = "https://graphql.anilist.co";

function getApiBaseUrl(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `https://${domain}/api`;
  return "/api";
}

// ── Shared types (unchanged) ─────────────────────────────────────────────────

export interface AnimeImage {
  jpg: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
  webp?: {
    image_url: string;
    small_image_url: string;
    large_image_url: string;
  };
}

export interface AnimeGenre {
  mal_id: number;
  name: string;
}

export interface AnimeStudio {
  mal_id: number;
  name: string;
}

export interface StreamingService {
  name: string;
  url: string;
}

export interface Anime {
  mal_id: number; // AniList id mapped here
  title: string;
  title_english?: string;
  images: AnimeImage;
  score?: number;
  scored_by?: number;
  rank?: number;
  popularity?: number;
  episodes?: number;
  chapters?: number;
  volumes?: number;
  status?: string;
  synopsis?: string;
  genres?: AnimeGenre[];
  themes?: AnimeGenre[];
  demographics?: AnimeGenre[];
  studios?: AnimeStudio[];
  producers?: AnimeStudio[];
  licensors?: AnimeStudio[];
  authors?: { mal_id: number; name: string }[];
  year?: number;
  season?: string;
  type?: string;
  rating?: string;
  duration?: string;
  source?: string;
  aired?: { from?: string; to?: string };
  published?: { from?: string; to?: string };
  broadcast?: { day?: string; time?: string; timezone?: string; string?: string };
  streaming?: StreamingService[];
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
    images?: { maximum_image_url?: string; large_image_url?: string };
  };
  members?: number;
  favorites?: number;
  url?: string;
}

export interface NewsItem {
  mal_id: number;
  title: string;
  excerpt: string;
  url: string;
  date: string;
  author_username: string;
  images: { jpg: { image_url: string } };
  comments: number;
  tags?: string[];
  badge?: string;
}

export interface Character {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
}

export interface Recommendation {
  entry: Anime;
  votes: number;
}

export interface StudioInfo {
  name: string;
  imageUrl: string | null;
  about: string | null;
}

// ── Internal AniList types ───────────────────────────────────────────────────

interface AniListDate { year?: number; month?: number; day?: number }

interface AniListMedia {
  id: number;
  title: { romaji: string; english?: string | null };
  coverImage: { large?: string | null; medium?: string | null; extraLarge?: string | null };
  bannerImage?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  meanScore?: number | null;
  rankings?: Array<{ rank: number; type: string; allTime: boolean }>;
  episodes?: number | null;
  chapters?: number | null;
  volumes?: number | null;
  status?: string | null;
  description?: string | null;
  genres?: string[];
  tags?: Array<{ name: string; rank: number }>;
  studios?: { nodes: Array<{ id: number; name: string }> };
  staff?: { edges: Array<{ role: string; node: { id: number; name: { full: string } } }> };
  seasonYear?: number | null;
  season?: string | null;
  format?: string | null;
  isAdult?: boolean;
  duration?: number | null;
  source?: string | null;
  startDate?: AniListDate;
  endDate?: AniListDate;
  trailer?: { id?: string; site?: string } | null;
  externalLinks?: Array<{ site: string; url: string; type: string }>;
  favourites?: number | null;
  siteUrl?: string | null;
}

// ── Genre mapping ────────────────────────────────────────────────────────────

export const GENRE_MAP: Record<string, { id: number; label: string }> = {
  action:        { id: 1,  label: "Action" },
  adventure:     { id: 2,  label: "Adventure" },
  comedy:        { id: 4,  label: "Comedy" },
  drama:         { id: 8,  label: "Drama" },
  fantasy:       { id: 10, label: "Fantasy" },
  horror:        { id: 14, label: "Horror" },
  mystery:       { id: 7,  label: "Mystery" },
  psychological: { id: 40, label: "Psychological" },
  romance:       { id: 22, label: "Romance" },
  "sci-fi":      { id: 24, label: "Sci-Fi" },
  school:        { id: 26, label: "School" },
  seinen:        { id: 42, label: "Seinen" },
  shoujo:        { id: 25, label: "Shoujo" },
  shounen:       { id: 27, label: "Shounen" },
  "slice-of-life": { id: 36, label: "Slice of Life" },
  sports:        { id: 30, label: "Sports" },
  supernatural:  { id: 37, label: "Supernatural" },
  thriller:      { id: 41, label: "Thriller" },
  historical:    { id: 13, label: "Historical" },
  isekai:        { id: 62, label: "Isekai" },
  military:      { id: 38, label: "Military" },
  mecha:         { id: 18, label: "Mecha" },
  music:         { id: 19, label: "Music" },
  magic:         { id: 16, label: "Magic" },
  "super-power": { id: 31, label: "Super Power" },
};

// Maps numeric genre IDs → AniList query param
const GENRE_ID_TO_ANILIST: Record<number, { param: "genre" | "tag"; name: string }> = {
  1:  { param: "genre", name: "Action" },
  2:  { param: "genre", name: "Adventure" },
  4:  { param: "genre", name: "Comedy" },
  7:  { param: "genre", name: "Mystery" },
  8:  { param: "genre", name: "Drama" },
  10: { param: "genre", name: "Fantasy" },
  13: { param: "tag",   name: "Historical" },
  14: { param: "genre", name: "Horror" },
  16: { param: "tag",   name: "Magic" },
  18: { param: "genre", name: "Mecha" },
  19: { param: "genre", name: "Music" },
  22: { param: "genre", name: "Romance" },
  24: { param: "genre", name: "Sci-Fi" },
  25: { param: "tag",   name: "Shoujo" },
  26: { param: "tag",   name: "School" },
  27: { param: "tag",   name: "Shounen" },
  30: { param: "genre", name: "Sports" },
  31: { param: "tag",   name: "Super Power" },
  36: { param: "genre", name: "Slice of Life" },
  37: { param: "genre", name: "Supernatural" },
  38: { param: "tag",   name: "Military" },
  40: { param: "genre", name: "Psychological" },
  41: { param: "genre", name: "Thriller" },
  42: { param: "tag",   name: "Seinen" },
  62: { param: "tag",   name: "Isekai" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function anilistDateToISO(d?: AniListDate | null): string | undefined {
  if (!d || !d.year) return undefined;
  const m = String(d.month ?? 1).padStart(2, "0");
  const day = String(d.day ?? 1).padStart(2, "0");
  return `${d.year}-${m}-${day}T00:00:00+00:00`;
}

function mapStatus(s?: string | null, isManga = false): string | undefined {
  if (!s) return undefined;
  const map: Record<string, string> = {
    RELEASING:        isManga ? "Publishing" : "Currently Airing",
    FINISHED:         isManga ? "Finished"   : "Finished Airing",
    NOT_YET_RELEASED: "Not Yet Aired",
    CANCELLED:        "Cancelled",
    HIATUS:           "On Hiatus",
  };
  return map[s] ?? s;
}

function mapFormat(f?: string | null): string | undefined {
  if (!f) return undefined;
  const map: Record<string, string> = {
    TV:         "TV",
    TV_SHORT:   "TV",
    MOVIE:      "Movie",
    OVA:        "OVA",
    ONA:        "ONA",
    SPECIAL:    "Special",
    MUSIC:      "Music",
    MANGA:      "Manga",
    ONE_SHOT:   "One-Shot",
    NOVEL:      "Novel",
  };
  return map[f] ?? f;
}

function mapSource(s?: string | null): string | undefined {
  if (!s) return undefined;
  const map: Record<string, string> = {
    ORIGINAL:    "Original",
    MANGA:       "Manga",
    LIGHT_NOVEL: "Light novel",
    VISUAL_NOVEL: "Visual novel",
    VIDEO_GAME:  "Video game",
    OTHER:       "Other",
    NOVEL:       "Novel",
    DOUJINSHI:   "Doujinshi",
    ANIME:       "Anime",
    WEB_MANGA:   "Web manga",
    BOOK:        "Book",
    CARD_GAME:   "Card game",
    COMIC:       "Comic",
    GAME:        "Game",
    MUSIC:       "Music",
    PICTURE_BOOK: "Picture book",
  };
  return map[s] ?? s;
}

let _genreIdCounter = 1000;
const _genreNameToId = new Map<string, number>();

// Reverse-lookup: AniList genre/tag name (lowercase) → the numeric ID used in GENRE_ID_TO_ANILIST
// so that tapping a genre chip on a detail screen navigates to the correct genre list.
const ANILIST_NAME_TO_GENRE_ID: Record<string, number> = {};
for (const [idStr, { name }] of Object.entries(GENRE_ID_TO_ANILIST)) {
  ANILIST_NAME_TO_GENRE_ID[name.toLowerCase()] = Number(idStr);
}

function genreNameToId(name: string): number {
  const knownId = ANILIST_NAME_TO_GENRE_ID[name.toLowerCase()];
  if (knownId !== undefined) return knownId;
  if (!_genreNameToId.has(name)) {
    _genreNameToId.set(name, _genreIdCounter++);
  }
  return _genreNameToId.get(name)!;
}

function mapMedia(m: AniListMedia, isManga = false): Anime {
  const large  = m.coverImage?.extraLarge ?? m.coverImage?.large ?? "";
  const medium = m.coverImage?.medium ?? large;

  const images: AnimeImage = {
    jpg: {
      image_url:       medium,
      small_image_url: medium,
      large_image_url: large,
    },
  };

  // Score: AniList 0-100 → 0-10
  const rawScore = m.averageScore ?? m.meanScore;
  const score = rawScore != null && rawScore > 0 ? rawScore / 10 : undefined;

  // Rank: prefer allTime popularity rank
  const popRank = m.rankings?.find((r) => r.type === "POPULAR" && r.allTime);
  const ratedRank = m.rankings?.find((r) => r.type === "RATED" && r.allTime);
  const rank = (popRank ?? ratedRank)?.rank;

  const genres: AnimeGenre[] = (m.genres ?? []).map((name) => ({
    mal_id: genreNameToId(name),
    name,
  }));

  const studios: AnimeStudio[] = (m.studios?.nodes ?? []).map((s) => ({
    mal_id: s.id,
    name: s.name,
  }));

  const authors = isManga
    ? (m.staff?.edges ?? [])
        .filter((e) => e.role === "Story" || e.role === "Art" || e.role === "Story & Art")
        .slice(0, 4)
        .map((e) => ({ mal_id: e.node.id, name: e.node.name.full }))
    : undefined;

  const startIso = anilistDateToISO(m.startDate);
  const endIso   = anilistDateToISO(m.endDate);

  // Trailer
  let trailer: Anime["trailer"] | undefined;
  if (m.trailer?.site === "youtube" && m.trailer.id) {
    const ytId = m.trailer.id;
    trailer = {
      youtube_id: ytId,
      url: `https://www.youtube.com/watch?v=${ytId}`,
      embed_url: `https://www.youtube.com/embed/${ytId}`,
      images: {
        maximum_image_url: `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`,
        large_image_url:   `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
      },
    };
  }

  // Streaming services
  const STREAMING_SITES = new Set([
    "crunchyroll", "funimation", "netflix", "hulu", "hidive",
    "amazon prime video", "disney+", "anime digital network",
    "vrv", "wakanim", "bilibili",
  ]);
  const streaming: StreamingService[] = (m.externalLinks ?? [])
    .filter((l) => l.type === "STREAMING" || STREAMING_SITES.has(l.site.toLowerCase()))
    .map((l) => ({ name: l.site, url: l.url }));

  // Duration
  const duration = m.duration != null ? `${m.duration} min per ep` : undefined;

  return {
    mal_id:       m.id,
    title:        m.title.romaji,
    title_english: m.title.english ?? undefined,
    images,
    score,
    scored_by:    m.popularity ?? undefined,
    rank,
    popularity:   m.popularity ?? undefined,
    episodes:     m.episodes ?? undefined,
    chapters:     m.chapters ?? undefined,
    volumes:      m.volumes ?? undefined,
    status:       mapStatus(m.status, isManga),
    synopsis:     m.description ?? undefined,
    genres,
    studios:      isManga ? undefined : studios,
    authors:      isManga ? authors : undefined,
    year:         m.seasonYear ?? undefined,
    season:       m.season?.toLowerCase() ?? undefined,
    type:         mapFormat(m.format),
    rating:       m.isAdult ? "Rx - Hentai" : undefined,
    duration,
    source:       mapSource(m.source),
    aired:        !isManga ? { from: startIso, to: endIso } : undefined,
    published:    isManga  ? { from: startIso, to: endIso } : undefined,
    streaming:    streaming.length > 0 ? streaming : undefined,
    trailer,
    members:      m.popularity ?? undefined,
    favorites:    m.favourites ?? undefined,
    url:          m.siteUrl ?? undefined,
  };
}

function deduplicateById(items: Anime[]): Anime[] {
  const seen = new Set<number>();
  return items.filter((a) => {
    if (seen.has(a.mal_id)) return false;
    seen.add(a.mal_id);
    return true;
  });
}

function filterSFW(items: Anime[]): Anime[] {
  return items.filter((a) => a.rating !== "Rx - Hentai");
}

// ── GraphQL fetch ─────────────────────────────────────────────────────────────

async function gql<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  retries = 3
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(ANILIST_API, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.status === 429) {
        if (i === retries) throw new Error("Rate limit exceeded");
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json() as { data?: T; errors?: unknown[] };
      if (json.errors) {
        const first = (json.errors[0] as { message?: string })?.message ?? "GraphQL error";
        throw new Error(first);
      }
      return json.data as T;
    } catch (e) {
      clearTimeout(timer);
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw new Error("gql fetch failed");
}

// ── Reusable media fragment ───────────────────────────────────────────────────

const MEDIA_FIELDS = `
  id
  title { romaji english }
  coverImage { large medium extraLarge }
  averageScore
  meanScore
  popularity
  rankings { rank type allTime }
  episodes
  chapters
  volumes
  status
  description(asHtml: false)
  genres
  studios(isMain: true) { nodes { id name } }
  staff(sort: [RELEVANCE], page: 1, perPage: 4) { edges { role node { id name { full } } } }
  seasonYear
  season
  format
  isAdult
  duration
  source
  startDate { year month day }
  endDate { year month day }
  trailer { id site }
  externalLinks { site url type }
  favourites
  siteUrl
`;

// ── Current season helper ─────────────────────────────────────────────────────

function getCurrentAniListSeason(): string {
  const m = new Date().getMonth();
  if (m < 3)  return "WINTER";
  if (m < 6)  return "SPRING";
  if (m < 9)  return "SUMMER";
  return "FALL";
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function fetchSeasonNow(
  page = 1,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const isManga = contentType === "manga";
  const year = new Date().getFullYear();
  const season = getCurrentAniListSeason();

  let query: string;
  let variables: Record<string, unknown>;

  if (isManga) {
    query = `
      query ($page: Int, $perPage: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage }
          media(type: MANGA, status: RELEASING, sort: POPULARITY_DESC, isAdult: $isAdult) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    variables = { page, perPage: 25, isAdult: isAdult ? null : false };
  } else {
    query = `
      query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int, $isAdult: Boolean) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage }
          media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: $isAdult) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;
    variables = { page, perPage: 25, season, year, isAdult: isAdult ? null : false };
  }

  const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }>(query, variables);
  const raw = data.Page.media ?? [];
  const items = deduplicateById(raw.map((m) => mapMedia(m, isManga)));
  return { items, hasNext: data.Page.pageInfo.hasNextPage };
}

export async function fetchTopAnime(
  page = 1,
  filter = "bypopularity",
  type?: string,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const isManga = contentType === "manga";

  // Sort
  let sort = "POPULARITY_DESC";
  let status: string | null = null;
  if (filter === "" || filter === undefined)  sort = "SCORE_DESC";
  if (filter === "airing")    { sort = "SCORE_DESC";    status = "RELEASING"; }
  if (filter === "upcoming")  { sort = "START_DATE";    status = "NOT_YET_RELEASED"; }
  if (filter === "bypopularity") sort = "POPULARITY_DESC";

  // Format
  let format: string | null = null;
  if (type) {
    const fmtMap: Record<string, string> = {
      tv: "TV", movie: "MOVIE", ova: "OVA", ona: "ONA", special: "SPECIAL",
      manga: "MANGA", manhwa: "MANGA", manhua: "MANGA", novel: "NOVEL", oneshot: "ONE_SHOT",
    };
    format = fmtMap[type.toLowerCase()] ?? null;
  }

  const query = `
    query ($page: Int, $perPage: Int, $type: MediaType, $sort: MediaSort, $status: MediaStatus, $format: MediaFormat, $isAdult: Boolean) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(type: $type, sort: [$sort], status: $status, format: $format, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const variables: Record<string, unknown> = {
    page,
    perPage: 25,
    type: isManga ? "MANGA" : "ANIME",
    sort,
    status: status ?? undefined,
    format: format ?? undefined,
    isAdult: isAdult ? null : false,
  };

  const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }>(query, variables);
  const raw = data.Page.media ?? [];
  const items = deduplicateById(raw.map((m) => mapMedia(m, isManga)));
  return { items, hasNext: data.Page.pageInfo.hasNextPage };
}

export async function fetchUpcoming(
  page = 1,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const isManga = contentType === "manga";

  const query = `
    query ($page: Int, $perPage: Int, $type: MediaType, $isAdult: Boolean) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(type: $type, status: NOT_YET_RELEASED, sort: POPULARITY_DESC, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }>(query, {
    page,
    perPage: 25,
    type: isManga ? "MANGA" : "ANIME",
    isAdult: isAdult ? null : false,
  });

  const raw = data.Page.media ?? [];
  const items = deduplicateById(raw.map((m) => mapMedia(m, isManga)));
  return { items, hasNext: data.Page.pageInfo.hasNextPage };
}

export async function fetchAnimeByGenre(
  genreId: number,
  page = 1,
  contentType: ContentType = "anime"
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const isManga = contentType === "manga";
  const mapping = GENRE_ID_TO_ANILIST[genreId];
  if (!mapping) return { items: [], hasNext: false };

  const useGenre = mapping.param === "genre";

  const query = useGenre
    ? `
      query ($page: Int, $perPage: Int, $type: MediaType, $genre: String) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage }
          media(type: $type, genre: $genre, sort: SCORE_DESC, isAdult: false) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `
    : `
      query ($page: Int, $perPage: Int, $type: MediaType, $tag: String) {
        Page(page: $page, perPage: $perPage) {
          pageInfo { hasNextPage }
          media(type: $type, tag: $tag, sort: SCORE_DESC, isAdult: false) {
            ${MEDIA_FIELDS}
          }
        }
      }
    `;

  const variables: Record<string, unknown> = {
    page,
    perPage: 25,
    type: isManga ? "MANGA" : "ANIME",
    ...(useGenre ? { genre: mapping.name } : { tag: mapping.name }),
  };

  const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }>(query, variables);
  const raw = data.Page.media ?? [];
  const items = deduplicateById(filterSFW(raw.map((m) => mapMedia(m, isManga))));
  return { items, hasNext: data.Page.pageInfo.hasNextPage };
}

export async function fetchAnimeById(id: number): Promise<Anime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        ${MEDIA_FIELDS}
        tags { name rank }
      }
    }
  `;
  const data = await gql<{ Media: AniListMedia }>(query, { id });
  if (!data.Media) return null;
  return mapMedia(data.Media, false);
}

export async function fetchMangaById(id: number): Promise<Anime | null> {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: MANGA) {
        ${MEDIA_FIELDS}
        tags { name rank }
      }
    }
  `;
  const data = await gql<{ Media: AniListMedia }>(query, { id });
  if (!data.Media) return null;
  return mapMedia(data.Media, true);
}

export async function fetchRecommendations(
  id: number,
  contentType: ContentType = "anime"
): Promise<Recommendation[]> {
  try {
    const type = contentType === "manga" ? "MANGA" : "ANIME";
    const query = `
      query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          recommendations(sort: RATING_DESC, perPage: 12) {
            nodes {
              rating
              mediaRecommendation {
                ${MEDIA_FIELDS}
              }
            }
          }
        }
      }
    `;
    const data = await gql<{
      Media: {
        recommendations: {
          nodes: Array<{ rating: number; mediaRecommendation: AniListMedia | null }>;
        };
      };
    }>(query, { id, type });

    return (data.Media.recommendations.nodes ?? [])
      .filter((n) => n.mediaRecommendation != null)
      .map((n) => ({
        entry: mapMedia(n.mediaRecommendation!, contentType === "manga"),
        votes: n.rating ?? 0,
      }));
  } catch {
    return [];
  }
}

export async function fetchCharacters(
  id: number,
  contentType: ContentType = "anime"
): Promise<Character[]> {
  try {
    const type = contentType === "manga" ? "MANGA" : "ANIME";
    const query = `
      query ($id: Int, $type: MediaType) {
        Media(id: $id, type: $type) {
          characters(sort: [ROLE, RELEVANCE], perPage: 16) {
            edges {
              role
              node {
                id
                name { full }
                image { large medium }
              }
            }
          }
        }
      }
    `;
    const data = await gql<{
      Media: {
        characters: {
          edges: Array<{
            role: string;
            node: { id: number; name: { full: string }; image: { large?: string; medium?: string } };
          }>;
        };
      };
    }>(query, { id, type });

    return (data.Media.characters.edges ?? []).map((e) => ({
      character: {
        mal_id: e.node.id,
        name: e.node.name.full,
        images: { jpg: { image_url: e.node.image.large ?? e.node.image.medium ?? "" } },
      },
      role: e.role === "MAIN" ? "Main" : e.role === "SUPPORTING" ? "Supporting" : e.role,
    }));
  } catch {
    return [];
  }
}

export async function fetchStudioInfo(studioId: number): Promise<StudioInfo | null> {
  try {
    const query = `
      query ($id: Int) {
        Studio(id: $id) {
          name
          siteUrl
        }
      }
    `;
    const data = await gql<{ Studio: { name: string; siteUrl?: string } }>(query, { id: studioId });
    if (!data.Studio) return null;
    return {
      name: data.Studio.name,
      imageUrl: null,
      about: data.Studio.siteUrl ? `Official site: ${data.Studio.siteUrl}` : null,
    };
  } catch {
    return null;
  }
}

export async function fetchStudioAnimeHasNext(
  studioId: number,
  page = 1
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const query = `
    query ($id: Int, $page: Int, $perPage: Int) {
      Studio(id: $id) {
        media(sort: SCORE_DESC, isMain: true, page: $page, perPage: $perPage) {
          pageInfo { hasNextPage }
          nodes {
            ${MEDIA_FIELDS}
          }
        }
      }
    }
  `;
  const data = await gql<{
    Studio: {
      media: {
        pageInfo: { hasNextPage: boolean };
        nodes: AniListMedia[];
      };
    };
  }>(query, { id: studioId, page, perPage: 24 });

  const raw = data.Studio?.media?.nodes ?? [];
  return {
    items: deduplicateById(filterSFW(raw.map((m) => mapMedia(m, false)))),
    hasNext: data.Studio?.media?.pageInfo?.hasNextPage ?? false,
  };
}

export async function fetchSeasonArchiveHasNext(
  year: number,
  season: string,
  page = 1
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const anilistSeason = season.toUpperCase();

  const query = `
    query ($page: Int, $perPage: Int, $season: MediaSeason, $year: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo { hasNextPage }
        media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;
  const data = await gql<{ Page: { pageInfo: { hasNextPage: boolean }; media: AniListMedia[] } }>(
    query,
    { page, perPage: 24, season: anilistSeason, year }
  );
  const raw = data.Page.media ?? [];
  return {
    items: deduplicateById(filterSFW(raw.map((m) => mapMedia(m, false)))),
    hasNext: data.Page.pageInfo.hasNextPage,
  };
}

export async function searchContent(
  query: string,
  page = 1,
  contentType: ContentType = "anime",
  isAdult = false,
  status?: string,
  type?: string
): Promise<Anime[]> {
  const isManga = contentType === "manga";

  // Map Jikan status strings to AniList
  let anilistStatus: string | undefined;
  if (status) {
    const map: Record<string, string> = {
      airing:     "RELEASING",
      publishing: "RELEASING",
      complete:   "FINISHED",
      upcoming:   "NOT_YET_RELEASED",
      hiatus:     "HIATUS",
    };
    anilistStatus = map[status] ?? status.toUpperCase();
  }

  // Map format
  let format: string | undefined;
  if (type) {
    const fmtMap: Record<string, string> = {
      tv: "TV", movie: "MOVIE", ova: "OVA", ona: "ONA", special: "SPECIAL",
    };
    format = fmtMap[type.toLowerCase()];
  }

  const gqlQuery = `
    query ($page: Int, $perPage: Int, $search: String, $type: MediaType, $status: MediaStatus, $format: MediaFormat, $isAdult: Boolean) {
      Page(page: $page, perPage: $perPage) {
        media(search: $search, type: $type, status: $status, format: $format, sort: SEARCH_MATCH, isAdult: $isAdult) {
          ${MEDIA_FIELDS}
        }
      }
    }
  `;

  const data = await gql<{ Page: { media: AniListMedia[] } }>(gqlQuery, {
    page,
    perPage: 20,
    search: query,
    type: isManga ? "MANGA" : "ANIME",
    status: anilistStatus ?? undefined,
    format: format ?? undefined,
    isAdult: isAdult ? null : false,
  });

  const raw = data.Page.media ?? [];
  const items = deduplicateById(raw.map((m) => mapMedia(m, isManga)));
  return isAdult ? items : filterSFW(items);
}

export { searchContent as searchAnime };

// ── News (generated from trending AniList data) ───────────────────────────────

function mapCategoryToBadge(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("review"))    return "REVIEW";
  if (c.includes("interview")) return "INTERVIEW";
  if (c.includes("episode") || c.includes("preview")) return "EPISODE";
  return "NEWS";
}

export async function fetchAnimeNews(): Promise<NewsItem[]> {
  const apiBase = getApiBaseUrl();

  // Try backend news endpoint first
  try {
    const res = await fetch(`${apiBase}/news`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined,
    } as RequestInit);

    if (res.ok) {
      const data = await res.json() as {
        items: Array<{
          id: number;
          title: string;
          excerpt: string;
          url: string;
          date: string;
          author: string;
          imageUrl: string | null;
          category: string;
        }>;
      };

      if (data.items && data.items.length > 0) {
        return data.items.map((item) => ({
          mal_id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          url: item.url,
          date: item.date,
          author_username: item.author,
          images: { jpg: { image_url: item.imageUrl ?? "" } },
          comments: 0,
          badge: mapCategoryToBadge(item.category),
        }));
      }
    }
  } catch {}

  // Fallback: generate news cards from AniList trending data
  return generateFallbackNews();
}

async function generateFallbackNews(): Promise<NewsItem[]> {
  const now = new Date().toISOString();
  const newsItems: NewsItem[] = [];
  const year = new Date().getFullYear();
  const season = getCurrentAniListSeason();

  try {
    const query = `
      query ($season: MediaSeason, $year: Int) {
        airing: Page(page: 1, perPage: 6) {
          media(type: ANIME, season: $season, seasonYear: $year, sort: POPULARITY_DESC, isAdult: false) {
            id title { romaji english } coverImage { large } synopsis: description(asHtml: false)
            averageScore popularity siteUrl startDate { year month day }
          }
        }
        trending: Page(page: 1, perPage: 4) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id title { romaji english } coverImage { large } synopsis: description(asHtml: false)
            averageScore siteUrl
          }
        }
      }
    `;

    const data = await gql<{
      airing: { media: Array<AniListMedia & { synopsis?: string }> };
      trending: { media: Array<AniListMedia & { synopsis?: string }> };
    }>(query, { season, year });

    for (const anime of (data.airing.media ?? []).slice(0, 5)) {
      const desc = (anime as any).synopsis ?? "";
      newsItems.push({
        mal_id: anime.id,
        title: `Now Airing: ${anime.title.english ?? anime.title.romaji}`,
        excerpt: desc.length > 160 ? desc.slice(0, 160) + "…" : desc || "Currently airing this season.",
        url: anime.siteUrl ?? `https://anilist.co/anime/${anime.id}`,
        date: anilistDateToISO(anime.startDate) ?? now,
        author_username: "AniHour",
        images: { jpg: { image_url: anime.coverImage?.large ?? "" } },
        comments: 0,
        badge: "AIRING",
      });
    }

    for (const anime of (data.trending.media ?? []).slice(0, 4)) {
      const desc = (anime as any).synopsis ?? "";
      const score = anime.averageScore ? (anime.averageScore / 10).toFixed(1) : "N/A";
      newsItems.push({
        mal_id: anime.id * 100 + 1,
        title: `Trending: ${anime.title.english ?? anime.title.romaji}`,
        excerpt: `Rated ${score}/10 — ${desc.length > 130 ? desc.slice(0, 130) + "…" : desc || "Currently trending."}`,
        url: anime.siteUrl ?? `https://anilist.co/anime/${anime.id}`,
        date: now,
        author_username: "AniHour",
        images: { jpg: { image_url: anime.coverImage?.large ?? "" } },
        comments: 0,
        badge: "TRENDING",
      });
    }
  } catch {}

  return newsItems;
}
