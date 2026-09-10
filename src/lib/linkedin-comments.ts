import {
  getValidLinkedInAuth,
  linkedInHeaders,
  LINKEDIN_API_VERSION,
} from "@/lib/linkedin";

export interface LinkedInComment {
  id: string;
  commentUrn: string;
  actorUrn: string | null;
  actorLabel: string;
  text: string;
  activityUrn: string | null;
  createdAt: number;
}

interface LinkedInCommentElement {
  id?: string;
  commentUrn?: string;
  actor?: string;
  object?: string;
  message?: { text?: string };
  created?: { time?: number };
}

function encodeUrnForPath(urn: string): string {
  return encodeURIComponent(urn);
}

function actorLabel(actorUrn: string | undefined): string {
  if (!actorUrn) return "LinkedIn member";
  if (actorUrn.includes("organization:")) return "Organization";
  return "LinkedIn member";
}

function parseCommentsPayload(payload: unknown): LinkedInComment[] {
  const elements = (payload as { elements?: LinkedInCommentElement[] })?.elements ?? [];
  return elements
    .map((item) => {
      const text = item.message?.text?.trim();
      if (!text || !item.id) return null;
      return {
        id: item.id,
        commentUrn: item.commentUrn ?? item.id,
        actorUrn: item.actor ?? null,
        actorLabel: actorLabel(item.actor),
        text,
        activityUrn: item.object ?? null,
        createdAt: item.created?.time ?? Date.now(),
      } satisfies LinkedInComment;
    })
    .filter((item): item is LinkedInComment => item !== null);
}

export async function fetchLinkedInComments(
  postUrn: string,
): Promise<LinkedInComment[]> {
  const auth = await getValidLinkedInAuth();
  if (!auth) {
    throw new Error(
      "LinkedIn is not connected. Connect your account in Admin → Settings.",
    );
  }

  const url = `https://api.linkedin.com/rest/socialActions/${encodeUrnForPath(postUrn)}/comments`;
  const res = await fetch(url, {
    headers: linkedInHeaders(auth.access_token),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403 || text.includes("ACCESS_DENIED") || text.includes("Not enough permissions")) {
      throw new Error(
        "LinkedIn denied comment access: your token lacks r_member_social, which only comes with Community Management API approval on the LinkedIn app. Reconnecting won't help until that product is approved — check granted permissions in Settings and use manual paste mode meanwhile.",
      );
    }
    throw new Error(`LinkedIn comments fetch failed (${res.status}): ${text.slice(0, 300)}`);
  }

  return parseCommentsPayload(await res.json());
}

export async function postLinkedInFirstComment(input: {
  postUrn: string;
  text: string;
}): Promise<string> {
  return postLinkedInCommentReply({
    postUrn: input.postUrn,
    commentUrn: input.postUrn,
    activityUrn: input.postUrn,
    text: input.text,
  });
}

export async function postLinkedInCommentReply(input: {
  postUrn: string;
  commentUrn: string;
  activityUrn: string | null;
  text: string;
}): Promise<string> {
  const auth = await getValidLinkedInAuth();
  if (!auth) {
    throw new Error(
      "LinkedIn is not connected. Connect your account in Admin → Settings.",
    );
  }

  const target = input.commentUrn.includes("urn:li:comment:")
    ? input.commentUrn
    : input.postUrn;

  const url = `https://api.linkedin.com/rest/socialActions/${encodeUrnForPath(target)}/comments`;
  const body: Record<string, unknown> = {
    actor: auth.member_urn,
    message: { text: input.text.trim() },
    object: input.activityUrn ?? input.postUrn,
  };

  if (input.commentUrn.includes("urn:li:comment:")) {
    body.parentComment = input.commentUrn;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: linkedInHeaders(auth.access_token),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403 || text.includes("ACCESS_DENIED")) {
      throw new Error(
        "LinkedIn denied posting the reply. This needs w_member_social — check granted permissions in Settings and reconnect if it is missing.",
      );
    }
    throw new Error(`LinkedIn reply failed (${res.status}): ${text.slice(0, 300)}`);
  }

  const replyId = res.headers.get("x-restli-id");
  if (replyId && input.commentUrn.includes("urn:li:comment:")) {
    const match = input.commentUrn.match(/urn:li:activity:\d+/);
    if (match) {
      return `urn:li:comment:(${match[0]},${replyId})`;
    }
  }

  return replyId ?? "posted";
}

export async function tryPostFirstComment(
  postUrn: string,
  firstComment?: string | null,
): Promise<number | null> {
  const text = firstComment?.trim();
  if (!text) return null;
  await postLinkedInFirstComment({ postUrn, text });
  return Date.now();
}

export { LINKEDIN_API_VERSION };
