import { NextResponse } from "next/server";
import {
  getEngagementComment,
  getPost,
  updateEngagementComment,
} from "@/lib/admin-db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { postLinkedInCommentReply } from "@/lib/linkedin-comments";
import { generateLinkedInReplies } from "@/lib/linkedin-reply-generator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const row = await getEngagementComment(params.id);
  if (!row) {
    return NextResponse.json({ error: "Comment not found." }, { status: 404 });
  }

  let body: { action?: string; replyText?: string };
  try {
    body = (await req.json()) as { action?: string; replyText?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const action = body.action?.trim() ?? "reply";

  if (action === "skip") {
    const updated = await updateEngagementComment(row.id, {
      status: "skipped",
      error_message: null,
    });
    return NextResponse.json({ item: updated });
  }

  if (action === "regenerate") {
    try {
      const post = await getPost(row.post_id);
      const generated = await generateLinkedInReplies({
        comment: row.comment_text,
        tone: "conversational",
        intent: "auto",
        postTopic: row.post_topic,
        postExcerpt: post?.hook ?? post?.body.slice(0, 400),
      });
      const updated = await updateEngagementComment(row.id, {
        suggested_replies: generated.replies,
        coaching_note: generated.coachingNote || null,
        approved_reply: generated.replies[0]?.text ?? row.approved_reply,
        error_message: null,
      });
      return NextResponse.json({ item: updated });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Regenerate failed.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (action === "reply") {
    const replyText = (body.replyText ?? row.approved_reply ?? "").trim();
    if (!replyText) {
      return NextResponse.json({ error: "Reply text is required." }, { status: 400 });
    }

    try {
      const replyUrn = await postLinkedInCommentReply({
        postUrn: row.linkedin_post_urn,
        commentUrn: row.linkedin_comment_urn,
        activityUrn: row.linkedin_activity_urn,
        text: replyText,
      });
      const updated = await updateEngagementComment(row.id, {
        status: "replied",
        approved_reply: replyText,
        replied_at: Date.now(),
        reply_comment_urn: replyUrn,
        error_message: null,
      });
      return NextResponse.json({ item: updated, replyUrn });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reply failed.";
      await updateEngagementComment(row.id, {
        status: "failed",
        error_message: message,
      });
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Unknown action." }, { status: 400 });
}
