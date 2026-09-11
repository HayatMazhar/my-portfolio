import "server-only";

import Groq from "groq-sdk";
import { PERSONAL } from "@/data/cv";
import { GROQ_FAST_MODEL } from "@/lib/groq-models";
import {
  APP_SETTING_KEYS,
  getAppSetting,
  resolveGroqApiKey,
} from "@/lib/app-settings";
import { buildCvContext } from "@/lib/linkedin-cv-context";

export type ReplyIntent =
  | "thanks"
  | "answer"
  | "follow_up"
  | "recruiter"
  | "auto";

export interface GeneratedReply {
  label: string;
  text: string;
  intent: string;
}

export interface GeneratedReplySet {
  replies: GeneratedReply[];
  coachingNote: string;
  recommendedAction: "reply" | "ignore" | "review";
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function formatGroqError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes("invalid_api_key") ||
    raw.includes("Invalid API Key") ||
    raw.includes("401")
  ) {
    return "Invalid Groq API key. Open Admin → Settings, paste a key from console.groq.com, and save.";
  }
  return raw;
}

const INTENT_HINTS: Record<Exclude<ReplyIntent, "auto">, string> = {
  thanks: "Brief, gracious thank-you. No overselling.",
  answer: "Answer the question directly with one concrete fact from CV if relevant.",
  follow_up: "Keep the conversation going with a thoughtful question or invite.",
  recruiter: "Professional, warm, clear about fit and openness without being desperate.",
};

export async function generateLinkedInReplies(input: {
  comment: string;
  tone: string;
  intent: ReplyIntent;
  postTopic?: string;
  postExcerpt?: string;
  commenterContext?: string;
  extraContext?: string;
  playbook?: string;
}): Promise<GeneratedReplySet> {
  const apiKey = await resolveGroqApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured. Add it in Admin → Settings.");
  }

  const comment = input.comment.trim();
  if (!comment) {
    throw new Error("Comment text is required.");
  }

  const groq = new Groq({ apiKey });
  const playbook =
    input.playbook ??
    (await getAppSetting(APP_SETTING_KEYS.replyPlaybook)) ??
    "";
  const cvContext = buildCvContext({
    topic: [input.postTopic, comment, input.commenterContext, input.extraContext]
      .filter(Boolean)
      .join(" "),
    extraContext: input.extraContext,
  });

  const intentLine =
    input.intent === "auto"
      ? "Pick the best mix: one short thanks, one substantive answer, one follow-up question."
      : `All three variants should lean toward: ${INTENT_HINTS[input.intent]}`;

  const systemPrompt = `You are Mazhar Hayat replying to LinkedIn comments on his own posts. Draft replies that sound human, specific, and credible — never generic AI fluff.

VOICE RULES:
- First person as Mazhar (${PERSONAL.title}, Abu Dhabi).
- 1-4 short sentences per reply. LinkedIn comments should be concise.
- Be warm but professional. No "Great question!" or "Thanks for engaging!"
- Use CV facts only when they genuinely help — never invent metrics or employers.
- No hashtags. Minimal emojis (0-1).
- Never auto-commit to calls, jobs, or contracts — suggest continuing in DMs if appropriate.
- If the comment is rude or spam, draft a polite boundary or ignore-style response.
${playbook ? `\nMAZHAR'S COMMENT PLAYBOOK:\n${playbook.slice(0, 2000)}\nThese rules override the default style when they do not conflict with safety or factual accuracy.` : ""}

Output STRICT JSON only:
{
  "replies": [
    { "label": "<Short label e.g. Warm thanks>", "text": "<reply text>", "intent": "<thanks|answer|follow_up|recruiter|boundary>" },
    { "label": "...", "text": "...", "intent": "..." },
    { "label": "...", "text": "...", "intent": "..." }
  ],
  "coachingNote": "<one sentence tip for Mazhar before he posts manually>",
  "recommendedAction": "<reply|ignore|review>"
}`;

  const userPrompt = `ORIGINAL POST CONTEXT:
${input.postTopic ? `Topic: ${input.postTopic}` : "Topic: (not provided)"}
${input.postExcerpt ? `Excerpt: ${input.postExcerpt.slice(0, 400)}` : ""}

COMMENT TO REPLY TO:
"${comment}"

${input.commenterContext ? `Commenter context: ${input.commenterContext}` : ""}
${input.extraContext ? `Extra notes from Mazhar: ${input.extraContext}` : ""}

Tone: ${input.tone}
${intentLine}

CV CONTEXT (use when relevant — do not fabricate):
${cvContext}

Return exactly 3 reply options with different angles. JSON only.`;

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: GROQ_FAST_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    });
  } catch (err) {
    throw new Error(formatGroqError(err));
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq.");

  let parsed: GeneratedReplySet;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as GeneratedReplySet;
  } catch {
    throw new Error("Failed to parse generated replies JSON.");
  }

  const replies = (parsed.replies ?? [])
    .filter((r) => r?.text?.trim())
    .slice(0, 3)
    .map((r) => ({
      label: r.label?.trim() || "Reply",
      text: r.text.trim(),
      intent: r.intent?.trim() || "answer",
    }));

  if (replies.length === 0) {
    throw new Error("No reply drafts were generated.");
  }

  return {
    replies,
    coachingNote: parsed.coachingNote?.trim() || "",
    recommendedAction: ["reply", "ignore", "review"].includes(
      parsed.recommendedAction,
    )
      ? parsed.recommendedAction
      : "reply",
  };
}

export const REPLY_INTENTS: {
  id: ReplyIntent;
  label: string;
  description: string;
}[] = [
  { id: "auto", label: "Smart mix", description: "Thanks + answer + follow-up" },
  { id: "thanks", label: "Thank them", description: "Short and gracious" },
  { id: "answer", label: "Answer", description: "Direct and factual" },
  { id: "follow_up", label: "Follow up", description: "Ask a question back" },
  { id: "recruiter", label: "Recruiter", description: "Professional interest" },
];
