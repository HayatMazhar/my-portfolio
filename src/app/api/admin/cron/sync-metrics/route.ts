import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { listPosts, updatePost } from "@/lib/admin-db";
import { verifyCronSecret } from "@/lib/app-settings";
import { fetchLinkedInPostMetrics } from "@/lib/linkedin";

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

  const posts = (await listPosts("posted"))
    .filter(
      (post) =>
        post.linkedin_post_urn &&
        (post.publish_target ?? "member") === "member",
    )
    .slice(0, 25);
  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const post of posts) {
    try {
      const metrics = await fetchLinkedInPostMetrics(post.linkedin_post_urn!);
      await updatePost(post.id, {
        metrics: {
          ...metrics,
          recorded_at: Date.now(),
          source: "linkedin",
          sync_error: null,
        },
      });
      results.push({ id: post.id, ok: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Metrics sync failed.";
      await updatePost(post.id, {
        metrics: {
          ...(post.metrics ?? {
            impressions: 0,
            reactions: 0,
            comments: 0,
            reposts: 0,
            clicks: 0,
            recorded_at: Date.now(),
          }),
          sync_error: message,
        },
      });
      results.push({ id: post.id, ok: false, error: message });
      if (/401|403|permission|scope/i.test(message)) break;
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
