const BASE_URL = "https://api.jikan.moe/v4";

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
  status?: string;
  synopsis?: string;
  genres?: AnimeGenre[];
  studios?: AnimeStudio[];
  year?: number;
  season?: string;
  type?: string;
  rating?: string;
  duration?: string;
  source?: string;
  aired?: {
    from?: string;
    to?: string;
  };
  trailer?: {
    youtube_id?: string;
    url?: string;
    embed_url?: string;
    images?: {
      maximum_image_url?: string;
      large_image_url?: string;
    };
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
  images: {
    jpg: {
      image_url: string;
    };
  };
  comments: number;
  tags?: string[];
  badge?: string;
}

async function fetchWithRetry(url: string, retries = 2): Promise<unknown> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
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

export async function fetchSeasonNow(page = 1): Promise<Anime[]> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/seasons/now?page=${page}&limit=25`
  )) as { data: Anime[] };
  return data.data ?? [];
}

export async function fetchTopAnime(
  page = 1,
  filter = "bypopularity",
  type?: string
): Promise<Anime[]> {
  const typeParam = type ? `&type=${type}` : "";
  const filterParam = filter ? `&filter=${filter}` : "";
  const data = (await fetchWithRetry(
    `${BASE_URL}/top/anime?page=${page}&limit=25${filterParam}${typeParam}`
  )) as { data: Anime[] };
  return data.data ?? [];
}

export async function fetchUpcoming(page = 1): Promise<Anime[]> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/seasons/upcoming?page=${page}&limit=25`
  )) as { data: Anime[] };
  return data.data ?? [];
}

export async function fetchAnimeNews(): Promise<NewsItem[]> {
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
  } catch {
  }

  return newsItems;
}

export async function fetchAnimeById(id: number): Promise<Anime | null> {
  const data = (await fetchWithRetry(`${BASE_URL}/anime/${id}/full`)) as {
    data: Anime;
  };
  return data.data ?? null;
}

export async function searchAnime(query: string, page = 1): Promise<Anime[]> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/anime?q=${encodeURIComponent(query)}&page=${page}&limit=20&sfw=true`
  )) as { data: Anime[] };
  return data.data ?? [];
}
