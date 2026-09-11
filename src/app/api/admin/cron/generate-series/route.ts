import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  createPost,
  getGenerationLearningContext,
  listContentSeries,
  updateContentSeries,
} from "@/lib/admin-db";
import { verifyCronSecret } from "@/lib/app-settings";
import { generateContentSeries } from "@/lib/linkedin-post-tools";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (
    !(await verifyCronSecret(bearer)) &&
    !(await isAdminAuthenticated())
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const due = (await listContentSeries()).filter(
    (series) =>
      series.recurring &&
      series.enabled !== false &&
      series.next_generation_at != null &&
      series.next_generation_at <= now,
  );
  const learning = due.length ? await getGenerationLearningContext() : null;
  const results: Array<{ seriesId: string; postId?: string; error?: string }> = [];

  for (const series of due.slice(0, 5)) {
    try {
      const [generated] = await generateContentSeries({
        theme: `${series.theme}\nThis is the next installment. Avoid repeating earlier introductions or framing.`,
        count: 1,
        audience: series.audience,
        styleExamples: learning?.styleExamples,
      });
      if (!generated) throw new Error("No series draft generated.");
      const slot = series.next_generation_at!;
      const post = await createPost({
        id: randomUUID(),
        topic: generated.topic,
        template: "lesson",
        tone: "professional",
        body: generated.body,
        hook: generated.hook,
        status: "draft",
        generationMode: "custom",
        length: "medium",
        audience: series.audience,
        seriesId: series.id,
        scheduledAt: slot,
      });
      await updateContentSeries(series.id, {
        post_count: series.post_count + 1,
        next_generation_at: slot + series.interval_days * 86_400_000,
      });
      results.push({ seriesId: series.id, postId: post.id });
    } catch (err) {
      results.push({
        seriesId: series.id,
        error: err instanceof Error ? err.message : "Generation failed.",
      });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
