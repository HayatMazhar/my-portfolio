import { NextResponse } from "next/server";
import {
  deletePost,
  getPost,
  updatePost,
  type PostStatus,
  type PostTemplate,
} from "@/lib/admin-db";
import { generateLinkedInPost } from "@/lib/linkedin-post-generator";
import { POST_TOPIC_SUGGESTIONS } from "@/lib/linkedin-post-topics";
import { publishLinkedInPost } from "@/lib/linkedin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: PostStatus[] = [
  "draft",
  "approved",
  "scheduled",
  "posted",
  "failed",
];

const VALID_TEMPLATES: PostTemplate[] = [
  "story",
  "lesson",
  "case_study",
  "hot_take",
  "hiring_signal",
];

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  const post = await getPost(params.id);
  if (!post) return jsonError("Post not found.", 404);
  return NextResponse.json({ post });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  const existing = await getPost(params.id);
  if (!existing) return jsonError("Post not found.", 404);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const patch: Parameters<typeof updatePost>[1] = {};

  if (typeof body.topic === "string") patch.topic = body.topic.trim();
  if (typeof body.body === "string") patch.body = body.body;
  if (typeof body.hook === "string") patch.hook = body.hook.trim();
  if (typeof body.tone === "string") patch.tone = body.tone.trim();
  if (typeof body.template === "string") {
    if (!VALID_TEMPLATES.includes(body.template as PostTemplate)) {
      return jsonError("Invalid template.", 400);
    }
    patch.template = body.template as PostTemplate;
  }
  if (typeof body.status === "string") {
    if (!VALID_STATUSES.includes(body.status as PostStatus)) {
      return jsonError("Invalid status.", 400);
    }
    patch.status = body.status as PostStatus;
  }
  if (body.scheduled_at === null) {
    patch.scheduled_at = null;
  } else if (
    typeof body.scheduled_at === "string" ||
    typeof body.scheduled_at === "number"
  ) {
    const ts = new Date(body.scheduled_at).getTime();
    if (Number.isNaN(ts)) return jsonError("Invalid scheduled_at.", 400);
    patch.scheduled_at = ts;
    if (patch.status === undefined && existing.status === "draft") {
      patch.status = "scheduled";
    }
  }

  const post = await updatePost(params.id, patch);
  return NextResponse.json({ post });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  const ok = await deletePost(params.id);
  if (!ok) return jsonError("Post not found.", 404);
  return NextResponse.json({ ok: true });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action");

  if (action === "generate") {
    const limited = rateLimit(req, "admin-generate", {
      limit: 15,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);

    let extraContext = "";
    try {
      const body = (await req.json()) as { extraContext?: string };
      extraContext = body.extraContext?.trim() ?? "";
    } catch {
      // optional body
    }

    try {
      const matchedSuggestion = POST_TOPIC_SUGGESTIONS.find(
        (s) => s.topic === post.topic,
      );
      const generated = await generateLinkedInPost({
        topic: post.topic,
        template: post.template,
        tone: post.tone,
        extraContext,
        cvAnchor: matchedSuggestion?.cvAnchor,
      });

      const updated = await updatePost(params.id, {
        hook: generated.hook,
        body: generated.body,
        status: "draft",
        error_message: null,
      });

      return NextResponse.json({ post: updated, generated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      await updatePost(params.id, { error_message: message, status: "failed" });
      return jsonError(message, 500);
    }
  }

  if (action === "publish") {
    const limited = rateLimit(req, "admin-publish", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    if (!post.body.trim()) return jsonError("Post body is empty.", 400);

    if (post.status !== "approved" && post.status !== "scheduled") {
      return jsonError("Approve the post before publishing.", 400);
    }

    try {
      const result = await publishLinkedInPost(post.body.trim());
      const updated = await updatePost(params.id, {
        status: "posted",
        posted_at: Date.now(),
        linkedin_post_urn: result.postUrn,
        linkedin_url: result.postUrl,
        error_message: null,
      });
      return NextResponse.json({ post: updated, result });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed.";
      await updatePost(params.id, { status: "failed", error_message: message });
      return jsonError(message, 502);
    }
  }

  return jsonError("Unknown action.", 400);
}
