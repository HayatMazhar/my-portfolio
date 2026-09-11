import "server-only";

import Groq from "groq-sdk";
import { PERSONAL } from "@/data/cv";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";
import { resolveGroqApiKey } from "@/lib/app-settings";
import { buildCvContext } from "@/lib/linkedin-cv-context";
import { fetchTrendGrounding } from "@/lib/trend-grounding";
import {
  HUMAN_VOICE_RULES,
  auditPostBody,
  pickOpenerStrategy,
  resolveLengthSpec,
  sanitizeBody,
  type LengthSpec,
} from "@/lib/linkedin-style-guide";
import type {
  PostAudience,
  PostGenerationMode,
  PostLength,
  PostTemplate,
  PostVariant,
} from "@/lib/admin-types";

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
- No hashtags unless the topic truly needs 2-3 max at the very end.
- No emojis in the first line. Sparingly elsewhere (0-2 total).
- No "I'm excited to announce", "game-changer", "leverage", "synergy", or LinkedIn cringe.
- Write in first person as Mazhar.
- Abu Dhabi / UAE government & enterprise AI context is fair game when relevant.
- Never imply Mazhar used, tested, or endorses a tool unless the supplied context says so.
- Never invent product announcements, release details, benchmarks, dates, metrics, or quotes.
- Clearly distinguish reported facts from Mazhar's analysis or opinion.

Output STRICT JSON only (no markdown fences):
{
  "hook": "<optional scroll-stopping first line, max 120 chars>",
  "body": "<best full LinkedIn post>",
  "suggestedHashtags": ["<0-3 tags without #>"],
  "alternativeHooks": ["<2 substantially different hooks>"],
  "variants": [
    { "label": "Story", "hook": "...", "body": "..." },
    { "label": "Direct", "hook": "...", "body": "..." },
    { "label": "Technical", "hook": "...", "body": "..." }
  ]
}`;

const COMPACT_JSON_SCHEMA = `Output STRICT JSON only (no markdown fences):
{
  "hook": "<scroll-stopping first line, max 120 chars>",
  "body": "<full LinkedIn post>",
  "suggestedHashtags": ["<0-3 tags without #>"],
  "alternativeHooks": ["<2 different hooks>"]
}`;

export interface GeneratedPost {
  hook: string;
  body: string;
  suggestedHashtags: string[];
  alternativeHooks: string[];
  variants: PostVariant[];
  qualityIssues: string[];
}

function stripJsonFences(text: string): string {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

function isJsonValidateFailure(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "status" in err &&
    (err as { status?: number }).status === 400 &&
    JSON.stringify((err as { error?: unknown }).error ?? "").includes(
      "json_validate_failed",
    )
  );
}

function completionTokenBudget(length?: PostLength): number {
  if (length === "long") return 10_240;
  if (length === "short") return 6144;
  return 8192;
}

function formatGroqError(err: unknown): string {
  if (isJsonValidateFailure(err)) {
    return "The AI ran out of space while writing the post. Try again, or choose a shorter length.";
  }
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes("invalid_api_key") ||
    raw.includes("Invalid API Key") ||
    raw.includes("401")
  ) {
    return "Invalid Groq API key. Open Admin → Settings, paste a key from console.groq.com, and save.";
  }
  if (raw.includes("429") || raw.toLowerCase().includes("rate limit")) {
    return "Groq rate limit hit. Wait a moment and try again.";
  }
  return raw;
}

function parseGeneratedPostJson(raw: string): {
  hook?: string;
  body?: string;
  suggestedHashtags?: string[];
  alternativeHooks?: string[];
  variants?: Array<Partial<PostVariant>>;
} {
  return JSON.parse(stripJsonFences(raw)) as {
    hook?: string;
    body?: string;
    suggestedHashtags?: string[];
    alternativeHooks?: string[];
    variants?: Array<Partial<PostVariant>>;
  };
}

/**
 * One targeted editing pass against the audit findings. Never throws: a failed
 * cleanup should leave the original draft (and its issue list) intact rather
 * than losing the post.
 */
async function reviseForQuality(params: {
  groq: Groq;
  body: string;
  issues: string[];
  spec: LengthSpec;
  audience: PostAudience;
}): Promise<string | null> {
  try {
    const completion = await params.groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a ruthless copy editor for Mazhar Hayat's LinkedIn posts.

${HUMAN_VOICE_RULES}

Fix every listed issue. Preserve every factual claim, number, name, and opinion exactly as written — you may reorder and rewrite sentences, but never add experience, metrics, tools, or news that is not already in the draft. Plain text only.

Return strict JSON: {"body":"<edited post>"}`,
        },
        {
          role: "user",
          content: `Audience: ${params.audience.replaceAll("_", " ")}
Target length: ${params.spec.minWords}-${params.spec.maxWords} words.

ISSUES TO FIX:
${params.issues.map((issue, index) => `${index + 1}. ${issue}`).join("\n")}

DRAFT:
${params.body}

Return the edited post as JSON.`,
        },
      ],
      temperature: 0.45,
      reasoning_effort: "low",
      max_completion_tokens: 6144,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    const parsed = JSON.parse(stripJsonFences(raw)) as { body?: string };
    const revised = sanitizeBody(parsed.body ?? "");
    return revised.trim() ? revised : null;
  } catch (err) {
    console.warn("[post-generator] quality revision pass failed:", err);
    return null;
  }
}

export async function generateLinkedInPost(input: {
  topic: string;
  template: PostTemplate;
  tone: string;
  mode?: PostGenerationMode;
  extraContext?: string;
  cvAnchor?: string;
  sourceTitle?: string;
  sourceUrl?: string;
  sourceName?: string;
  sourceContext?: string;
  length?: PostLength;
  customWordCount?: number;
  audience?: PostAudience;
  styleExamples?: string[];
  performanceInsights?: string;
}): Promise<GeneratedPost> {
  const apiKey = await resolveGroqApiKey();
  if (!apiKey) {
    throw new Error("Groq API key is not configured. Add it in Admin → Settings.");
  }

  const groq = new Groq({ apiKey });
  const guidance = TEMPLATE_GUIDANCE[input.template];
  const mode = input.mode ?? "cv";
  const lengthSpec = resolveLengthSpec(
    input.length ?? "medium",
    input.customWordCount,
  );
  const audience = input.audience ?? "general";
  const cvContext =
    mode === "cv"
      ? buildCvContext({
          topic: input.topic,
          cvAnchor: input.cvAnchor,
          extraContext: input.extraContext,
        })
      : "";
  // Reading the article gives the model real detail to cite; a headline alone
  // invites invented specifics.
  const grounding =
    mode === "trend" ? await fetchTrendGrounding(input.sourceUrl) : null;

  const sourceBlock = [
    input.sourceTitle ? `Headline: ${input.sourceTitle}` : "",
    input.sourceName ? `Source: ${input.sourceName}` : "",
    input.sourceUrl ? `URL: ${input.sourceUrl}` : "",
    input.sourceContext ? `Available context: ${input.sourceContext}` : "",
    grounding?.ok
      ? `\nARTICLE TEXT (verified — quote and reason from this, never beyond it):\n${grounding.text}`
      : grounding
        ? `\nArticle text unavailable (${grounding.note}). Treat the headline as unverified and stay cautious.`
        : "",
  ]
    .filter(Boolean)
    .join("\n");

  const modeInstructions: Record<PostGenerationMode, string> = {
    cv: `Ground the post in Mazhar's real experience.
- Cite at least 2 concrete facts from the CV context when relevant.
- Never add experience, metrics, employers, or outcomes not present in that context.

CV CONTEXT:
${cvContext}`,
    trend: `Write a timely analysis of the supplied technology trend.
- Use only claims present in TREND SOURCE CONTEXT or broadly stable technical knowledge.
- When ARTICLE TEXT is present, cite at least two specifics from it (a number, a name, a constraint, a stated limitation).
- Attribute the news/trend to its source when useful.
- Do not pretend Mazhar tested or used the tool.
- Focus on practical implications, trade-offs, and what builders should watch.
- If source context is sparse, write a cautious opinion rather than filling gaps.

TREND SOURCE CONTEXT:
${sourceBlock || "No source details supplied. Treat the topic as an opinion prompt, not verified news."}`,
    custom: `Write from the user's topic and notes without forcing CV references.
- It may be educational, analytical, opinionated, or a tool comparison.
- Do not fabricate personal experience or current-news details.
- Use Mazhar's professional voice, but only mention his background if explicitly supplied.`,
  };

  const sharedContext = `GENERATION MODE: ${mode.toUpperCase()}
${modeInstructions[mode]}

${HUMAN_VOICE_RULES}`;

  const postBrief = `Write a LinkedIn post in ${mode} mode.

Topic / angle: ${input.topic}
Template: ${input.template} — ${guidance}
Tone: ${input.tone}
Audience: ${audience.replaceAll("_", " ")}
Length: ${lengthSpec.minWords}-${lengthSpec.maxWords} words, excluding hashtags.
${lengthSpec.guidance}
${input.cvAnchor ? `CV focus: ${input.cvAnchor}` : ""}
${input.extraContext ? `Extra context from Mazhar: ${input.extraContext}` : ""}
${input.styleExamples?.length ? `\nAPPROVED STYLE EXAMPLES (copy the cadence and restraint, never their facts):\n${input.styleExamples.map((example, index) => `Example ${index + 1}:\n${example.slice(0, 900)}`).join("\n\n")}` : ""}
${input.performanceInsights ? `\nWHAT HAS PERFORMED WELL BEFORE:\n${input.performanceInsights}` : ""}`;

  const fullRequirements = `Requirements:
- Match the ${input.template} structure.
- Sound like Mazhar (${PERSONAL.title}), not a generic AI influencer.
- Make the first two lines strong enough to earn a "see more" click.
- Give the reader a useful insight, not a rewritten headline.
- ${pickOpenerStrategy()}
- Produce 3 genuinely different variants: narrative, direct opinion, and technical/practical. Do not merely swap their hooks.
- Supply 2 extra hooks for A/B testing.
- Every variant must stay inside the requested word range.

Return JSON only.`;

  const compactRequirements = `Requirements:
- Match the ${input.template} structure.
- Sound like Mazhar (${PERSONAL.title}), not a generic AI influencer.
- Make the first two lines strong enough to earn a "see more" click.
- Give the reader a useful insight, not a rewritten headline.
- ${pickOpenerStrategy()}
- Supply 2 extra hooks for A/B testing.
- Stay inside the requested word range.

Return JSON only.`;

  let parsed:
    | {
        hook?: string;
        body?: string;
        suggestedHashtags?: string[];
        alternativeHooks?: string[];
        variants?: Array<Partial<PostVariant>>;
      }
    | undefined;

  for (let attempt = 0; attempt < 2; attempt++) {
    const compact = attempt === 1;
    const systemPrompt = compact
      ? `${COMPACT_JSON_SCHEMA}

${sharedContext}`
      : `${SYSTEM_PROMPT_BASE}

${sharedContext}`;
    const userPrompt = `${postBrief}

${compact ? compactRequirements : fullRequirements}`;

    let completion;
    try {
      completion = await groq.chat.completions.create({
        model: GROQ_CHAT_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: compact ? 0.65 : 0.75,
        // Reasoning models spend budget before JSON; keep effort low and leave
        // room for hook + body + variants.
        reasoning_effort: "low",
        max_completion_tokens: compact
          ? Math.min(completionTokenBudget(input.length), 6144)
          : completionTokenBudget(input.length),
        response_format: { type: "json_object" },
      });
    } catch (err) {
      if (isJsonValidateFailure(err) && !compact) continue;
      throw new Error(formatGroqError(err));
    }

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      if (!compact) continue;
      throw new Error("Empty response from Groq.");
    }

    try {
      parsed = parseGeneratedPostJson(raw);
    } catch {
      if (!compact) continue;
      throw new Error("Failed to parse generated post JSON.");
    }

    if (parsed.body?.trim()) break;
    if (compact) {
      throw new Error("Generated post body was empty.");
    }
  }

  if (!parsed?.body?.trim()) {
    throw new Error(
      "The AI could not finish the post. Try again or choose a shorter length.",
    );
  }

  const tags = Array.isArray(parsed.suggestedHashtags)
    ? parsed.suggestedHashtags
        .slice(0, 3)
        .map((t) => t.replace(/^#/, "").trim())
        .filter(Boolean)
    : [];

  let body = sanitizeBody(parsed.body);
  const variants = (parsed.variants ?? [])
    .filter((variant) => variant?.body?.trim())
    .slice(0, 3)
    .map((variant, index) => {
      const variantBody = sanitizeBody(variant.body ?? "");
      return {
        id: `variant-${index + 1}`,
        label: variant.label?.trim() || `Variant ${index + 1}`,
        hook:
          variant.hook?.trim() ||
          variantBody.split("\n")[0]?.slice(0, 120) ||
          "",
        body: variantBody,
      };
    });

  if (variants.length === 0) {
    variants.push({
      id: "variant-1",
      label: "Primary",
      hook: parsed.hook?.trim() || body.split("\n")[0]?.slice(0, 120) || "",
      body,
    });
  }

  // The audit already knows what a human editor would flag, so hand those
  // findings back to the model instead of leaving them for manual cleanup.
  let audit = auditPostBody(body, lengthSpec);
  if (audit.issues.length > 0) {
    const revised = await reviseForQuality({
      groq,
      body,
      issues: audit.issues,
      spec: lengthSpec,
      audience,
    });
    if (revised) {
      const revisedAudit = auditPostBody(revised, lengthSpec);
      // Only accept a genuine improvement; editing passes can introduce new tells.
      if (revisedAudit.issues.length < audit.issues.length) {
        body = revised;
        audit = revisedAudit;
      }
    }
  }

  if (tags.length > 0 && !body.includes("#")) {
    body += `\n\n${tags.map((t) => `#${t}`).join(" ")}`;
  }

  return {
    hook: parsed.hook?.trim() || body.split("\n")[0]?.slice(0, 120) || "",
    body,
    suggestedHashtags: tags,
    alternativeHooks: Array.isArray(parsed.alternativeHooks)
      ? parsed.alternativeHooks
          .map((hook) => String(hook).trim().slice(0, 160))
          .filter(Boolean)
          .slice(0, 2)
      : [],
    variants,
    qualityIssues: audit.issues,
  };
}
