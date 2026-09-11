import { NextResponse } from "next/server";
import {
  generateLinkedInReplies,
  type ReplyIntent,
} from "@/lib/linkedin-reply-generator";
import { getPost } from "@/lib/admin-db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_INTENTS: ReplyIntent[] = [
  "auto",
  "thanks",
  "answer",
  "follow_up",
  "recruiter",
];

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = rateLimit(req, "admin-engagement-replies", {
    limit: 20,
    windowMs: 300_000,
  });
  if (limited) return limited;

  let body: Record<string, string>;
  try {
    body = (await req.json()) as Record<string, string>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const comment = body.comment?.trim() ?? "";
  if (!comment) {
    return NextResponse.json({ error: "Paste the comment you want to reply to." }, { status: 400 });
  }

  const intent = (body.intent?.trim() || "auto") as ReplyIntent;
  if (!VALID_INTENTS.includes(intent)) {
    return NextResponse.json({ error: "Invalid reply intent." }, { status: 400 });
  }

  let postTopic = body.postTopic?.trim();
  let postExcerpt = body.postExcerpt?.trim();

  const postId = body.postId?.trim();
  if (postId) {
    const post = await getPost(postId);
    if (post) {
      postTopic = postTopic || post.topic;
      postExcerpt =
        postExcerpt ||
        post.hook ||
        post.body.slice(0, 400);
    }
  }

  try {
    const result = await generateLinkedInReplies({
      comment,
      tone: body.tone?.trim() || "conversational",
      intent,
      postTopic,
      postExcerpt,
      commenterContext: body.commenterContext?.trim(),
      extraContext: body.extraContext?.trim(),
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Reply generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
