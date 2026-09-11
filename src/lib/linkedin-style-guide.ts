/**
 * Human-voice style guide for generated LinkedIn content.
 *
 * Client-safe on purpose: the admin UI imports the length presets, and the
 * audit helpers are unit tested, so nothing here may touch server-only code.
 */

import type { PostLength } from "@/lib/admin-types";

export interface LengthSpec {
  id: PostLength;
  label: string;
  minWords: number;
  maxWords: number;
  guidance: string;
}

/** LinkedIn truncates around 3,000 characters, roughly 500 words. */
export const MAX_CUSTOM_WORDS = 500;
export const MIN_CUSTOM_WORDS = 30;

export const POST_LENGTHS: {
  id: Exclude<PostLength, "custom">;
  label: string;
  hint: string;
  minWords: number;
  maxWords: number;
}[] = [
  {
    id: "short",
    label: "Short",
    hint: "60–110 words · one sharp idea",
    minWords: 60,
    maxWords: 110,
  },
  {
    id: "medium",
    label: "Medium",
    hint: "130–200 words · default feed length",
    minWords: 130,
    maxWords: 200,
  },
  {
    id: "long",
    label: "Long",
    hint: "250–380 words · deep dive",
    minWords: 250,
    maxWords: 380,
  },
];

export function resolveLengthSpec(
  length: PostLength = "medium",
  customWordCount?: number,
): LengthSpec {
  if (length === "custom") {
    const target = Math.min(
      MAX_CUSTOM_WORDS,
      Math.max(MIN_CUSTOM_WORDS, Math.round(customWordCount ?? 180)),
    );
    const slack = Math.max(10, Math.round(target * 0.12));
    return {
      id: "custom",
      label: `${target} words`,
      minWords: Math.max(MIN_CUSTOM_WORDS, target - slack),
      maxWords: Math.min(MAX_CUSTOM_WORDS + slack, target + slack),
      guidance: `Aim for about ${target} words. Cut ruthlessly rather than padding to hit the number.`,
    };
  }

  const preset =
    POST_LENGTHS.find((item) => item.id === length) ?? POST_LENGTHS[1]!;

  const guidance =
    preset.id === "short"
      ? "One idea only. No setup paragraph, no recap. Every line must earn its place."
      : preset.id === "long"
        ? "You have room for a real narrative or breakdown, but no filler. If a paragraph only restates the last one, delete it."
        : "Enough room for a setup, a turn, and a takeaway. Nothing more.";

  return {
    id: preset.id,
    label: preset.label,
    minWords: preset.minWords,
    maxWords: preset.maxWords,
    guidance,
  };
}

interface TellPattern {
  id: string;
  pattern: RegExp;
  issue: string;
}

/**
 * Phrases and constructions that make writing read as machine-generated.
 * Ordered roughly by how strongly readers associate them with AI copy.
 */
const AI_TELL_PATTERNS: TellPattern[] = [
  {
    id: "not-just-x",
    pattern: /\bis(?:n't| not)\s+just\s+[^.!?]{2,60}?,?\s+it'?s\b/i,
    issue: 'Remove the "it\'s not just X, it\'s Y" construction.',
  },
  {
    id: "not-only-but-also",
    pattern: /\bnot only\b[^.!?]{0,80}\bbut also\b/i,
    issue: 'Remove "not only ... but also".',
  },
  {
    id: "corporate-verbs",
    pattern:
      /\b(leverage[ds]?|leveraging|utili[sz]e[ds]?|unlock(?:ing|s)?|unleash(?:ing|es)?|empower(?:ing|s|ed)?|supercharg(?:e|ed|ing)|revolutioni[sz](?:e|ed|ing)|elevat(?:e|ing|es)\s+your)\b/i,
    issue: "Replace corporate verbs (leverage, utilize, unlock, empower, supercharge) with plain ones.",
  },
  {
    id: "buzz-adjectives",
    pattern:
      /\b(seamless(?:ly)?|cutting[- ]edge|state[- ]of[- ]the[- ]art|game[- ]chang(?:er|ing)|transformative|robust solution|next[- ]level|world[- ]class)\b/i,
    issue: "Cut buzzword adjectives (seamless, cutting-edge, game-changer, transformative).",
  },
  {
    id: "essay-connectives",
    pattern: /(^|\n)\s*(moreover|furthermore|in conclusion|to sum up|in summary|ultimately|in essence)\b/i,
    issue: "Drop essay connectives (Moreover, Furthermore, In conclusion, Ultimately).",
  },
  {
    id: "delve",
    pattern: /\b(delv(?:e|ing)|dive deep(?:er)?|let'?s dive|deep dive into)\b/i,
    issue: 'Avoid "delve" and "let\'s dive in".',
  },
  {
    id: "landscape-cliches",
    pattern:
      /\b(ever[- ]evolving|fast[- ]paced world|in today'?s (?:world|landscape|market)|navigat(?:e|ing) the .{0,20}landscape|testament to|plays? a (?:crucial|vital|pivotal|key) role|at the end of the day|when it comes to)\b/i,
    issue: "Remove stock LinkedIn clichés (ever-evolving, in today's world, testament to, at the end of the day).",
  },
  {
    id: "announcement-cringe",
    pattern:
      /\b(excited to (?:announce|share)|thrilled to (?:announce|share)|humbled to|proud to announce|buckle up)\b/i,
    issue: "Remove announcement cringe (excited/thrilled/humbled to share).",
  },
  {
    id: "hedge-adverbs",
    pattern: /\b(arguably|notably|significantly enhanc\w+|truly remarkable)\b/i,
    issue: "Cut hedging adverbs (arguably, notably) — commit to the claim.",
  },
  {
    id: "takeaway-header",
    pattern: /(^|\n)\s*(key takeaways?|takeaways?|the bottom line)\s*:/i,
    issue: 'Remove the "Key takeaways:" summary block.',
  },
  {
    id: "ai-self-reference",
    pattern: /\b(as an ai|language model|i cannot|i'?m unable to)\b/i,
    issue: "Remove assistant self-reference.",
  },
];

const MAX_EM_DASHES = 1;
const MAX_EMOJIS = 2;
const MAX_HASHTAGS = 3;

export function stripHashtagBlock(text: string): string {
  return text.replace(/(^|\n)\s*(#\w[\w-]*\s*)+$/g, "").trim();
}

export function countWords(text: string): number {
  const cleaned = stripHashtagBlock(text)
    .replace(/https?:\/\/\S+/g, "link")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

function splitSentences(text: string): string[] {
  return stripHashtagBlock(text)
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/** Uniform sentence rhythm is the strongest structural AI tell. */
function hasUniformRhythm(text: string): boolean {
  const lengths = splitSentences(text).map(
    (sentence) => sentence.split(/\s+/).length,
  );
  if (lengths.length < 5) return false;

  const mean = lengths.reduce((sum, n) => sum + n, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, n) => sum + (n - mean) ** 2, 0) / lengths.length;

  return Math.sqrt(variance) < 3.5;
}

export interface StyleAudit {
  wordCount: number;
  issues: string[];
}

export interface PostQuality {
  score: number;
  wordCount: number;
  dimensions: {
    authenticity: number;
    readability: number;
    hook: number;
    specificity: number;
  };
  issues: string[];
}

/** Collects everything an editor pass should fix, in priority order. */
export function auditPostBody(body: string, spec: LengthSpec): StyleAudit {
  const issues: string[] = [];
  const wordCount = countWords(body);

  if (wordCount < spec.minWords) {
    issues.push(
      `Too short at ${wordCount} words. Add substance (a concrete detail or consequence) to reach ${spec.minWords}-${spec.maxWords} words.`,
    );
  } else if (wordCount > spec.maxWords) {
    issues.push(
      `Too long at ${wordCount} words. Cut to ${spec.minWords}-${spec.maxWords} words by deleting restated ideas.`,
    );
  }

  for (const tell of AI_TELL_PATTERNS) {
    if (tell.pattern.test(body)) issues.push(tell.issue);
  }

  const emDashes = (body.match(/—/g) ?? []).length;
  if (emDashes > MAX_EM_DASHES) {
    issues.push(
      `Uses ${emDashes} em dashes. Keep at most ${MAX_EM_DASHES}; rewrite the rest as separate sentences.`,
    );
  }

  const emojis = (body.match(/\p{Extended_Pictographic}/gu) ?? []).length;
  if (emojis > MAX_EMOJIS) {
    issues.push(`Uses ${emojis} emojis. Keep at most ${MAX_EMOJIS}.`);
  }

  const hashtags = (body.match(/#\w/g) ?? []).length;
  if (hashtags > MAX_HASHTAGS) {
    issues.push(`Uses ${hashtags} hashtags. Keep at most ${MAX_HASHTAGS}.`);
  }

  if (/\*\*|__|^#{1,6}\s/m.test(body)) {
    issues.push("Remove markdown formatting. LinkedIn renders it as literal characters.");
  }

  if (hasUniformRhythm(body)) {
    issues.push(
      "Sentence lengths are too uniform. Break the rhythm with at least one very short line and one longer one.",
    );
  }

  return { wordCount, issues };
}

export function evaluatePostQuality(
  body: string,
  spec: LengthSpec,
): PostQuality {
  const audit = auditPostBody(body, spec);
  const sentences = splitSentences(body);
  const firstLine = body.split("\n").find((line) => line.trim())?.trim() ?? "";
  const aiTellCount = audit.issues.filter(
    (issue) =>
      !issue.startsWith("Too ") &&
      !issue.startsWith("Uses ") &&
      !issue.startsWith("Remove markdown"),
  ).length;
  const concreteSignals =
    (body.match(/\b\d+(?:[.,]\d+)?(?:%|K|M|x| hours?| days?| users?)?\b/gi) ??
      []).length +
    (body.match(
      /\b(?:Python|TypeScript|Next\.js|React|Azure|AWS|Groq|LinkedIn|API|RAG|LLM|MCP|Abu Dhabi|UAE)\b/gi,
    ) ?? []).length;
  const averageSentenceWords =
    sentences.length > 0
      ? sentences.reduce(
          (sum, sentence) => sum + sentence.split(/\s+/).length,
          0,
        ) / sentences.length
      : 0;

  const authenticity = Math.max(0, 100 - aiTellCount * 16);
  const readability = Math.max(
    0,
    Math.min(
      100,
      100 -
        (averageSentenceWords > 24 ? 20 : 0) -
        ((body.match(/—/g) ?? []).length > MAX_EM_DASHES ? 15 : 0) -
        (/\n{3,}/.test(body) ? 10 : 0),
    ),
  );
  const hook = Math.max(
    0,
    Math.min(
      100,
      55 +
        (firstLine.length >= 20 && firstLine.length <= 120 ? 25 : 0) +
        (/[?!]$/.test(firstLine) || /\d/.test(firstLine) ? 20 : 0) -
        (firstLine.length > 150 ? 30 : 0),
    ),
  );
  const specificity = Math.min(100, 45 + concreteSignals * 12);
  const lengthPenalty =
    audit.wordCount < spec.minWords || audit.wordCount > spec.maxWords ? 12 : 0;
  const score = Math.max(
    0,
    Math.round(
      authenticity * 0.35 +
        readability * 0.2 +
        hook * 0.2 +
        specificity * 0.25 -
        lengthPenalty,
    ),
  );

  return {
    score,
    wordCount: audit.wordCount,
    dimensions: { authenticity, readability, hook, specificity },
    issues: audit.issues,
  };
}

/** Fixes that are safe to apply mechanically, without touching meaning. */
export function sanitizeBody(body: string): string {
  return body
    .replace(/\r\n/g, "\n")
    .replace(/[\u00a0\u202f]/g, " ")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Rotating opener strategy. Without this, every generation reaches for the
 * same "I did X and learned Y" shape, which is what makes a feed look botted.
 */
export const OPENER_STRATEGIES = [
  "Open mid-scene with a concrete moment: a time, a place, a screen, an error message.",
  "Open with a number that sounds wrong until you explain it.",
  "Open with a blunt claim in under 10 words, then justify it.",
  "Open with something you were wrong about.",
  "Open with a question someone actually asked you.",
  "Open with a small, specific detail nobody would bother to invent.",
  "Open with the decision you almost made, and why you didn't.",
];

export function pickOpenerStrategy(): string {
  return OPENER_STRATEGIES[
    Math.floor(Math.random() * OPENER_STRATEGIES.length)
  ]!;
}

export const HUMAN_VOICE_RULES = `HOW HUMANS ACTUALLY WRITE (non-negotiable):
- Vary sentence length aggressively. Mix a 3-word line with a 20-word line. Uniform rhythm is the loudest AI tell.
- Start inside the thought. No scene-setting preamble, no "In this post I want to share".
- Put one specific, checkable detail in the first three lines: a number, a tool name, a place, a timestamp.
- Use plain verbs: shipped, broke, cut, measured, rewrote, missed. Never leverage, utilize, unlock, empower, supercharge.
- Contractions are normal: it's, I'd, we're, didn't.
- One sentence fragment is allowed. Starting a sentence with And, But, or So is allowed.
- Concede something real. Unqualified claims read as marketing.
- End on the sharpest line, a genuine question, or unresolved tension. Never a summary paragraph.
- No markdown, no headers, no bold. LinkedIn renders plain text only.
- At most one em dash in the entire post.
- Digits, not words, for numbers: 38%, 100K, 2 hours.
- Skip explanations a technical reader already has.
- Avoid these entirely: "it's not just X, it's Y", "not only ... but also", "Key takeaways:", "In today's world", "game-changer", "seamless", "cutting-edge", "delve", "Moreover", "In conclusion", "testament to", "at the end of the day".`;
