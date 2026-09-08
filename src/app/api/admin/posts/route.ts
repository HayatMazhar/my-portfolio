import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  createPost,
  getPostCounts,
  listPosts,
  updatePost,
  type PostTemplate,
} from "@/lib/admin-db";
import { generateLinkedInPost } from "@/lib/linkedin-post-generator";
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

  const topicId =
    typeof body.topicId === "string" ? body.topicId.trim() : "";
  const suggestion = topicId ? getTopicSuggestion(topicId) : undefined;

  const topic =
    typeof body.topic === "string" && body.topic.trim()
      ? body.topic.trim()
      : suggestion?.topic ?? "";
  if (!topic) return jsonError("Topic is required.", 400);

  const template =
    (body.template as PostTemplate) || suggestion?.suggestedTemplate || "story";
  if (!VALID_TEMPLATES.includes(template)) {
    return jsonError("Invalid template.", 400);
  }

  const tone =
    typeof body.tone === "string" && body.tone.trim()
      ? body.tone.trim()
      : "professional";

  const generateNow = body.generate !== false;
  const extraContext =
    typeof body.extraContext === "string" ? body.extraContext.trim() : "";
  const cvAnchor =
    typeof body.cvAnchor === "string"
      ? body.cvAnchor.trim()
      : suggestion?.cvAnchor ?? "";

  const id = randomUUID();
  let post = await createPost({ id, topic, template, tone });

  if (generateNow) {
    try {
      const generated = await generateLinkedInPost({
        topic,
        template,
        tone,
        extraContext,
        cvAnchor: cvAnchor || undefined,
      });
      post =
        (await updatePost(id, {
          hook: generated.hook,
          body: generated.body,
          status: "draft",
        })) ?? post;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Generation failed.";
      post =
        (await updatePost(id, { error_message: message, status: "failed" })) ??
        post;
    }
  }

  return NextResponse.json({ post }, { status: 201 });
}
