import type { LinkedInPostRow } from "@/lib/admin-types";

const UAE_OFFSET_MS = 4 * 60 * 60 * 1000;

export interface RecommendedSlot {
  weekday: number;
  hour: number;
  label: string;
  nextAt: number;
  basedOnPosts: number;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function nextOccurrence(weekday: number, hour: number, now = Date.now()): number {
  const uaeNow = new Date(now + UAE_OFFSET_MS);
  const candidate = new Date(
    Date.UTC(
      uaeNow.getUTCFullYear(),
      uaeNow.getUTCMonth(),
      uaeNow.getUTCDate(),
      hour,
      0,
      0,
    ),
  );
  let days = (weekday - uaeNow.getUTCDay() + 7) % 7;
  if (days === 0 && candidate.getTime() <= now + UAE_OFFSET_MS) days = 7;
  return candidate.getTime() + days * 86_400_000 - UAE_OFFSET_MS;
}

export function recommendPublishingSlot(
  posts: LinkedInPostRow[],
): RecommendedSlot {
  const measured = posts.filter(
    (post) =>
      post.posted_at &&
      post.metrics &&
      post.metrics.impressions >= 50,
  );
  const buckets = new Map<string, { score: number; count: number }>();
  for (const post of measured) {
    const local = new Date(post.posted_at! + UAE_OFFSET_MS);
    const weekday = local.getUTCDay();
    const hour = local.getUTCHours();
    const metrics = post.metrics!;
    const engagements =
      metrics.reactions + metrics.comments + metrics.reposts + metrics.clicks;
    const score = engagements / Math.max(1, metrics.impressions);
    const key = `${weekday}:${hour}`;
    const current = buckets.get(key) ?? { score: 0, count: 0 };
    current.score += score;
    current.count += 1;
    buckets.set(key, current);
  }

  let weekday = 2;
  let hour = 9;
  let basedOnPosts = 0;
  let bestAverage = -1;
  for (const [key, bucket] of buckets) {
    const average = bucket.score / bucket.count;
    if (average > bestAverage) {
      [weekday, hour] = key.split(":").map(Number) as [number, number];
      basedOnPosts = bucket.count;
      bestAverage = average;
    }
  }

  return {
    weekday,
    hour,
    label: `${DAY_NAMES[weekday]} at ${String(hour).padStart(2, "0")}:00 UAE`,
    nextAt: nextOccurrence(weekday, hour),
    basedOnPosts,
  };
}
