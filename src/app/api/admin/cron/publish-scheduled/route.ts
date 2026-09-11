import { NextResponse } from "next/server";
import { listDueScheduledPosts, listPosts, updatePost } from "@/lib/admin-db";
import { publishLinkedInPost } from "@/lib/linkedin";
import { tryPostFirstComment } from "@/lib/linkedin-comments";
import { withHashtags } from "@/lib/linkedin-hashtags";
import { renderCarouselPdf, renderPostImage } from "@/lib/linkedin-media";
import {
  APP_SETTING_KEYS,
  getAppSetting,
  verifyCronSecret,
} from "@/lib/app-settings";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { runPostPreflight } from "@/lib/linkedin-preflight";

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
  const [allPosts, organizationUrn] = await Promise.all([
    listPosts(),
    getAppSetting(APP_SETTING_KEYS.linkedinOrganizationUrn),
  ]);
  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const post of due) {
    try {
      const preflight = runPostPreflight({
        post,
        otherPosts: allPosts,
        organizationConfigured: Boolean(organizationUrn),
      });
      if (!preflight.ready) {
        throw new Error(
          `Publish preflight failed: ${preflight.issues
            .filter((issue) => issue.severity === "error")
            .map((issue) => issue.message)
            .join(" ")}`,
        );
      }
      const media =
        post.media_kind === "image"
          ? {
              kind: "image" as const,
              bytes: await renderPostImage(post),
              contentType: "image/png" as const,
              title: post.media_title || post.hook || post.topic,
            }
          : post.media_kind === "document"
            ? {
                kind: "document" as const,
                bytes: await renderCarouselPdf(post.carousel_slides ?? []),
                contentType: "application/pdf" as const,
                title: post.media_title || post.topic,
              }
            : undefined;
      const result = await publishLinkedInPost(
        withHashtags(post.body, post.hashtags ?? []),
        {
          target: post.publish_target ?? "member",
          media,
        },
      );
      let firstCommentPostedAt: number | null = null;
      try {
        firstCommentPostedAt = await tryPostFirstComment(
          result.postUrn,
          post.first_comment,
        );
      } catch {
        firstCommentPostedAt = null;
      }
      await updatePost(post.id, {
        status: "posted",
        posted_at: Date.now(),
        linkedin_post_urn: result.postUrn,
        linkedin_url: result.postUrl,
        error_message: null,
        first_comment_posted_at: firstCommentPostedAt,
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
