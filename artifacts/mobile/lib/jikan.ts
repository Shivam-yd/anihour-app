import { ContentType } from "./content-settings";

const BASE_URL = "https://api.jikan.moe/v4";

function getApiBaseUrl(): string {
  const domain = process.env["EXPO_PUBLIC_DOMAIN"];
  if (domain) return `https://${domain}/api`;
  return "/api";
}

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
  mal_id: number;
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

const HENTAI_RATING = "Rx - Hentai";
const HENTAI_GENRE_ID = 12;

function filterSFW(items: Anime[]): Anime[] {
  return items.filter(
    (a) =>
      a.rating !== HENTAI_RATING &&
      !a.genres?.some((g) => g.mal_id === HENTAI_GENRE_ID)
  );
}

function deduplicateById(items: Anime[]): Anime[] {
  const seen = new Set<number>();
  return items.filter((a) => {
    if (seen.has(a.mal_id)) return false;
    seen.add(a.mal_id);
    return true;
  });
}

export const GENRE_MAP: Record<string, { id: number; label: string }> = {
  action: { id: 1, label: "Action" },
  adventure: { id: 2, label: "Adventure" },
  comedy: { id: 4, label: "Comedy" },
  drama: { id: 8, label: "Drama" },
  fantasy: { id: 10, label: "Fantasy" },
  horror: { id: 14, label: "Horror" },
  mystery: { id: 7, label: "Mystery" },
  psychological: { id: 40, label: "Psychological" },
  romance: { id: 22, label: "Romance" },
  "sci-fi": { id: 24, label: "Sci-Fi" },
  school: { id: 26, label: "School" },
  seinen: { id: 42, label: "Seinen" },
  shoujo: { id: 25, label: "Shoujo" },
  shounen: { id: 27, label: "Shounen" },
  "slice-of-life": { id: 36, label: "Slice of Life" },
  sports: { id: 30, label: "Sports" },
  supernatural: { id: 37, label: "Supernatural" },
  thriller: { id: 41, label: "Thriller" },
  historical: { id: 13, label: "Historical" },
  isekai: { id: 62, label: "Isekai" },
  military: { id: 38, label: "Military" },
  mecha: { id: 18, label: "Mecha" },
  music: { id: 19, label: "Music" },
  magic: { id: 16, label: "Magic" },
};

async function fetchWithRetry(url: string, retries = 2): Promise<unknown> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
}

export async function fetchSeasonNow(
  page = 1,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<Anime[]> {
  let url: string;
  if (isAdult) {
    const status = contentType === "manga" ? "publishing" : "airing";
    url = `${BASE_URL}/${contentType}?status=${status}&genres=12&sfw=false&order_by=score&sort=desc&page=${page}&limit=25`;
  } else if (contentType === "manga") {
    url = `${BASE_URL}/manga?status=publishing&order_by=score&sort=desc&page=${page}&limit=25&sfw=true`;
  } else {
    url = `${BASE_URL}/seasons/now?page=${page}&limit=25&sfw=true`;
  }
  const data = (await fetchWithRetry(url)) as { data: Anime[] };
  const items = deduplicateById(data.data ?? []);
  return isAdult ? items : filterSFW(items);
}

export async function fetchTopAnime(
  page = 1,
  filter = "bypopularity",
  type?: string,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<Anime[]> {
  let url: string;
  if (isAdult) {
    const typeParam = type ? `&type=${type}` : "";
    url = `${BASE_URL}/${contentType}?genres=12&sfw=false${typeParam}&order_by=score&sort=desc&page=${page}&limit=25`;
  } else if (contentType === "manga") {
    const filterParam = filter ? `&filter=${filter}` : "";
    const typeParam = type ? `&type=${type}` : "";
    url = `${BASE_URL}/top/manga?page=${page}&limit=25${filterParam}${typeParam}&sfw=true`;
  } else {
    const typeParam = type ? `&type=${type}` : "";
    const filterParam = filter ? `&filter=${filter}` : "";
    url = `${BASE_URL}/top/anime?page=${page}&limit=25${filterParam}${typeParam}&sfw=true`;
  }
  const data = (await fetchWithRetry(url)) as { data: Anime[] };
  const items = deduplicateById(data.data ?? []);
  return isAdult ? items : filterSFW(items);
}

export async function fetchUpcoming(
  page = 1,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<Anime[]> {
  let url: string;
  if (isAdult) {
    url = `${BASE_URL}/${contentType}?genres=12&sfw=false&status=not_yet_aired&order_by=start_date&sort=asc&page=${page}&limit=25`;
  } else if (contentType === "manga") {
    url = `${BASE_URL}/top/manga?filter=upcoming&page=${page}&limit=25`;
  } else {
    url = `${BASE_URL}/seasons/upcoming?page=${page}&limit=25&sfw=true`;
  }
  const data = (await fetchWithRetry(url)) as { data: Anime[] };
  const items = deduplicateById(data.data ?? []);
  return isAdult ? items : filterSFW(items);
}

export async function fetchAnimeByGenre(
  genreId: number,
  page = 1,
  contentType: ContentType = "anime"
): Promise<Anime[]> {
  const url = `${BASE_URL}/${contentType}?genres=${genreId}&order_by=score&sort=desc&page=${page}&limit=25&sfw=true`;
  const data = (await fetchWithRetry(url)) as { data: Anime[] };
  return deduplicateById(filterSFW(data.data ?? []));
}

export async function fetchSeasonArchive(
  year: number,
  season: string
): Promise<Anime[]> {
  const url = `${BASE_URL}/seasons/${year}/${season}?limit=25&sfw=true`;
  const data = (await fetchWithRetry(url)) as { data: Anime[] };
  return deduplicateById(filterSFW(data.data ?? []));
}

function mapCategoryToBadge(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("review")) return "REVIEW";
  if (c.includes("interview")) return "INTERVIEW";
  if (c.includes("episode") || c.includes("preview")) return "EPISODE";
  return "NEWS";
}

export async function fetchAnimeNews(): Promise<NewsItem[]> {
  const apiBase = getApiBaseUrl();

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

  return generateFallbackNews();
}

async function generateFallbackNews(): Promise<NewsItem[]> {
  const now = new Date().toISOString();
  const newsItems: NewsItem[] = [];

  try {
    const [seasonRes, recentRes, trendingRes] = await Promise.allSettled([
      fetchWithRetry(`${BASE_URL}/seasons/now?limit=8`) as Promise<{ data: Anime[] }>,
      fetchWithRetry(`${BASE_URL}/anime?order_by=start_date&sort=desc&limit=8&sfw=true`) as Promise<{ data: Anime[] }>,
      fetchWithRetry(`${BASE_URL}/top/anime?filter=airing&limit=5`) as Promise<{ data: Anime[] }>,
    ]);

    if (seasonRes.status === "fulfilled" && seasonRes.value?.data) {
      for (const anime of seasonRes.value.data.slice(0, 5)) {
        const synopsis = anime.synopsis ?? "No description available.";
        newsItems.push({
          mal_id: anime.mal_id,
          title: `Now Airing: ${anime.title}`,
          excerpt: synopsis.length > 160 ? synopsis.slice(0, 160) + "…" : synopsis,
          url: anime.url ?? `https://myanimelist.net/anime/${anime.mal_id}`,
          date: anime.aired?.from ?? now,
          author_username: "AnimeNews",
          images: anime.images,
          comments: 0,
          badge: "AIRING",
        });
      }
    }

    await new Promise((r) => setTimeout(r, 400));

    if (recentRes.status === "fulfilled" && recentRes.value?.data) {
      for (const anime of recentRes.value.data.slice(0, 5)) {
        const synopsis = anime.synopsis ?? "No description available.";
        newsItems.push({
          mal_id: anime.mal_id * 100 + 1,
          title: `New Addition: ${anime.title}`,
          excerpt: synopsis.length > 160 ? synopsis.slice(0, 160) + "…" : synopsis,
          url: anime.url ?? `https://myanimelist.net/anime/${anime.mal_id}`,
          date: now,
          author_username: "AnimeNews",
          images: anime.images,
          comments: 0,
          badge: "NEW",
        });
      }
    }

    if (trendingRes.status === "fulfilled" && trendingRes.value?.data) {
      for (const anime of trendingRes.value.data.slice(0, 3)) {
        const synopsis = anime.synopsis ?? "No description available.";
        newsItems.push({
          mal_id: anime.mal_id * 100 + 2,
          title: `Trending: ${anime.title}`,
          excerpt: `Rated ${anime.score ?? "N/A"}/10 — ${synopsis.length > 130 ? synopsis.slice(0, 130) + "…" : synopsis}`,
          url: anime.url ?? `https://myanimelist.net/anime/${anime.mal_id}`,
          date: now,
          author_username: "AnimeNews",
          images: anime.images,
          comments: 0,
          badge: "TRENDING",
        });
      }
    }
  } catch {}

  return newsItems;
}

export interface Character {
  character: {
    mal_id: number;
    name: string;
    images: { jpg: { image_url: string } };
  };
  role: string;
}

export async function fetchRecommendations(
  id: number,
  contentType: ContentType = "anime"
): Promise<Anime[]> {
  try {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${contentType}/${id}/recommendations`
    )) as { data: Array<{ entry: Anime }> };
    return (data.data ?? []).slice(0, 12).map((r) => r.entry);
  } catch {
    return [];
  }
}

export async function fetchCharacters(
  id: number,
  contentType: ContentType = "anime"
): Promise<Character[]> {
  try {
    const data = (await fetchWithRetry(
      `${BASE_URL}/${contentType}/${id}/characters`
    )) as { data: Character[] };
    return (data.data ?? []).slice(0, 16);
  } catch {
    return [];
  }
}

export async function fetchStudioAnime(studioId: number, page = 1): Promise<Anime[]> {
  const url = `${BASE_URL}/anime?producers=${studioId}&order_by=score&sort=desc&page=${page}&limit=24&sfw=true`;
  const data = (await fetchWithRetry(url)) as { data: Anime[]; pagination?: { has_next_page: boolean } };
  return deduplicateById(filterSFW(data.data ?? []));
}

export async function fetchStudioAnimeHasNext(studioId: number, page = 1): Promise<{ items: Anime[]; hasNext: boolean }> {
  const url = `${BASE_URL}/anime?producers=${studioId}&order_by=score&sort=desc&page=${page}&limit=24&sfw=true`;
  const data = (await fetchWithRetry(url)) as { data: Anime[]; pagination?: { has_next_page: boolean } };
  return {
    items: deduplicateById(filterSFW(data.data ?? [])),
    hasNext: data.pagination?.has_next_page ?? false,
  };
}

export async function fetchSeasonArchiveHasNext(
  year: number,
  season: string,
  page = 1
): Promise<{ items: Anime[]; hasNext: boolean }> {
  const url = `${BASE_URL}/seasons/${year}/${season}?limit=24&sfw=true&page=${page}`;
  const data = (await fetchWithRetry(url)) as { data: Anime[]; pagination?: { has_next_page: boolean } };
  return {
    items: deduplicateById(filterSFW(data.data ?? [])),
    hasNext: data.pagination?.has_next_page ?? false,
  };
}

export async function fetchAnimeById(id: number): Promise<Anime | null> {
  const data = (await fetchWithRetry(`${BASE_URL}/anime/${id}/full`)) as { data: Anime };
  return data.data ?? null;
}

export async function fetchMangaById(id: number): Promise<Anime | null> {
  const data = (await fetchWithRetry(`${BASE_URL}/manga/${id}/full`)) as { data: Anime };
  return data.data ?? null;
}

export async function searchContent(
  query: string,
  page = 1,
  contentType: ContentType = "anime",
  isAdult = false
): Promise<Anime[]> {
  const sfwParam = isAdult ? "sfw=false" : "sfw=true";
  const adultGenre = isAdult ? "&genres=12" : "";
  const url = `${BASE_URL}/${contentType}?q=${encodeURIComponent(query)}&page=${page}&limit=20&${sfwParam}${adultGenre}`;
  const data = (await fetchWithRetry(url)) as { data: Anime[] };
  return data.data ?? [];
}

export { searchContent as searchAnime };
