import { NextResponse } from "next/server";
import { listDueScheduledPosts, updatePost } from "@/lib/admin-db";
import { publishLinkedInPost } from "@/lib/linkedin";
import { verifyCronSecret } from "@/lib/app-settings";
import { isAdminAuthenticated } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;

  const cronOk = await verifyCronSecret(bearer);
  const sessionOk = await isAdminAuthenticated();

  if (!cronOk && !sessionOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await listDueScheduledPosts();
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const post of due) {
    try {
      const result = await publishLinkedInPost(post.body.trim());
      await updatePost(post.id, {
        status: "posted",
        posted_at: Date.now(),
        linkedin_post_urn: result.postUrn,
        linkedin_url: result.postUrl,
        error_message: null,
      });
      results.push({ id: post.id, ok: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed.";
      await updatePost(post.id, { status: "failed", error_message: message });
      results.push({ id: post.id, ok: false, error: message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
