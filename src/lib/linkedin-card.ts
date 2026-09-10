/**
 * Layout selection for the generated LinkedIn image card.
 *
 * Deliberately deterministic and dependency-free: picking the layout from the
 * post's own shape costs nothing, renders the same every time, and is unit
 * testable. An AI call per image would add latency and a failure mode to what
 * is really a formatting decision.
 *
 * Client-safe — the editor imports the template list for its picker.
 */

export type CardTemplate =
  | "auto"
  | "statement"
  | "stat"
  | "question"
  | "comparison"
  | "checklist";

export const CARD_TEMPLATES: { id: CardTemplate; label: string; hint: string }[] =
  [
    { id: "auto", label: "Auto", hint: "picks from the post's shape" },
    { id: "statement", label: "Statement", hint: "one bold line" },
    { id: "stat", label: "Stat", hint: "leads with the number" },
    { id: "question", label: "Question", hint: "opens a loop" },
    { id: "comparison", label: "Comparison", hint: "before vs after" },
    { id: "checklist", label: "Checklist", hint: "up to 4 takeaways" },
  ];

export interface CardLayout {
  template: Exclude<CardTemplate, "auto">;
  kicker: string;
  headline: string;
  /** Populated for the stat template. */
  stat?: string;
  statLabel?: string;
  /** Populated for the checklist template. */
  points?: string[];
  /** Populated for the comparison template. */
  left?: { title: string; body: string };
  right?: { title: string; body: string };
  footer: string;
}

export interface CardSource {
  topic: string;
  hook?: string | null;
  body: string;
  mediaTitle?: string | null;
}

/**
 * Card copy written for the image rather than sliced out of the post.
 *
 * Cutting a figure out of the hook leaves broken sentences ("we cut research
 * from to 2 days"), and a truncated paragraph never reads like a designed card,
 * so this is generated once and stored on the post.
 */
export interface CardCopy {
  template: Exclude<CardTemplate, "auto">;
  headline: string;
  stat?: string;
  statLabel?: string;
  points?: string[];
  before?: string;
  after?: string;
}

/** Builds a layout from written copy, falling back if a field is unusable. */
export function layoutFromCopy(copy: CardCopy): CardLayout {
  const base = { kicker: KICKER, footer: FOOTER };
  const headline = clamp(copy.headline, 150);

  if (copy.template === "stat" && copy.stat?.trim()) {
    return {
      ...base,
      template: "stat",
      stat: copy.stat.trim(),
      headline: clamp(copy.statLabel?.trim() || headline, 90),
      statLabel: clamp(copy.statLabel?.trim() || headline, 90),
    };
  }

  if (copy.template === "checklist" && (copy.points?.length ?? 0) >= 2) {
    return {
      ...base,
      template: "checklist",
      headline: clamp(headline, 90),
      points: copy.points!.map((point) => clamp(point, 72)).slice(0, 4),
    };
  }

  if (copy.template === "comparison" && copy.before?.trim() && copy.after?.trim()) {
    return {
      ...base,
      template: "comparison",
      headline: clamp(headline, 80),
      left: { title: "Before", body: clamp(copy.before, 120) },
      right: { title: "After", body: clamp(copy.after, 120) },
    };
  }

  return {
    ...base,
    template: copy.template === "question" ? "question" : "statement",
    headline,
  };
}

const KICKER = "MAZHAR HAYAT · AI & SOFTWARE ENGINEERING";
const FOOTER = "mazharhayat.live";

/**
 * Matches 38%, 100K+, 2.5x, 18 hours — the kind of figure worth enlarging.
 * No trailing \b: it would reject the unit on "95%", since `%` is not a word
 * character.
 */
const STAT_PATTERN =
  /(?<![\w.])(\d[\d,]*(?:\.\d+)?\s?(?:%|x|K\+?|M\+?|bn|hours?|days?|weeks?|months?|years?|ms)?)/i;

const COMPARISON_PATTERN =
  /\b(before|after|old way|new way|instead of|used to|now|previously|vs\.?|versus)\b/i;

function lines(body: string): string[] {
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function stripBullet(line: string): string {
  return line.replace(/^\s*(?:[-*•–—]|\d+[.)])\s*/, "").trim();
}

function isBullet(line: string): boolean {
  return /^\s*(?:[-*•–—]|\d+[.)])\s+/.test(line);
}

function stripHashtags(text: string): string {
  return text.replace(/(^|\s)#[\w-]+/g, "").replace(/\s+/g, " ").trim();
}

function sentences(body: string): string[] {
  return stripHashtags(body)
    .replace(/\n+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/** The card must stay readable at feed size, so long headlines get clipped. */
function clamp(text: string, max: number): string {
  const clean = stripHashtags(text);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

function headlineFrom(source: CardSource): string {
  const explicit = source.mediaTitle?.trim() || source.hook?.trim();
  if (explicit) return explicit;
  const first = lines(source.body)[0];
  return stripBullet(first ?? "") || source.topic;
}

function detectTemplate(source: CardSource): Exclude<CardTemplate, "auto"> {
  const headline = headlineFrom(source);
  const bodyLines = lines(source.body);
  const bullets = bodyLines.filter(isBullet);

  if (headline.trim().endsWith("?")) return "question";
  if (bullets.length >= 3) return "checklist";

  // Only treat a number as the subject when it sits in the opening line.
  if (STAT_PATTERN.test(headline) && /\d/.test(headline)) return "stat";

  if (COMPARISON_PATTERN.test(stripHashtags(source.body))) return "comparison";
  return "statement";
}

function buildStat(source: CardSource, headline: string): CardLayout {
  const match = headline.match(STAT_PATTERN);
  const stat = match?.[1]?.trim() ?? "";
  // The remaining words explain what the figure measures.
  const label = clamp(headline.replace(stat, "").replace(/^[^\w]+/, ""), 90);
  return {
    template: "stat",
    kicker: KICKER,
    headline: label,
    stat,
    statLabel: label,
    footer: FOOTER,
  };
}

function buildChecklist(source: CardSource, headline: string): CardLayout {
  const points = lines(source.body)
    .filter(isBullet)
    .map((line) => clamp(stripBullet(line), 72))
    .filter(Boolean)
    .slice(0, 4);
  return {
    template: "checklist",
    kicker: KICKER,
    headline: clamp(headline, 90),
    points,
    footer: FOOTER,
  };
}

function buildComparison(source: CardSource, headline: string): CardLayout {
  const parts = sentences(source.body).filter((sentence) =>
    COMPARISON_PATTERN.test(sentence),
  );
  const before = parts[0] ?? sentences(source.body)[0] ?? "";
  const after = parts[1] ?? sentences(source.body)[1] ?? "";
  return {
    template: "comparison",
    kicker: KICKER,
    headline: clamp(headline, 80),
    left: { title: "Before", body: clamp(before, 120) },
    right: { title: "After", body: clamp(after, 120) },
    footer: FOOTER,
  };
}

export function buildCardLayout(
  source: CardSource,
  override: CardTemplate = "auto",
): CardLayout {
  const headline = headlineFrom(source);
  const template = override === "auto" ? detectTemplate(source) : override;

  switch (template) {
    case "stat": {
      const layout = buildStat(source, headline);
      // An explicit override can land on a headline with no number in it.
      return layout.stat
        ? layout
        : { ...layout, template: "statement", headline: clamp(headline, 150) };
    }
    case "checklist": {
      const layout = buildChecklist(source, headline);
      return layout.points && layout.points.length >= 2
        ? layout
        : {
            template: "statement",
            kicker: KICKER,
            headline: clamp(headline, 150),
            footer: FOOTER,
          };
    }
    case "comparison": {
      const layout = buildComparison(source, headline);
      return layout.left?.body && layout.right?.body
        ? layout
        : {
            template: "statement",
            kicker: KICKER,
            headline: clamp(headline, 150),
            footer: FOOTER,
          };
    }
    case "question":
      return {
        template: "question",
        kicker: KICKER,
        headline: clamp(headline, 140),
        footer: FOOTER,
      };
    default:
      return {
        template: "statement",
        kicker: KICKER,
        headline: clamp(headline, 150),
        footer: FOOTER,
      };
  }
}
