import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  createContentSeries,
  createPost,
  getGenerationLearningContext,
  listContentSeries,
} from "@/lib/admin-db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { generateContentSeries } from "@/lib/linkedin-post-tools";
import { rateLimit } from "@/lib/rate-limit";
import type { PostAudience } from "@/lib/admin-types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AUDIENCES: PostAudience[] = [
  "general",
  "recruiters",
  "engineering_leaders",
  "developers",
  "uae_government",
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) return jsonError("Unauthorized", 401);
  return NextResponse.json({ series: await listContentSeries() });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) return jsonError("Unauthorized", 401);
  const limited = rateLimit(req, "admin-create-series", {
    limit: 5,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const theme =
    typeof body.theme === "string" ? body.theme.trim().slice(0, 500) : "";
  const audience = (typeof body.audience === "string"
    ? body.audience
    : "general") as PostAudience;
  const count = Math.min(6, Math.max(2, Math.round(Number(body.count) || 4)));
  const intervalDays = Math.min(
    30,
    Math.max(1, Math.round(Number(body.intervalDays) || 7)),
  );
  const startAt = new Date(
    typeof body.startAt === "string" ? body.startAt : Date.now(),
  ).getTime();
  const recurring = body.recurring === true;

  if (!name || !theme) return jsonError("Series name and theme are required.", 400);
  if (!AUDIENCES.includes(audience)) return jsonError("Invalid audience.", 400);
  if (Number.isNaN(startAt)) return jsonError("Invalid start date.", 400);

  try {
    const learning = await getGenerationLearningContext();
    const generated = await generateContentSeries({
      theme,
      count,
      audience,
      styleExamples: learning.styleExamples,
    });
    const series = await createContentSeries({
      id: randomUUID(),
      name,
      theme,
      audience,
      interval_days: intervalDays,
      post_count: generated.length,
      created_at: Date.now(),
      recurring,
      enabled: true,
      next_generation_at: recurring
        ? startAt + generated.length * intervalDays * 86_400_000
        : null,
    });
    const posts = [];
    for (const [index, item] of generated.entries()) {
      posts.push(
        await createPost({
          id: randomUUID(),
          topic: item.topic,
          template: index % 2 === 0 ? "story" : "lesson",
          tone: "professional",
          body: item.body,
          hook: item.hook,
          status: "draft",
          generationMode: "custom",
          length: "medium",
          audience,
          seriesId: series.id,
          scheduledAt: startAt + index * intervalDays * 86_400_000,
        }),
      );
    }
    return NextResponse.json({ series, posts }, { status: 201 });
  } catch (err) {
    return jsonError(
      err instanceof Error ? err.message : "Series generation failed.",
      500,
    );
  }
}
