import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createPost,
  deletePost,
  getGenerationLearningContext,
  getPost,
  listPosts,
  updatePost,
  type PostStatus,
  type PostTemplate,
} from "@/lib/admin-db";
import { generateLinkedInPost } from "@/lib/linkedin-post-generator";
import {
  generateCarouselSlides,
  generatePublishKit,
  rewriteLinkedInPost,
} from "@/lib/linkedin-post-tools";
import type {
  PostMediaKind,
  PublishTarget,
  RewriteAction,
} from "@/lib/admin-types";
import { POST_TOPIC_SUGGESTIONS } from "@/lib/linkedin-post-topics";
import {
  fetchLinkedInPostMetrics,
  publishLinkedInPost,
} from "@/lib/linkedin";
import { tryPostFirstComment } from "@/lib/linkedin-comments";
import { withHashtags } from "@/lib/linkedin-hashtags";
import { renderCarouselPdf, renderPostImage } from "@/lib/linkedin-media";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";
import { APP_SETTING_KEYS, getAppSetting } from "@/lib/app-settings";
import { runPostPreflight } from "@/lib/linkedin-preflight";

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
  if (typeof body.publish_target === "string") {
    if (!["member", "organization"].includes(body.publish_target)) {
      return jsonError("Invalid publishing target.", 400);
    }
    patch.publish_target = body.publish_target as PublishTarget;
  }
  if (typeof body.media_kind === "string") {
    if (!["none", "image", "document"].includes(body.media_kind)) {
      return jsonError("Invalid media type.", 400);
    }
    patch.media_kind = body.media_kind as PostMediaKind;
  }
  if (typeof body.media_title === "string") {
    patch.media_title = body.media_title.trim().slice(0, 200) || null;
  }
  if (typeof body.first_comment === "string") {
    patch.first_comment = body.first_comment.trim().slice(0, 500) || null;
  }
  if (Array.isArray(body.hashtags)) {
    patch.hashtags = body.hashtags
      .map((tag) => String(tag).replace(/^#+/, "").trim())
      .filter(Boolean)
      .slice(0, 8);
  }
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
  if (body.metrics && typeof body.metrics === "object") {
    const raw = body.metrics as Record<string, unknown>;
    const metric = (key: string) => {
      const value = Number(raw[key] ?? 0);
      return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    };
    patch.metrics = {
      impressions: metric("impressions"),
      reactions: metric("reactions"),
      comments: metric("comments"),
      reposts: metric("reposts"),
      clicks: metric("clicks"),
      recorded_at: Date.now(),
      source: "manual",
      sync_error: null,
    };
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
      const learning = await getGenerationLearningContext();
      const source = post.sources?.[0];
      const generated = await generateLinkedInPost({
        topic: post.topic,
        template: post.template,
        tone: post.tone,
        mode: post.generation_mode,
        extraContext,
        cvAnchor: matchedSuggestion?.cvAnchor,
        sourceTitle: source?.title,
        sourceUrl: source?.url,
        sourceName: source?.publisher,
        sourceContext: source?.context,
        length: post.length,
        customWordCount: post.target_word_count ?? undefined,
        audience: post.audience,
        styleExamples: learning.styleExamples.filter(
          (example) => example !== post.body,
        ),
        performanceInsights: learning.performanceInsights,
      });

      const kit = await generatePublishKit({
        body: generated.body,
        topic: post.topic,
        audience: post.audience,
        template: post.template,
      });
      const updated = await updatePost(params.id, {
        hook: generated.hook,
        body: generated.body,
        variants: generated.variants,
        alternative_hooks: generated.alternativeHooks,
        first_comment: kit.firstComment,
        hashtags: kit.hashtags,
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

  if (action === "rewrite") {
    const limited = rateLimit(req, "admin-rewrite", {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;

    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    let payload: {
      action?: RewriteAction;
      instruction?: string;
      body?: string;
    } = {};
    try {
      payload = (await req.json()) as typeof payload;
    } catch {
      // Current saved body is a valid fallback.
    }
    const validActions: RewriteAction[] = [
      "sharper_hook",
      "simpler",
      "more_technical",
      "more_personal",
      "shorter",
      "custom",
    ];
    const rewriteAction = payload.action ?? "custom";
    if (!validActions.includes(rewriteAction)) {
      return jsonError("Invalid rewrite action.", 400);
    }
    if (
      rewriteAction === "custom" &&
      !payload.instruction?.trim()
    ) {
      return jsonError("A custom editing instruction is required.", 400);
    }

    try {
      const rewritten = await rewriteLinkedInPost({
        body: payload.body?.trim() || post.body,
        action: rewriteAction,
        customInstruction: payload.instruction?.slice(0, 500),
        length: post.length,
        customWordCount: post.target_word_count,
        audience: post.audience,
      });
      const updated = await updatePost(params.id, {
        hook: rewritten.hook,
        body: rewritten.body,
        alternative_hooks: rewritten.alternativeHooks,
        status: "draft",
        error_message: null,
      });
      return NextResponse.json({ post: updated, rewritten });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Rewrite failed.",
        500,
      );
    }
  }

  if (action === "carousel") {
    const limited = rateLimit(req, "admin-carousel", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;
    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    let sourceBody = post.body;
    try {
      const payload = (await req.json()) as { body?: string };
      sourceBody = payload.body?.trim() || sourceBody;
    } catch {
      // Current saved body is a valid fallback.
    }
    try {
      const slides = await generateCarouselSlides(sourceBody);
      const updated = await updatePost(params.id, {
        carousel_slides: slides,
        media_kind: "document",
      });
      return NextResponse.json({ post: updated, slides });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Carousel generation failed.",
        500,
      );
    }
  }

  if (action === "preflight") {
    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    const [posts, organizationUrn] = await Promise.all([
      listPosts(),
      getAppSetting(APP_SETTING_KEYS.linkedinOrganizationUrn),
    ]);
    return NextResponse.json({
      preflight: runPostPreflight({
        post,
        otherPosts: posts,
        organizationConfigured: Boolean(organizationUrn),
      }),
    });
  }

  if (action === "duplicate") {
    const limited = rateLimit(req, "admin-duplicate-post", {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;
    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    const duplicate = await createPost({
      id: randomUUID(),
      topic: `${post.topic} — repurpose`,
      template: post.template,
      tone: post.tone,
      body: post.body,
      hook: post.hook,
      status: "draft",
      generationMode: post.generation_mode,
      length: post.length,
      targetWordCount: post.target_word_count,
      audience: post.audience,
      variants: post.variants,
      alternativeHooks: post.alternative_hooks,
      sources: post.sources,
      publishTarget: post.publish_target,
      mediaKind: "none",
    });
    const saved =
      post.first_comment || (post.hashtags?.length ?? 0) > 0
        ? await updatePost(duplicate.id, {
            first_comment: post.first_comment ?? null,
            hashtags: post.hashtags ?? [],
          })
        : duplicate;
    return NextResponse.json({ post: saved ?? duplicate }, { status: 201 });
  }

  if (action === "publish-kit") {
    const limited = rateLimit(req, "admin-publish-kit", {
      limit: 20,
      windowMs: 60_000,
    });
    if (limited) return limited;
    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    let sourceBody = post.body;
    try {
      const payload = (await req.json()) as { body?: string };
      sourceBody = payload.body?.trim() || sourceBody;
    } catch {
      // Current saved body is a valid fallback.
    }
    if (!sourceBody.trim()) return jsonError("Post body is empty.", 400);
    try {
      const kit = await generatePublishKit({
        body: sourceBody,
        topic: post.topic,
        audience: post.audience,
        template: post.template,
      });
      const updated = await updatePost(params.id, {
        first_comment: kit.firstComment,
        hashtags: kit.hashtags,
      });
      return NextResponse.json({ post: updated, kit });
    } catch (err) {
      return jsonError(
        err instanceof Error ? err.message : "Publish kit failed.",
        500,
      );
    }
  }

  if (action === "sync-metrics") {
    const limited = rateLimit(req, "admin-sync-metrics", {
      limit: 10,
      windowMs: 60_000,
    });
    if (limited) return limited;
    const post = await getPost(params.id);
    if (!post) return jsonError("Post not found.", 404);
    if (!post.linkedin_post_urn) {
      return jsonError("Publish this post before syncing metrics.", 400);
    }
    try {
      const metrics = await fetchLinkedInPostMetrics(post.linkedin_post_urn);
      const updated = await updatePost(post.id, {
        metrics: {
          ...metrics,
          recorded_at: Date.now(),
          source: "linkedin",
          sync_error: null,
        },
      });
      return NextResponse.json({ post: updated });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "LinkedIn metrics sync failed.";
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
      return jsonError(message, 502);
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

    const [posts, organizationUrn] = await Promise.all([
      listPosts(),
      getAppSetting(APP_SETTING_KEYS.linkedinOrganizationUrn),
    ]);
    const preflight = runPostPreflight({
      post,
      otherPosts: posts,
      organizationConfigured: Boolean(organizationUrn),
    });
    if (!preflight.ready) {
      return NextResponse.json(
        { error: "Publish preflight failed.", preflight },
        { status: 400 },
      );
    }

    try {
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
      const updated = await updatePost(params.id, {
        status: "posted",
        posted_at: Date.now(),
        linkedin_post_urn: result.postUrn,
        linkedin_url: result.postUrl,
        error_message: null,
        first_comment_posted_at: firstCommentPostedAt,
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
