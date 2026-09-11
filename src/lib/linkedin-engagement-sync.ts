import "server-only";

import { randomUUID } from "crypto";
import {
  findEngagementCommentByLinkedInId,
  listPosts,
  setEngagementPollState,
  upsertEngagementComment,
} from "@/lib/admin-db";
import type { EngagementCommentRow } from "@/lib/admin-types";
import { fetchLinkedInComments } from "@/lib/linkedin-comments";
import { getValidLinkedInAuth } from "@/lib/linkedin";
import { generateLinkedInReplies } from "@/lib/linkedin-reply-generator";

export interface PollCommentsResult {
  scannedPosts: number;
  fetchedComments: number;
  newQueued: number;
  skippedOwn: number;
  errors: { postId: string; error: string }[];
}

export async function pollLinkedInEngagement(): Promise<PollCommentsResult> {
  const auth = await getValidLinkedInAuth();
  if (!auth) {
    throw new Error(
      "LinkedIn is not connected. Connect your account in Admin → Settings.",
    );
  }

  const posted = await listPosts("posted");
  const withUrns = posted.filter((post) => post.linkedin_post_urn);
  const result: PollCommentsResult = {
    scannedPosts: withUrns.length,
    fetchedComments: 0,
    newQueued: 0,
    skippedOwn: 0,
    errors: [],
  };

  for (const post of withUrns) {
    const postUrn = post.linkedin_post_urn!;
    try {
      const comments = await fetchLinkedInComments(postUrn);
      result.fetchedComments += comments.length;

      for (const comment of comments) {
        if (comment.actorUrn && comment.actorUrn === auth.member_urn) {
          result.skippedOwn += 1;
          continue;
        }

        const existing = await findEngagementCommentByLinkedInId(comment.id);
        if (existing) continue;

        let suggestedReplies: EngagementCommentRow["suggested_replies"] = [];
        let coachingNote: string | null = null;

        try {
          const generated = await generateLinkedInReplies({
            comment: comment.text,
            tone: "conversational",
            intent: "auto",
            postTopic: post.topic,
            postExcerpt: post.hook ?? post.body.slice(0, 400),
          });
          suggestedReplies = generated.replies;
          coachingNote = `${generated.recommendedAction === "ignore" ? "Recommended: ignore. " : generated.recommendedAction === "review" ? "Recommended: review manually. " : ""}${generated.coachingNote}`.trim() || null;
        } catch (err) {
          coachingNote =
            err instanceof Error
              ? `Draft generation failed: ${err.message}`
              : "Draft generation failed.";
        }

        const now = Date.now();
        await upsertEngagementComment({
          id: randomUUID(),
          post_id: post.id,
          post_topic: post.topic,
          linkedin_post_urn: postUrn,
          linkedin_comment_id: comment.id,
          linkedin_comment_urn: comment.commentUrn,
          linkedin_activity_urn: comment.activityUrn,
          author_urn: comment.actorUrn,
          author_label: comment.actorLabel,
          comment_text: comment.text,
          commented_at: comment.createdAt,
          status: "pending",
          suggested_replies: suggestedReplies,
          coaching_note: coachingNote,
          approved_reply: suggestedReplies[0]?.text ?? null,
          replied_at: null,
          reply_comment_urn: null,
          error_message: null,
          created_at: now,
          updated_at: now,
        });
        result.newQueued += 1;
      }
    } catch (err) {
      result.errors.push({
        postId: post.id,
        error: err instanceof Error ? err.message : "Comment poll failed.",
      });
    }
  }

  await setEngagementPollState({
    last_poll_at: Date.now(),
    last_poll_error:
      result.errors.length > 0
        ? result.errors.map((item) => `${item.postId}: ${item.error}`).join(" | ")
        : null,
    last_new_count: result.newQueued,
  });

  return result;
}
