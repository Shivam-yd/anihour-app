import { Router, type IRouter } from "express";

const router: IRouter = Router();
const ANILIST_API = "https://graphql.anilist.co";

interface AniListDate {
  year?: number;
  month?: number;
  day?: number;
}

interface AniListNewsMedia {
  id: number;
  title: { romaji: string; english?: string | null };
  coverImage: { large?: string | null };
  description?: string | null;
  averageScore?: number | null;
  popularity?: number | null;
  siteUrl?: string | null;
  startDate?: AniListDate | null;
}

interface AniListNewsResponse {
  data?: {
    airing: { media: AniListNewsMedia[] };
    trending: { media: AniListNewsMedia[] };
  };
  errors?: Array<{ message?: string }>;
}

function getSeason(date = new Date()): "WINTER" | "SPRING" | "SUMMER" | "FALL" {
  const month = date.getMonth();
  if (month < 3) return "WINTER";
  if (month < 6) return "SPRING";
  if (month < 9) return "SUMMER";
  return "FALL";
}

function dateToIso(date?: AniListDate | null): string {
  if (!date?.year) return new Date().toISOString();
  const month = String(date.month ?? 1).padStart(2, "0");
  const day = String(date.day ?? 1).padStart(2, "0");
  return `${date.year}-${month}-${day}T00:00:00.000Z`;
}

function cleanDescription(description?: string | null): string {
  return (description ?? "")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;|&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleOf(media: AniListNewsMedia): string {
  return media.title.english || media.title.romaji;
}

function excerptOf(media: AniListNewsMedia, fallback: string): string {
  const description = cleanDescription(media.description);
  return description ? `${description.slice(0, 200)}${description.length > 200 ? "…" : ""}` : fallback;
}

async function fetchAniListNews(): Promise<NewsItem[]> {
  const query = `
    query ($season: MediaSeason, $year: Int) {
      airing: Page(page: 1, perPage: 8) {
        media(
          type: ANIME
          season: $season
          seasonYear: $year
          sort: POPULARITY_DESC
          isAdult: false
        ) {
          id
          title { romaji english }
          coverImage { large }
          description(asHtml: false)
          averageScore
          popularity
          siteUrl
          startDate { year month day }
        }
      }
      trending: Page(page: 1, perPage: 8) {
        media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
          id
          title { romaji english }
          coverImage { large }
          description(asHtml: false)
          averageScore
          popularity
          siteUrl
        }
      }
    }
  `;

  const res = await fetch(ANILIST_API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { season: getSeason(), year: new Date().getFullYear() },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`AniList news fetch failed: ${res.status}`);
  const payload = await res.json() as AniListNewsResponse;
  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "AniList news query failed");
  }

  const airing = payload.data?.airing.media ?? [];
  const trending = payload.data?.trending.media ?? [];
  const items: NewsItem[] = [];

  airing.slice(0, 6).forEach((media) => {
    items.push({
      id: media.id,
      title: `Now Airing: ${titleOf(media)}`,
      excerpt: excerptOf(media, "Currently airing this season."),
      url: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
      date: dateToIso(media.startDate),
      author: "AniHour",
      imageUrl: media.coverImage.large ?? null,
      category: "Airing",
    });
  });

  trending.slice(0, 6).forEach((media) => {
    items.push({
      id: media.id * 100 + 1,
      title: `Trending: ${titleOf(media)}`,
      excerpt: excerptOf(
        media,
        media.averageScore
          ? `Rated ${(media.averageScore / 10).toFixed(1)}/10 — currently trending.`
          : "Currently trending on AniList."
      ),
      url: media.siteUrl ?? `https://anilist.co/anime/${media.id}`,
      date: new Date().toISOString(),
      author: "AniHour",
      imageUrl: media.coverImage.large ?? null,
      category: "Trending",
    });
  });

  return items;
}

interface NewsItem {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  date: string;
  author: string;
  imageUrl: string | null;
  category: string;
}

router.get("/news", async (_req, res) => {
  try {
    const items = await fetchAniListNews();
    res.json({ items, source: "anilist" });
  } catch (error) {
    console.error("[news] AniList fetch failed:", error);
    res.status(502).json({ error: "Failed to fetch news feed" });
  }
});

export default router;