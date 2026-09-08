import "server-only";

import Groq from "groq-sdk";
import { PERSONAL } from "@/data/cv";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";
import { resolveGroqApiKey } from "@/lib/app-settings";
import { buildCvContext } from "@/lib/linkedin-cv-context";
import type { PostTemplate } from "@/lib/admin-types";

const TEMPLATE_GUIDANCE: Record<PostTemplate, string> = {
  story:
    "Open with a specific moment or tension. Build to one insight. End with a question or soft CTA.",
  lesson:
    "Start with the mistake or surprise. Explain what changed your mind. Give one actionable takeaway.",
  case_study:
    "Problem → approach → result with real metrics. Name the stack briefly. No buzzword soup.",
  hot_take:
    "State the contrarian view in line 1. Support with experience. Acknowledge nuance without waffling.",
  hiring_signal:
    "Lead with value/insight first. Mention openness to roles or consulting near the end — never lead with 'I'm looking'.",
};

const SYSTEM_PROMPT_BASE = `You are Mazhar Hayat's LinkedIn ghostwriter. You write posts that sound human, specific, and credible — never like generic AI marketing copy.

VOICE RULES:
- Short paragraphs (1-3 lines). Plenty of white space.
- Pull specific numbers, employers, and project names from the CV context below — never invent metrics.
- No hashtags unless the topic truly needs 2-3 max at the very end.
- No emojis in the first line. Sparingly elsewhere (0-2 total).
- No "I'm excited to announce", "game-changer", "leverage", "synergy", or LinkedIn cringe.
- Write in first person as Mazhar.
- Abu Dhabi / UAE government & enterprise AI context is fair game when relevant.
- If the topic is thin, say less — quality over length.

Output STRICT JSON only (no markdown fences):
{
  "hook": "<optional scroll-stopping first line, max 120 chars>",
  "body": "<full LinkedIn post text, 800-1800 chars ideal>",
  "suggestedHashtags": ["<0-3 tags without #>"]
}`;

export interface GeneratedPost {
  hook: string;
  body: string;
  suggestedHashtags: string[];
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

export async function generateLinkedInPost(input: {
  topic: string;
  template: PostTemplate;
  tone: string;
  extraContext?: string;
  cvAnchor?: string;
}): Promise<GeneratedPost> {
  const apiKey = await resolveGroqApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured. Add it in Admin → Settings.");
  }

  const groq = new Groq({ apiKey });
  const guidance = TEMPLATE_GUIDANCE[input.template];
  const cvContext = buildCvContext({
    topic: input.topic,
    cvAnchor: input.cvAnchor,
    extraContext: input.extraContext,
  });

  const systemPrompt = `${SYSTEM_PROMPT_BASE}

CV CONTEXT (use these facts — do not fabricate):
${cvContext}`;

  const userPrompt = `Write a LinkedIn post grounded in Mazhar's real CV below.

Topic / angle: ${input.topic}
Template: ${input.template} — ${guidance}
Tone: ${input.tone}
${input.cvAnchor ? `CV focus: ${input.cvAnchor}` : ""}
${input.extraContext ? `Extra context from Mazhar: ${input.extraContext}` : ""}

Requirements:
- Cite at least 2 concrete facts from the CV context (metrics, employer, stack, or outcome).
- Match the ${input.template} structure.
- Sound like Mazhar (${PERSONAL.title}), not a generic AI influencer.

Return JSON only.`;

  let completion;
  try {
    completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.75,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    });
  } catch (err) {
    throw new Error(formatGroqError(err));
  }

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty response from Groq.");

  let parsed: GeneratedPost;
  try {
    parsed = JSON.parse(stripJsonFences(raw)) as GeneratedPost;
  } catch {
    throw new Error("Failed to parse generated post JSON.");
  }

  if (!parsed.body?.trim()) {
    throw new Error("Generated post body was empty.");
  }

  const tags = Array.isArray(parsed.suggestedHashtags)
    ? parsed.suggestedHashtags
        .slice(0, 3)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean)
    : [];

  let body = parsed.body.trim();
  if (tags.length > 0 && !body.includes("#")) {
    body += `\n\n${tags.map((t) => `#${t}`).join(" ")}`;
  }

  return {
    hook: parsed.hook?.trim() || body.split("\n")[0]?.slice(0, 120) || "",
    body,
    suggestedHashtags: tags,
  };
}
