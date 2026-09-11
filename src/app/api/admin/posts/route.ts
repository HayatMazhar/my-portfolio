import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createPost,
  deletePost,
  getGenerationLearningContext,
  getPostCounts,
  listPosts,
  updatePost,
  type PostGenerationMode,
  type PostLength,
  type PostAudience,
  type PostTemplate,
} from "@/lib/admin-db";
import { generateLinkedInPost } from "@/lib/linkedin-post-generator";
import { generatePublishKit } from "@/lib/linkedin-post-tools";
import { getTopicSuggestion } from "@/lib/linkedin-post-topics";
import { getLinkedInConnectionStatus } from "@/lib/linkedin";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_TEMPLATES: PostTemplate[] = [
  "story",
  "lesson",
  "case_study",
  "hot_take",
  "hiring_signal",
];
const VALID_MODES: PostGenerationMode[] = ["cv", "trend", "custom"];
const VALID_LENGTHS: PostLength[] = ["short", "medium", "long", "custom"];
const VALID_AUDIENCES: PostAudience[] = [
  "general",
  "recruiters",
  "engineering_leaders",
  "developers",
  "uae_government",
];

function textField(
  value: unknown,
  maxLength: number,
): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  const [posts, counts, linkedin] = await Promise.all([
    listPosts(),
    getPostCounts(),
    getLinkedInConnectionStatus(),
  ]);

  return NextResponse.json({ posts, counts, linkedin });
}

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  const limited = rateLimit(req, "admin-create-post", {
    limit: 20,
    windowMs: 60_000,
  });
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const mode = (textField(body.mode, 20) || "cv") as PostGenerationMode;
  if (!VALID_MODES.includes(mode)) {
    return jsonError("Invalid generation mode.", 400);
  }

  const topicId = textField(body.topicId, 100);
  const suggestion =
    mode === "cv" && topicId ? getTopicSuggestion(topicId) : undefined;

  const topic =
    textField(body.topic, 500)
      ? textField(body.topic, 500)
      : suggestion?.topic ?? "";
  if (!topic) return jsonError("Topic is required.", 400);

  const template =
    (body.template as PostTemplate) || suggestion?.suggestedTemplate || "story";
  if (!VALID_TEMPLATES.includes(template)) {
    return jsonError("Invalid template.", 400);
  }

  const tone = textField(body.tone, 50) || "professional";
  const length = (textField(body.length, 20) || "medium") as PostLength;
  if (!VALID_LENGTHS.includes(length)) {
    return jsonError("Invalid post length.", 400);
  }
  const audience = (textField(body.audience, 40) ||
    "general") as PostAudience;
  if (!VALID_AUDIENCES.includes(audience)) {
    return jsonError("Invalid audience.", 400);
  }
  const customWordCount =
    length === "custom" && typeof body.customWordCount === "number"
      ? Math.round(body.customWordCount)
      : undefined;
  if (
    length === "custom" &&
    (!customWordCount || customWordCount < 30 || customWordCount > 500)
  ) {
    return jsonError("Custom word count must be between 30 and 500.", 400);
  }

  const generateNow = body.generate !== false;
  const extraContext = textField(body.extraContext, 2_000);
  const cvAnchor =
    mode === "cv"
      ? textField(body.cvAnchor, 500) || suggestion?.cvAnchor || ""
      : "";
  const sourceTitle = textField(body.sourceTitle, 500);
  const sourceUrl = textField(body.sourceUrl, 1_000);
  const sourceName = textField(body.sourceName, 100);
  const sourceContext = textField(body.sourceContext, 2_000);

  const id = randomUUID();
  const sources =
    sourceUrl && sourceTitle
      ? [
          {
            title: sourceTitle,
            url: sourceUrl,
            publisher: sourceName,
            context: sourceContext || undefined,
          },
        ]
      : [];
  let post = await createPost({
    id,
    topic,
    template,
    tone,
    generationMode: mode,
    length,
    targetWordCount: customWordCount ?? null,
    audience,
    sources,
  });

  if (generateNow) {
    try {
      const learning = await getGenerationLearningContext();
      const generated = await generateLinkedInPost({
        topic,
        template,
        tone,
        mode,
        extraContext,
        cvAnchor: cvAnchor || undefined,
        sourceTitle: sourceTitle || undefined,
        sourceUrl: sourceUrl || undefined,
        sourceName: sourceName || undefined,
        sourceContext: sourceContext || undefined,
        length,
        customWordCount,
        audience,
        styleExamples: learning.styleExamples,
        performanceInsights: learning.performanceInsights,
      });
      const kit = await generatePublishKit({
        body: generated.body,
        topic,
        audience,
        template,
      });
      post =
        (await updatePost(id, {
          hook: generated.hook,
          body: generated.body,
          variants: generated.variants,
          alternative_hooks: generated.alternativeHooks,
          first_comment: kit.firstComment,
          hashtags: kit.hashtags,
          status: "draft",
        })) ?? post;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      console.error(`post ${id} generation failed:`, err);
      try {
        post =
          (await updatePost(id, { error_message: message, status: "failed" })) ??
          post;
      } catch (updateErr) {
        console.error(`post ${id} could not record failure:`, updateErr);
        post = { ...post, status: "failed", error_message: message };
      }
    }
  }

  return NextResponse.json({ post }, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return jsonError("Unauthorized", 401);
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return jsonError("Invalid JSON body.", 400);
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.map((id) => String(id)).filter(Boolean).slice(0, 40)
    : [];
  const action = String(body.action ?? "");
  if (ids.length === 0) return jsonError("No posts selected.", 400);

  const results: { id: string; ok: boolean; error?: string }[] = [];

  for (const id of ids) {
    try {
      if (action === "delete") {
        const ok = await deletePost(id);
        results.push({ id, ok, error: ok ? undefined : "Not found" });
        continue;
      }
      if (action === "approve") {
        const post = await updatePost(id, { status: "approved" });
        results.push({ id, ok: Boolean(post), error: post ? undefined : "Not found" });
        continue;
      }
      if (action === "draft") {
        const post = await updatePost(id, { status: "draft" });
        results.push({ id, ok: Boolean(post), error: post ? undefined : "Not found" });
        continue;
      }
      return jsonError("Unknown bulk action.", 400);
    } catch (err) {
      results.push({
        id,
        ok: false,
        error: err instanceof Error ? err.message : "Failed",
      });
    }
  }

  return NextResponse.json({ results });
}
