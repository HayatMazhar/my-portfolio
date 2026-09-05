import type { MetadataRoute } from "next";
import { PROJECTS, ARTICLES } from "@/data/cv";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mazharhayat.live"
).replace(/\/$/, "");

/**
 * Static routes worth indexing. `/dark` and `/v2` are intentionally excluded
 * (`/dark` is a legacy theme showcase; `/v2` redirects to `/`).
 */
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/", priority: 1.0, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/for-recruiters", priority: 0.9, changeFrequency: "monthly" },
  { path: "/fit", priority: 0.8, changeFrequency: "monthly" },
  { path: "/playground", priority: 0.7, changeFrequency: "monthly" },
  { path: "/stack", priority: 0.6, changeFrequency: "monthly" },
  { path: "/timeline", priority: 0.6, changeFrequency: "monthly" },
  { path: "/embeddings", priority: 0.5, changeFrequency: "monthly" },
  { path: "/evals", priority: 0.5, changeFrequency: "monthly" },
  { path: "/mcp", priority: 0.5, changeFrequency: "monthly" },
  { path: "/now", priority: 0.5, changeFrequency: "weekly" },
  { path: "/uses", priority: 0.4, changeFrequency: "monthly" },
  { path: "/podcast", priority: 0.4, changeFrequency: "monthly" },
  { path: "/writing", priority: 0.6, changeFrequency: "weekly" },
  { path: "/ar", priority: 0.5, changeFrequency: "monthly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  const projectEntries: MetadataRoute.Sitemap = PROJECTS.map((p) => ({
    url: `${SITE_URL}/projects/${p.slug}`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const articleEntries: MetadataRoute.Sitemap = ARTICLES.filter(
    (a) => !a.comingSoon,
  ).map((a) => ({
    url: `${SITE_URL}/writing/${a.slug}`,
    lastModified: now,
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticEntries, ...projectEntries, ...articleEntries];
}
