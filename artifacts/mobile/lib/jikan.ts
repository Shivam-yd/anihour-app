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
}

export interface NewsArticle {
  mal_id: number;
  title: string;
  date: string;
  author_username: string;
  forum_url: string;
  url: string;
  images: {
    jpg: {
      image_url: string;
    };
  };
  comments: number;
  excerpt: string;
  tags?: string[];
}

async function fetchWithRetry(url: string, retries = 2): Promise<unknown> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (res.status === 429) {
        await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
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
  filter = "bypopularity"
): Promise<Anime[]> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/top/anime?page=${page}&limit=25&filter=${filter}`
  )) as { data: Anime[] };
  return data.data ?? [];
}

export async function fetchUpcoming(page = 1): Promise<Anime[]> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/seasons/upcoming?page=${page}&limit=25`
  )) as { data: Anime[] };
  return data.data ?? [];
}

export async function fetchAnimeNews(page = 1): Promise<NewsArticle[]> {
  const data = (await fetchWithRetry(
    `${BASE_URL}/anime/news?page=${page}&limit=20`
  )) as { data: NewsArticle[] };
  return data.data ?? [];
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
