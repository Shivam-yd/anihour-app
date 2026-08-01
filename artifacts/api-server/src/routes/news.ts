import { Router, type IRouter } from "express";

const router: IRouter = Router();

// Anime News Network RSS — reliable, no auth, accessible from server environments
const RSS_URL = "https://www.animenewsnetwork.com/all/rss.xml?ann-edition=us";

interface RssNewsItem {
  id: number;
  title: string;
  excerpt: string;
  url: string;
  date: string;
  author: string;
  imageUrl: string | null;
  category: string;
}

function extractCdata(xml: string, tag: string): string {
  const cdataRe = new RegExp(
    `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`,
    "i"
  );
  const cdataMatch = xml.match(cdataRe);
  if (cdataMatch) return cdataMatch[1].trim();
  const plainRe = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const plainMatch = xml.match(plainRe);
  return (plainMatch?.[1] ?? "").trim();
}

function extractImageUrl(itemXml: string, description: string): string | null {
  const mediaContent = itemXml.match(/<media:(?:thumbnail|content)>([^<]+)<\/media:(?:thumbnail|content)>/i);
  if (mediaContent) return mediaContent[1].trim();
  const mediaAttr = itemXml.match(/<media:(?:thumbnail|content)[^>]+url="([^"]+)"/i);
  if (mediaAttr) return mediaAttr[1];
  const enclosure = itemXml.match(/<enclosure[^>]+url="([^"]+\.(jpg|jpeg|png|webp))"/i);
  if (enclosure) return enclosure[1];
  const imgInDesc = description.match(/<img[^>]+src="([^"]+)"/i);
  if (imgInDesc) return imgInDesc[1];
  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function inferCategory(title: string, categories: string[]): string {
  const all = [title, ...categories].join(" ").toLowerCase();
  if (all.includes("review"))    return "Review";
  if (all.includes("interview")) return "Interview";
  if (all.includes("preview") || all.includes("trailer")) return "Preview";
  if (all.includes("episode"))   return "Episode";
  if (all.includes("manga"))     return "Manga";
  if (all.includes("game"))      return "Games";
  return "News";
}

async function fetchAnnNewsRss(): Promise<RssNewsItem[]> {
  const res = await fetch(RSS_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; AniHour/1.0)" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
  const items: RssNewsItem[] = [];
  let id = 1;

  for (const itemXml of itemMatches.slice(0, 40)) {
    const title = stripHtml(extractCdata(itemXml, "title"));
    const link = extractCdata(itemXml, "link") || extractCdata(itemXml, "guid");
    const description = extractCdata(itemXml, "description");
    const pubDate = extractCdata(itemXml, "pubDate");
    const author =
      extractCdata(itemXml, "dc:creator") ||
      extractCdata(itemXml, "author") ||
      "Anime News Network";

    // Collect all <category> tags
    const categoryMatches = [...itemXml.matchAll(/<category[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/category>/gi)];
    const categories = categoryMatches.map((m) => m[1].trim()).filter(Boolean);

    const category = inferCategory(title, categories);
    const imageUrl = extractImageUrl(itemXml, description);
    const excerpt = stripHtml(description).slice(0, 220).trim();

    if (title && link) {
      items.push({
        id: id++,
        title,
        excerpt: excerpt || "Read the full article on Anime News Network.",
        url: link.trim(),
        date: pubDate || new Date().toISOString(),
        author,
        imageUrl,
        category,
      });
    }
  }

  return items;
}

router.get("/news", async (_req, res) => {
  try {
    const items = await fetchAnnNewsRss();
    res.json({ items, source: "ann" });
  } catch (err) {
    console.error("[news] RSS fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch news feed" });
  }
});

export default router;
