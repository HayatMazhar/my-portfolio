import "server-only";

import Groq from "groq-sdk";
import { GROQ_CHAT_MODEL } from "@/lib/groq-models";
import { resolveGroqApiKey } from "@/lib/app-settings";
import type { CardCopy, CardTemplate } from "@/lib/linkedin-card";
import type { LinkedInPostRow } from "@/lib/admin-types";

/**
 * Writes the copy that goes on the generated image.
 *
 * Slicing the card text out of the post body produces broken sentences and
 * truncated paragraphs. A card headline is its own editorial artefact — short,
 * declarative, and built to be read at thumbnail size — so it gets written
 * once, stored on the post, and reused for every render.
 */

const TEMPLATE_GUIDE = `Pick the template the post can actually support:
- "stat": the post contains one outcome figure worth enlarging. Use the RESULT, never the baseline it improved on.
- "checklist": the post makes 3-4 parallel points.
- "comparison": the post contrasts a clear before and after.
- "question": the post's central tension is genuinely a question.
- "statement": anything else. This is the default and there is nothing wrong with it.`;

const COPY_RULES = `Rules for every field:
- Write for a reader scrolling past at thumbnail size. Short, concrete, specific.
- Sentence case. No trailing full stops. No hashtags, emoji, quotation marks, or em dashes.
- Never invent a fact, figure, tool, or outcome that is not already in the post.
- No hype words: revolutionary, game-changing, unlock, supercharge, seamless, leverage, delve.
- Do not open with "How to", "Why you should", or "The truth about".

headline: 3-9 words. State a claim, not a topic. "Retrieval quality is a data problem", not "Thoughts on retrieval".
stat: the figure only, with its unit, at most 8 characters. Examples: "95%", "3x", "2 days", "18K".
statLabel: 3-7 words naming what the figure measures. Never repeat the figure itself.
points: 3-4 entries, 2-6 words each, parallel grammar, no numbering.
before / after: at most 10 words each, concrete and comparable.

visualPrompt: 35-80 words describing premium, text-free editorial artwork for
the post. Identify a clear subject, composition, lighting, materials, depth,
and restrained colour palette. Put the focal subject in the upper third or
right side and preserve darker negative space in the lower-left for the
headline. Prefer sophisticated visual metaphors, real environments,
architectural forms, data objects, and tactile materials. Avoid generic glowing
brains, humanoid robots, circuit-board faces, neon cyberpunk, stock-photo
handshakes, UI text, logos, letters, watermarks, and written words.`;

interface RawCopy {
  template?: string;
  headline?: string;
  visualPrompt?: string;
  stat?: string;
  statLabel?: string;
  points?: unknown;
  before?: string;
  after?: string;
}

const TEMPLATES: Exclude<CardTemplate, "auto">[] = [
  "statement",
  "stat",
  "question",
  "comparison",
  "checklist",
];

function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[#*"“”]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[.\s]+$/, "")
    .trim()
    .slice(0, max);
}

/**
 * Never throws: the deterministic layout in `linkedin-card.ts` is a usable
 * fallback, so a failed copy pass should not block the image.
 */
export async function generateCardCopy(
  post: Pick<LinkedInPostRow, "topic" | "hook" | "body">,
  preferred: CardTemplate = "auto",
): Promise<CardCopy | null> {
  try {
    const apiKey = await resolveGroqApiKey();
    if (!apiKey) return null;

    const groq = new Groq({ apiKey });
    const completion = await groq.chat.completions.create({
      model: GROQ_CHAT_MODEL,
      messages: [
        {
          role: "system",
          content: `You are a senior agency art director creating a social-media key visual. Write concise overlay copy and direct a distinctive editorial background image. The artwork and typography must feel like one campaign, not a generic quote card.

${TEMPLATE_GUIDE}

${COPY_RULES}

Return strict JSON: {"template":"...","headline":"...","visualPrompt":"...","stat":"...","statLabel":"...","points":["..."],"before":"...","after":"..."}
Include only the fields the chosen template needs.`,
        },
        {
          role: "user",
          content: `${
            preferred === "auto"
              ? "Choose the best template."
              : `Use the "${preferred}" template unless the post genuinely cannot support it.`
          }

TOPIC: ${post.topic}
${post.hook ? `HOOK: ${post.hook}\n` : ""}
POST:
${post.body.slice(0, 4000)}

Write the card copy as JSON.`,
        },
      ],
      temperature: 0.6,
      reasoning_effort: "low",
      max_completion_tokens: 2048,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;

    const parsed = JSON.parse(
      raw
        .trim()
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, ""),
    ) as RawCopy;

    const headline = clean(parsed.headline, 150);
    if (!headline) return null;

    const template = TEMPLATES.includes(
      parsed.template as Exclude<CardTemplate, "auto">,
    )
      ? (parsed.template as Exclude<CardTemplate, "auto">)
      : "statement";

    const points = Array.isArray(parsed.points)
      ? parsed.points
          .map((point) => clean(point, 72))
          .filter(Boolean)
          .slice(0, 4)
      : [];

    return {
      template,
      headline,
      visualPrompt:
        clean(parsed.visualPrompt, 800) ||
        `Premium editorial illustration about ${clean(post.topic, 180)}, cinematic natural lighting, layered depth, sophisticated dark neutral palette with restrained emerald accents, focal subject in the upper right, generous dark negative space in the lower left, no text, no letters, no logos, no watermark`,
      stat: clean(parsed.stat, 8) || undefined,
      statLabel: clean(parsed.statLabel, 90) || undefined,
      points: points.length > 0 ? points : undefined,
      before: clean(parsed.before, 120) || undefined,
      after: clean(parsed.after, 120) || undefined,
    };
  } catch (err) {
    console.warn("[card-copy] generation failed:", err);
    return null;
  }
}
