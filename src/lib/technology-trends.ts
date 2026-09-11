import "server-only";

export type TrendSource = "Hacker News" | "DEV Community";

export interface TechnologyTrend {
  id: string;
  title: string;
  url: string;
  source: TrendSource;
  publishedAt: number;
  context: string;
}

const TECH_TERMS =
  /\b(ai|agent|llm|model|openai|anthropic|claude|gemini|groq|rag|vector|database|framework|typescript|javascript|python|rust|cloud|azure|aws|developer|devops|security|kubernetes|docker|api|github|open source|machine learning)\b/i;

function clean(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function trendId(source: TrendSource, value: string): string {
  return `${source.toLowerCase().replace(/\s+/g, "-")}:${value}`;
}

async function fetchHackerNewsTrends(): Promise<TechnologyTrend[]> {
  const oneWeekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
  const url =
    "https://hn.algolia.com/api/v1/search_by_date" +
    `?tags=story&hitsPerPage=40&numericFilters=created_at_i>${oneWeekAgo}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`Hacker News returned ${res.status}.`);

  const data = (await res.json()) as {
    hits?: {
      objectID?: string;
      title?: string;
      url?: string;
      story_text?: string;
      created_at_i?: number;
      points?: number;
      num_comments?: number;
    }[];
  };

  return (data.hits ?? [])
    .filter((item) => clean(item.title).match(TECH_TERMS))
    .sort(
      (a, b) =>
        (b.points ?? 0) +
        (b.num_comments ?? 0) * 2 -
        ((a.points ?? 0) + (a.num_comments ?? 0) * 2),
    )
    .slice(0, 12)
    .map((item) => {
      const id = item.objectID ?? clean(item.title);
      return {
        id: trendId("Hacker News", id),
        title: clean(item.title),
        url:
          clean(item.url) ||
          `https://news.ycombinator.com/item?id=${encodeURIComponent(id)}`,
        source: "Hacker News" as const,
        publishedAt: (item.created_at_i ?? 0) * 1000,
        context: [
          item.points != null ? `${item.points} points` : "",
          item.num_comments != null ? `${item.num_comments} comments` : "",
          clean(item.story_text).slice(0, 220),
        ]
          .filter(Boolean)
          .join(" · "),
      };
    });
}

async function fetchDevToTrends(): Promise<TechnologyTrend[]> {
  const res = await fetch(
    "https://dev.to/api/articles?top=7&per_page=30",
    {
      headers: {
        Accept: "application/vnd.forem.api-v1+json",
        "User-Agent": "MazharHayat-LinkedInStudio",
      },
      next: { revalidate: 900 },
    },
  );
  if (!res.ok) throw new Error(`DEV Community returned ${res.status}.`);

  const data = (await res.json()) as {
    id?: number;
    title?: string;
    description?: string;
    url?: string;
    published_timestamp?: string;
    positive_reactions_count?: number;
    comments_count?: number;
    tag_list?: string[];
  }[];

  return data
    .filter((item) =>
      `${clean(item.title)} ${clean(item.description)} ${(item.tag_list ?? []).join(" ")}`.match(
        TECH_TERMS,
      ),
    )
    .slice(0, 12)
    .map((item) => ({
      id: trendId("DEV Community", String(item.id ?? clean(item.title))),
      title: clean(item.title),
      url: clean(item.url),
      source: "DEV Community" as const,
      publishedAt: item.published_timestamp
        ? Date.parse(item.published_timestamp)
        : Date.now(),
      context: [
        clean(item.description).slice(0, 220),
        item.positive_reactions_count != null
          ? `${item.positive_reactions_count} reactions`
          : "",
        item.comments_count != null ? `${item.comments_count} comments` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    }));
}

export async function getTechnologyTrends(): Promise<{
  trends: TechnologyTrend[];
  fetchedAt: number;
  warnings: string[];
}> {
  const results = await Promise.allSettled([
    fetchHackerNewsTrends(),
    fetchDevToTrends(),
  ]);
  const warnings: string[] = [];
  const trends: TechnologyTrend[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      trends.push(...result.value);
    } else {
      warnings.push(
        result.reason instanceof Error
          ? result.reason.message
          : "A trend source failed.",
      );
    }
  }

  const deduped = Array.from(
    new Map(trends.map((trend) => [trend.title.toLowerCase(), trend])).values(),
  )
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 20);

  if (deduped.length === 0) {
    throw new Error(
      warnings.join(" ") || "No current technology trends were available.",
    );
  }

  return { trends: deduped, fetchedAt: Date.now(), warnings };
}
