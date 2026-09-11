import type { PostAudience, PostTemplate } from "./admin-types";

const AUDIENCE_TAGS: Record<PostAudience, string[]> = {
  general: ["ArtificialIntelligence", "Leadership"],
  recruiters: ["Hiring", "AIJobs", "TechCareers"],
  engineering_leaders: ["CTO", "EngineeringLeadership", "AIArchitecture"],
  developers: ["SoftwareEngineering", "MachineLearning", "Developers"],
  uae_government: ["UAE", "GovTech", "DigitalTransformation"],
};

const TEMPLATE_TAGS: Record<PostTemplate, string[]> = {
  story: ["LessonsLearned"],
  lesson: ["BuildInPublic"],
  case_study: ["CaseStudy"],
  hot_take: ["TechOpinion"],
  hiring_signal: ["OpenToWork"],
};

export function normalizeHashtag(tag: string): string {
  const cleaned = tag
    .replace(/^#+/, "")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .slice(0, 40);
  if (!cleaned) return "";
  return cleaned[0]!.toUpperCase() + cleaned.slice(1);
}

export function suggestHashtags(input: {
  topic: string;
  audience?: PostAudience;
  template?: PostTemplate;
  extra?: string[];
}): string[] {
  const extras = (input.extra ?? []).map(normalizeHashtag).filter(Boolean);
  const fromAudience = AUDIENCE_TAGS[input.audience ?? "general"] ?? [];
  const fromTemplate = TEMPLATE_TAGS[input.template ?? "lesson"] ?? [];
  const fromTopic = input.topic.toLowerCase().includes("rag")
    ? ["RAG"]
    : input.topic.toLowerCase().includes("sql")
      ? ["NLtoSQL"]
      : [];
  const merged = [
    "ArtificialIntelligence",
    ...fromTopic,
    ...fromAudience,
    ...fromTemplate,
    ...extras,
  ]
    .map(normalizeHashtag)
    .filter(Boolean);
  return [...new Set(merged)].slice(0, 5);
}

export function formatHashtagLine(tags: string[]): string {
  return tags
    .map(normalizeHashtag)
    .filter(Boolean)
    .map((tag) => `#${tag}`)
    .join(" ");
}

export function withHashtags(body: string, tags: string[]): string {
  const trimmed = body.trim();
  const existing = new Set(
    (trimmed.match(/#\w+/g) ?? []).map((tag) => tag.slice(1).toLowerCase()),
  );
  const missing = tags
    .map(normalizeHashtag)
    .filter((tag) => tag && !existing.has(tag.toLowerCase()));
  if (missing.length === 0) return trimmed;
  return `${trimmed}\n\n${missing.map((tag) => `#${tag}`).join(" ")}`;
}
